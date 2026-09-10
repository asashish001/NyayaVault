import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase } from "@/lib/audit";
import { env } from "@/lib/env";
import path from "path";
import fs from "fs/promises";

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

  const versionRecord = await prisma.documentVersion.findUnique({
    where: { documentId_version: { documentId: docId, version: document.currentVersion } }
  });

  if (!versionRecord) {
    return NextResponse.json({ error: "Document version not found" }, { status: 404 });
  }

  // Intentionally tamper with the file on disk by bypassing the storage adapter
  // and appending garbage bytes to the encrypted payload.
  const rootDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.storageRoot);
  const filePath = path.join(rootDir, versionRecord.storageKey);

  try {
    // Append 8 bytes of garbage to the end of the encrypted file
    await fs.appendFile(filePath, Buffer.from("TAMPERED", "utf-8"));
  } catch (error) {
    console.error("Failed to tamper file:", error);
    return NextResponse.json({ error: "Failed to modify file on disk" }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: "File successfully tampered on disk. Run integrity check to detect it." 
  });
}
