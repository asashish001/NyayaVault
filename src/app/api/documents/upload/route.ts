import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase } from "@/lib/audit";
import { getStorage } from "@/lib/storage";
import { computeSha256, appendLedgerEvent } from "@/lib/integrity";
import { validateUploadFile } from "@/lib/validators";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const caseId = formData.get("caseId") as string | null;
  const title = formData.get("title") as string | null;
  const docType = formData.get("docType") as string | null;
  const existingDocId = formData.get("documentId") as string | null;

  if (!file || !caseId) {
    return NextResponse.json({ error: "Missing file or caseId" }, { status: 400 });
  }

  // File validation (R11)
  const validationError = validateUploadFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // ABAC Check (R6, R7)
  const authResult = await authorizeCase({
    user,
    caseId,
    action: "upload",
    userAgent: request.headers.get("user-agent"),
  });
  if (!authResult.ok || !authResult.case) {
    return NextResponse.json({ error: authResult.reason }, { status: authResult.status });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Compute SHA-256 Hash of original file (R9)
  const sha256Hash = computeSha256(buffer);

  // Determine storage key
  const storageKey = `doc_${crypto.randomBytes(16).toString("hex")}`;
  
  let documentRecord: any;
  let versionNumber = 1;
  let prevVersionHash: string | null = null;

  await prisma.$transaction(async (tx) => {
    if (existingDocId) {
      // New version of existing document
      documentRecord = await tx.document.findUnique({ where: { id: existingDocId } });
      if (!documentRecord) throw new Error("Document not found");
      
      versionNumber = documentRecord.currentVersion + 1;
      
      const prevVersion = await tx.documentVersion.findUnique({
        where: { documentId_version: { documentId: documentRecord.id, version: documentRecord.currentVersion } }
      });
      prevVersionHash = prevVersion?.sha256Hash || null;

      documentRecord = await tx.document.update({
        where: { id: documentRecord.id },
        data: { currentVersion: versionNumber, status: "PROCESSING" }
      });
    } else {
      // New document
      if (!docType || !title) throw new Error("Missing docType or title for new document");
      documentRecord = await tx.document.create({
        data: {
          caseId,
          title,
          type: docType as any,
          classification: authResult.case.classification, // inherit from case for demo
          ownerDepartment: (user as any).department || "Unknown",
          currentVersion: 1,
          uploadedById: user.id,
          status: "PROCESSING",
        }
      });
    }

    const versionRecord = await tx.documentVersion.create({
      data: {
        documentId: documentRecord.id,
        version: versionNumber,
        storageKey,
        sha256Hash,
        prevVersionHash,
        mimeType: file.type,
        byteSize: file.size,
        originalName: file.name,
      }
    });

    // Write to ledger
    const ledgerEvent = await appendLedgerEvent({
      actorId: user.id,
      eventType: "DOCUMENT_UPLOAD",
      documentId: documentRecord.id,
      versionId: versionRecord.id,
      metadata: { fileName: file.name, hash: sha256Hash, size: file.size },
    });

    // Link ledger proof back to version
    await tx.documentVersion.update({
      where: { id: versionRecord.id },
      data: { ledgerProofId: ledgerEvent.proofId }
    });
  });

  if (!documentRecord) {
    return NextResponse.json({ error: "Failed to create DB records" }, { status: 500 });
  }

  // Write file to encrypted storage adapter (R5)
  const storage = getStorage();
  await storage.put(storageKey, buffer, file.type);

  return NextResponse.json({ 
    success: true, 
    documentId: documentRecord.id,
    version: versionNumber,
    hash: sha256Hash
  });
}
