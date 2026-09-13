import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";
import { getStorage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { docId } = await params;

  // 1. Fetch document and its latest version
  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!document || document.versions.length === 0) {
    return new NextResponse("Document not found", { status: 404 });
  }

  // 2. Check ABAC authorization (using 'view_document' action)
  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "view_document",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) {
    return new NextResponse(authResult.reason, { status: authResult.status });
  }

  const latestVersion = document.versions[0];
  const storageKey = latestVersion.storageKey;

  try {
    // 3. Fetch and decrypt file from secure storage
    const storage = getStorage();
    const fileBuffer = await storage.get(storageKey);

    // 4. Write an audit log for the download action
    await writeAudit({
      actorId: user.id,
      role: user.role,
      action: "DOWNLOAD",
      result: "SUCCESS",
      caseId: document.caseId,
      documentId: document.id,
      ip: request.headers.get("x-forwarded-for") || "local",
      userAgent: request.headers.get("user-agent") || "Browser",
      reason: "Downloaded decrypted document file",
    });

    // 5. Return the file as a downloadable attachment
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": latestVersion.mimeType,
        "Content-Disposition": `attachment; filename="${latestVersion.originalName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error decrypting/downloading document:", error);
    
    // Log the failure
    await writeAudit({
      actorId: user.id,
      role: user.role,
      action: "DOWNLOAD",
      result: "ERROR",
      caseId: document.caseId,
      documentId: document.id,
      ip: request.headers.get("x-forwarded-for") || "local",
      userAgent: request.headers.get("user-agent") || "Browser",
      reason: "Failed to decrypt or read file buffer",
    });

    return new NextResponse("Internal server error during decryption", { status: 500 });
  }
}
