import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { ocrData: true }
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: doc.status,
    hasOcr: !!doc.ocrData,
    needsReview: doc.status === "MANUAL_REVIEW"
  });
}
