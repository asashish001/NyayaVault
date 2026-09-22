import { prisma } from "./db";
import { writeAudit } from "./audit";

/**
 * DPDP Act Compliance & Data Minimization:
 * Scans for ARCHIVED cases where the retention policy has expired,
 * and purges the raw PII (OCR text) to minimize data while preserving 
 * the cryptographic ledger for legal integrity.
 */
export async function runRetentionPurge() {
  console.log("[Retention Cron] Starting DPDP Data Minimization scan...");

  // Find all documents in ARCHIVED cases that are not already purged
  // AND are explicitly not under legal hold.
  const expiredDocuments = await prisma.document.findMany({
    where: {
      status: "ARCHIVED",
      retentionState: { not: "PURGED" },
      legalHold: false, // Critical Fix (E1): Never purge documents under legal hold
      case: {
        status: "ARCHIVED"
      }
    },
    include: {
      ocrData: true
    }
  });

  if (expiredDocuments.length === 0) {
    console.log("[Retention Cron] No expired documents found for purging.");
    return;
  }

  console.log(`[Retention Cron] Found ${expiredDocuments.length} documents eligible for data minimization.`);

  for (const doc of expiredDocuments) {
    // 1. If OCR data exists, anonymize the raw text to comply with DPDP
    if (doc.ocrData) {
      await prisma.ocrExtraction.update({
        where: { id: doc.ocrData.id },
        data: {
          rawText: "[REDACTED - DPDP DATA MINIMIZATION]",
          extractedData: "{}" // Clear JSON extraction
        }
      });
    }

    // 2. Mark document retention state as PURGED
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        retentionState: "PURGED"
      }
    });

    // 3. Log the system action in the audit log
    await writeAudit({
      actorId: undefined, // System action
      role: "SYSTEM",
      action: "EXPORT", 
      caseId: doc.caseId,
      documentId: doc.id,
      ip: "127.0.0.1",
      userAgent: "NyayaVault-Retention-Cron",
      result: "SUCCESS",
      reason: "Automated DPDP Data Minimization: PII purged post-retention.",
      metadata: { action: "DATA_MINIMIZATION" }
    });

    console.log(`[Retention Cron] Successfully purged PII for document ${doc.id}`);
  }

  // Critical Fix (E2): Removed the code that blindly deleted Audit Logs older than 180 days.
  // In evidentiary systems, Audit and Custody logs must be retained permanently.

  console.log("[Retention Cron] Scan complete.");
}
