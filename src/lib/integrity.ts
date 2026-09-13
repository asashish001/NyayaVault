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
