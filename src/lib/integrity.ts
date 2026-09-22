import crypto from "crypto";
import { prisma } from "@/lib/db";

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function appendLedgerEvent(params: {
  actorId?: string;
  eventType: string;
  documentId?: string;
  versionId?: string;
  metadata?: Record<string, unknown>;
  txClient?: any; // Pass existing transaction to avoid SQLite deadlocks
}) {
  const execute = async (tx: any) => {
    const lastEvent = await tx.ledgerEvent.findFirst({
      orderBy: { sequence: "desc" },
    });

    const sequence = lastEvent ? lastEvent.sequence + 1 : 1;
    const prevHash = lastEvent ? lastEvent.eventHash : "GENESIS";
    
    const timestamp = new Date();
    const metadataJson = JSON.stringify(params.metadata || {});
    
    const eventString = [
      sequence.toString(),
      prevHash,
      params.eventType,
      params.actorId || "",
      params.documentId || "",
      params.versionId || "",
      metadataJson,
      timestamp.toISOString()
    ].join("|");

    const eventHash = computeSha256(Buffer.from(eventString, "utf-8"));
    const proofId = `PROOF-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    return tx.ledgerEvent.create({
      data: {
        sequence,
        prevHash,
        eventHash,
        timestamp,
        actorId: params.actorId,
        eventType: params.eventType,
        documentId: params.documentId,
        versionId: params.versionId,
        proofId,
        metadataJson,
      },
    });
  };

  if (params.txClient) {
    return execute(params.txClient);
  } else {
    return prisma.$transaction(execute);
  }
}

export async function verifyLedgerChain(): Promise<{ valid: boolean; error?: string }> {
  const events = await prisma.ledgerEvent.findMany({
    orderBy: { sequence: "asc" },
  });

  let expectedPrevHash = "GENESIS";
  let expectedSequence = 1;

  for (const event of events) {
    if (event.sequence !== expectedSequence) {
      return { valid: false, error: `Sequence gap detected at sequence ${event.sequence}. Expected ${expectedSequence}.` };
    }
    if (event.prevHash !== expectedPrevHash) {
      return { valid: false, error: `Hash chain broken at sequence ${event.sequence}. Expected prevHash ${expectedPrevHash}, got ${event.prevHash}.` };
    }

    const eventString = [
      event.sequence.toString(),
      event.prevHash,
      event.eventType,
      event.actorId || "",
      event.documentId || "",
      event.versionId || "",
      event.metadataJson,
      event.timestamp.toISOString()
    ].join("|");

    const recomputedHash = computeSha256(Buffer.from(eventString, "utf-8"));

    if (recomputedHash !== event.eventHash) {
      return { valid: false, error: `Event hash mismatch at sequence ${event.sequence}. Recomputed hash does not match stored hash.` };
    }

    expectedPrevHash = event.eventHash;
    expectedSequence++;
  }

  return { valid: true };
}
