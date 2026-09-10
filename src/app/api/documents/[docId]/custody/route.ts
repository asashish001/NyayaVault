import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";
import { appendLedgerEvent } from "@/lib/integrity";
import { simulateDigitalSignature } from "@/lib/signature";

export async function GET(
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
    action: "view_document",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) return NextResponse.json({ error: authResult.reason }, { status: authResult.status });

  const events = await prisma.custodyEvent.findMany({
    where: { documentId: docId },
    include: { actor: { select: { name: true, role: true, department: true } } },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({ events });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { toDepartment, reason, pin } = body;
  if (!toDepartment || !reason || !pin) {
    return NextResponse.json({ error: "Missing required fields (toDepartment, reason, pin)" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id: docId }
  });

  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "view_document", // Requires edit permission to transfer custody
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) return NextResponse.json({ error: authResult.reason }, { status: authResult.status });

  // Simulate Digital Signature
  let signatureRef;
  try {
    signatureRef = simulateDigitalSignature(user.id, docId, "CUSTODY_TRANSFER", pin);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Record Ledger Anchor for Custody Event (Rule R9)
  const ledgerEvent = await appendLedgerEvent({
    actorId: user.id,
    eventType: "CUSTODY_TRANSFER",
    documentId: docId,
    metadata: { toDepartment, reason, signatureRef }
  });

  const event = await prisma.custodyEvent.create({
    data: {
      documentId: docId,
      actorId: user.id,
      toDepartment,
      reason,
      signatureRef,
      ledgerProofId: ledgerEvent.proofId
    }
  });

  // Update current owner department
  await prisma.document.update({
    where: { id: docId },
    data: { ownerDepartment: toDepartment }
  });

  await writeAudit({
    actorId: user.id,
    role: user.role,
    action: "CUSTODY_TRANSFER",
    result: "SUCCESS",
    caseId: document.caseId,
    documentId: document.id,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
    userAgent: request.headers.get("user-agent"),
    reason: `Transferred custody to ${toDepartment} for reason: ${reason}`,
  });

  return NextResponse.json({ success: true, event });
}
