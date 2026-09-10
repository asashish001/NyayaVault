import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: { ocrData: true }
  });

  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "view_document",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) return NextResponse.json({ error: authResult.reason }, { status: authResult.status });

  if (!document.ocrData) {
    return NextResponse.json({ error: "No OCR data found for this document" }, { status: 404 });
  }

  // Parse the JSON string
  let extractedData;
  try {
    extractedData = JSON.parse(document.ocrData.extractedData);
  } catch {
    extractedData = { fields: {}, confidences: {} };
  }

  return NextResponse.json({ 
    rawText: document.ocrData.rawText,
    confidence: document.ocrData.confidence,
    status: document.ocrData.status,
    extractedData
  });
}
