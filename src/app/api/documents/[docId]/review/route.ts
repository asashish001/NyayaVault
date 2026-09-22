import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";

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

  const { correctedFields } = body;
  if (!correctedFields) {
    return NextResponse.json({ error: "Missing correctedFields" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: { ocrData: true }
  });

  if (!document || !document.ocrData) {
    return NextResponse.json({ error: "Document or OCR data not found" }, { status: 404 });
  }

  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "review_ocr", 
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) return NextResponse.json({ error: authResult.reason }, { status: authResult.status });

  // Update extracted data
  let existingData;
  try {
    existingData = JSON.parse(document.ocrData.extractedData);
  } catch {
    existingData = { fields: {}, confidences: {} };
  }

  // Merge corrections. When an officer reviews, we set confidence of that field to 1.0
  const updatedFields = { ...existingData.fields, ...correctedFields };
  const updatedConfidences = { ...existingData.confidences };
  
  for (const key of Object.keys(correctedFields)) {
    updatedConfidences[key] = 1.0;
  }

  const newExtractedData = JSON.stringify({
    fields: updatedFields,
    confidences: updatedConfidences,
  });

  await prisma.$transaction(async (tx) => {
    await tx.ocrExtraction.update({
      where: { id: document.ocrData!.id },
      data: {
        extractedData: newExtractedData,
        status: "APPROVED",
        reviewedById: user.id,
        reviewedAt: new Date(),
      }
    });

    await tx.document.update({
      where: { id: docId },
      data: { status: "APPROVED" }
    });
  });

  await writeAudit({
    actorId: user.id,
    role: user.role,
    action: "APPROVAL",
    result: "SUCCESS",
    caseId: document.caseId,
    documentId: document.id,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
    userAgent: request.headers.get("user-agent"),
    reason: `Officer manually reviewed and approved OCR fields`,
  });

  return NextResponse.json({ success: true, status: "APPROVED" });
}
