import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";
import { getStorage } from "@/lib/storage";
import { processDocument } from "@/lib/ocr/idp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: docId }
  });

  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "view_document", // Requires view permission to run processing
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) return NextResponse.json({ error: authResult.reason }, { status: authResult.status });

  const versionRecord = await prisma.documentVersion.findUnique({
    where: { documentId_version: { documentId: docId, version: document.currentVersion } }
  });

  if (!versionRecord) return NextResponse.json({ error: "Document version not found" }, { status: 404 });

  // 1. Fetch encrypted file and decrypt
  const storage = getStorage();
  let buffer: Buffer;
  try {
    buffer = await storage.get(versionRecord.storageKey);
  } catch (error) {
    return NextResponse.json({ error: "Storage decryption failed" }, { status: 500 });
  }

  // 2. Run OCR / IDP Pipeline
  const ocrResult = await processDocument(buffer, versionRecord.mimeType, document.type);

  // 3. Store result and update document status
  const extractionJson = JSON.stringify({
    fields: ocrResult.extractedData,
    confidences: ocrResult.fieldConfidence
  });

  // Check if any field has low confidence
  const needsReview = Object.values(ocrResult.fieldConfidence).some(c => c < 0.7);
  const nextStatus = needsReview ? "MANUAL_REVIEW" : "APPROVED";

  await prisma.$transaction(async (tx) => {
    await tx.ocrExtraction.upsert({
      where: { documentId: docId },
      create: {
        documentId: docId,
        version: versionRecord.version,
        rawText: ocrResult.rawText,
        confidence: ocrResult.confidence,
        extractedData: extractionJson,
        status: nextStatus === "APPROVED" ? "APPROVED" : "PENDING"
      },
      update: {
        version: versionRecord.version,
        rawText: ocrResult.rawText,
        confidence: ocrResult.confidence,
        extractedData: extractionJson,
        status: nextStatus === "APPROVED" ? "APPROVED" : "PENDING",
        reviewedById: null,
        reviewedAt: null,
      }
    });

    await tx.document.update({
      where: { id: docId },
      data: { status: nextStatus }
    });
  });

  await writeAudit({
    actorId: user.id,
    role: user.role,
    action: "AI_QUERY",
    result: "SUCCESS",
    caseId: document.caseId,
    documentId: document.id,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
    userAgent: request.headers.get("user-agent"),
    reason: `OCR pipeline completed. Next status: ${nextStatus}`,
  });

  return NextResponse.json({ 
    success: true, 
    status: nextStatus,
    needsReview
  });
}
