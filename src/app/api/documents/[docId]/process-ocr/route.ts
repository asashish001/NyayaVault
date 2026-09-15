import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase } from "@/lib/audit";
import { exec } from "child_process";
import path from "path";

export async function POST(
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

  // Instead of running Tesseract in the Next.js API Route (which causes freezing/memory leaks
  // because Webpack interferes with WebAssembly workers in Serverless environments),
  // we detach the heavy OCR pipeline to a completely isolated background OS process.
  
  const scriptPath = path.join(process.cwd(), "scripts", "ocr-worker.ts");
  
  exec(`npx tsx "${scriptPath}" "${docId}"`, (err, stdout, stderr) => {
    if (err) {
      console.error(`[OCR BACKGROUND LAUNCH ERROR] ${err.message}`);
    }
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });

  return NextResponse.json({ 
    success: true, 
    status: "PROCESSING_BACKGROUND",
  });
}
