import { prisma } from "../src/lib/db";
import { getStorage } from "../src/lib/storage";
import { processDocument } from "../src/lib/ocr/idp";

async function run() {
  try {
    const docId = "cmu25fx8e0003tp98v3zjiohg";
    console.log("Fetching doc", docId);
    const document = await prisma.document.findUnique({ where: { id: docId } });
    if (!document) throw new Error("Doc not found");
    
    const versionRecord = await prisma.documentVersion.findUnique({ where: { documentId_version: { documentId: docId, version: document.currentVersion } } });
    if (!versionRecord) throw new Error("Version not found");
    
    console.log("Fetching from storage:", versionRecord.storageKey);
    const storage = getStorage();
    const buffer = await storage.get(versionRecord.storageKey);
    console.log("Got buffer:", buffer.length, "bytes");
    
    console.log("Running OCR...");
    const ocrResult = await processDocument(buffer, versionRecord.mimeType, document.type);
    console.log("OCR Result:", ocrResult.rawText.substring(0, 100));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
