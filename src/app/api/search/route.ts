import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // 1. Get user's assigned cases (ABAC Enforcement)
  const assignments = await prisma.caseAssignment.findMany({
    where: { userId: user.id },
    select: { caseId: true }
  });
  const caseIds = assignments.map(a => a.caseId);

  // 2. Perform Keyword Search across Metadata and OCR text
  const results = await prisma.document.findMany({
    where: {
      caseId: { in: caseIds },
      OR: [
        { title: { contains: q } },
        { case: { caseNumber: { contains: q } } },
        {
          ocrData: {
            rawText: { contains: q }
          }
        }
      ]
    },
    include: {
      case: { select: { caseNumber: true } },
      ocrData: { select: { rawText: true, status: true } }
    },
    take: 50
  });

  const formatted = results.map((doc: any) => {
    // Generate a snippet of the OCR text if matched
    let snippet = null;
    if (doc.ocrData?.rawText) {
      const idx = doc.ocrData.rawText.toLowerCase().indexOf(q.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(doc.ocrData.rawText.length, idx + q.length + 40);
        snippet = `...${doc.ocrData.rawText.substring(start, end).replace(/\n/g, " ")}...`;
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      caseNumber: doc.case.caseNumber,
      snippet,
      status: doc.status
    };
  });

  return NextResponse.json({ results: formatted });
}
