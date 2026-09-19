import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      case: true,
      uploadedBy: true,
      versions: { orderBy: { version: 'desc' } },
      custodyEvents: { include: { actor: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "view_document",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.reason }, { status: authResult.status });
  }

  // Generate PDF
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { height, width } = page.getSize();
  let y = height - 50;

  const drawText = (text: string, fontType = font, size = 12) => {
    if (y < 50) {
      page = pdfDoc.addPage([600, 800]);
      y = 750;
    }
    page.drawText(text, { x: 50, y, size, font: fontType, color: rgb(0, 0, 0) });
    y -= size + 8;
  };

  drawText("CERTIFICATE UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM, 2023", boldFont, 12);
  y -= 20;

  drawText(`Case Number: ${document.case.caseNumber}`, font, 11);
  drawText(`Document Title: ${document.title}`, font, 11);
  drawText(`Document ID: ${document.id}`, font, 11);
  drawText(`Classification: ${document.classification}`, font, 11);
  y -= 10;

  drawText("1. Description of Electronic Record:", boldFont, 11);
  drawText(`   Type: ${document.type}`, font, 11);
  drawText(`   Current Version: v${document.currentVersion}`, font, 11);
  drawText(`   Original Uploader: ${document.uploadedBy.name} (${document.uploadedBy.role})`, font, 11);
  drawText(`   Upload Date: ${document.createdAt.toISOString()}`, font, 11);
  y -= 10;

  const latestVersion = document.versions[0];
  if (latestVersion) {
    drawText("2. Integrity Hash (SHA-256):", boldFont, 11);
    drawText(`   File Name: ${latestVersion.originalName}`, font, 11);
    drawText(`   Hash: ${latestVersion.sha256Hash}`, font, 10);
    drawText(`   Proof ID: ${latestVersion.ledgerProofId || "Pending"}`, font, 10);
    y -= 10;
  }

  drawText("3. Chain of Custody Events:", boldFont, 11);
  if (document.custodyEvents.length > 0) {
    for (const event of document.custodyEvents) {
      drawText(`   - [${event.createdAt.toISOString()}] Transferred to ${event.toDepartment}`, font, 10);
      drawText(`     By: ${event.actor.name} | Reason: ${event.reason}`, font, 10);
    }
  } else {
    drawText("   No custody transfers recorded.", font, 10);
  }
  y -= 20;

  drawText("DECLARATION", boldFont, 11);
  const declaration = "I hereby certify that the electronic record described above was produced by a computer system which was operating properly and the data has not been tampered with. This certificate is generated automatically by NyayaVault in compliance with BSA Section 63.";
  
  const words = declaration.split(' ');
  let line = '';
  for (const word of words) {
    if (line.length + word.length > 80) {
      drawText(line, font, 11);
      line = word + ' ';
    } else {
      line += word + ' ';
    }
  }
  if (line) drawText(line, font, 11);
  
  y -= 30;
  drawText(`System Generated On: ${new Date().toISOString()}`, font, 9);
  drawText(`Requested By: ${user.name} (${user.role})`, font, 9);
  drawText(`IP Address: ${request.headers.get("x-forwarded-for") || "local"}`, font, 9);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Section_63_Cert_${document.id}.pdf"`,
    },
  });
}
