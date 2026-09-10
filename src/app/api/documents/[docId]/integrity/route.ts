import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";
import { getStorage } from "@/lib/storage";
import { computeSha256 } from "@/lib/integrity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;
  const versionParam = request.nextUrl.searchParams.get("version");

  const document = await prisma.document.findUnique({
    where: { id: docId }
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "view_document",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.reason }, { status: authResult.status });
  }

  const targetVersion = versionParam ? parseInt(versionParam, 10) : document.currentVersion;

  const versionRecord = await prisma.documentVersion.findUnique({
    where: { documentId_version: { documentId: docId, version: targetVersion } }
  });

  if (!versionRecord) {
    return NextResponse.json({ error: "Document version not found" }, { status: 404 });
  }

  // Fetch from storage
  const storage = getStorage();
  let buffer: Buffer;
  try {
    buffer = await storage.get(versionRecord.storageKey);
  } catch (error) {
    // If decryption fails due to tampering (e.g. invalid AES padding), we catch it here.
    await writeAudit({
      actorId: user.id,
      role: user.role,
      action: "INTEGRITY_VERIFICATION",
      result: "ERROR",
      caseId: document.caseId,
      documentId: document.id,
      reason: "Storage decryption error - likely tampered",
    });
    return NextResponse.json({ 
      status: "MISMATCH", 
      computedHash: "DECRYPTION_FAILED",
      anchoredHash: versionRecord.sha256Hash,
      ledgerTxRef: versionRecord.ledgerProofId,
      error: "Storage decryption failed"
    });
  }

  // Recompute hash
  const computedHash = computeSha256(buffer);

  // Get ledger event
  let anchoredHash = versionRecord.sha256Hash;
  let ledgerTxRef = versionRecord.ledgerProofId;

  if (versionRecord.ledgerProofId) {
    const ledgerEvent = await prisma.ledgerEvent.findUnique({
      where: { proofId: versionRecord.ledgerProofId }
    });
    if (ledgerEvent) {
      // The eventHash of the ledger represents the hash of the whole event string, 
      // but we can just surface the stored metadata hash for simplicity.
      try {
        const meta = JSON.parse(ledgerEvent.metadataJson);
        if (meta.hash) anchoredHash = meta.hash;
      } catch (e) {
        // fallback
      }
    }
  }

  const isMatch = computedHash === versionRecord.sha256Hash;

  await writeAudit({
    actorId: user.id,
    role: user.role,
    action: "INTEGRITY_VERIFICATION",
    result: isMatch ? "SUCCESS" : "ERROR",
    caseId: document.caseId,
    documentId: document.id,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
    userAgent: request.headers.get("user-agent"),
    reason: isMatch ? "Hash verified successfully" : "Hash mismatch detected",
  });

  return NextResponse.json({
    status: isMatch ? "VERIFIED" : "MISMATCH",
    computedHash,
    anchoredHash,
    ledgerTxRef,
  });
}
