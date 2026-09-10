import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;
  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      versions: {
        where: { version: undefined }, // We'll just fetch the latest version below
        orderBy: { version: "desc" },
        take: 1
      }
    }
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

  return NextResponse.json({ document });
}

export async function DELETE(
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

  if (user.role !== "ADMIN" && user.role !== "JUDGE_AUDITOR") {
    return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 });
  }

  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "view_case",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) return NextResponse.json({ error: authResult.reason }, { status: authResult.status });

  // Legal Hold Check
  if (document.legalHold) {
    await writeAudit({
      actorId: user.id,
      role: user.role,
      action: "ACCESS_DENIED",
      result: "DENIED",
      caseId: document.caseId,
      documentId: document.id,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0] || "local",
      userAgent: request.headers.get("user-agent"),
      reason: "Attempted to delete a document under active LEGAL HOLD.",
    });

    return NextResponse.json({ 
      error: "Compliance Violation: This document is under active Legal Hold and cannot be deleted.",
      status: "LEGAL_HOLD_ACTIVE"
    }, { status: 403 });
  }
  
  await prisma.document.update({
    where: { id: docId },
    data: { status: "ARCHIVED" } // Soft delete
  });

  await writeAudit({
    actorId: user.id,
    role: user.role,
    action: "APPROVAL", 
    result: "SUCCESS",
    caseId: document.caseId,
    documentId: document.id,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0] || "local",
    userAgent: request.headers.get("user-agent"),
    reason: "Document successfully archived.",
  });

  return NextResponse.json({ success: true, message: "Document archived" });
}
