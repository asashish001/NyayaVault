import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assignments = await prisma.caseAssignment.findMany({
    where: { userId: user.id },
    select: { caseId: true }
  });

  const caseIds = assignments.map(a => a.caseId);

  const docs = await prisma.document.findMany({
    where: { caseId: { in: caseIds } },
    include: {
      case: { select: { caseNumber: true } },
      ocrData: { select: { extractedData: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const formatted = docs.map(doc => {
    let ocrKeys: string[] = [];
    if (doc.ocrData?.extractedData) {
      try {
        const parsed = JSON.parse(doc.ocrData.extractedData);
        ocrKeys = Object.keys(parsed.fields || {});
      } catch (e) {
        // ignore JSON parse error
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      caseNumber: doc.case.caseNumber,
      ocrKeys
    };
  });

  return NextResponse.json({ documents: formatted });
}
