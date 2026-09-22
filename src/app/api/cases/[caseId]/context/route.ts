import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { caseId } = await params;

  const authResult = await authorizeCase({
    user,
    caseId,
    action: "ask_assistant",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.reason }, { status: authResult.status });
  }

  const docs = await prisma.document.findMany({
    where: { caseId },
    include: { ocrData: true }
  });

  const contextBlocks = docs
    .filter(d => d.ocrData?.rawText)
    .map(d => `--- DOCUMENT [ID: ${d.id} | TITLE: ${d.title}] ---\n${d.ocrData!.rawText}`);

  return NextResponse.json({ context: contextBlocks.join("\n\n") });
}
