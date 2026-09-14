import { prisma } from "@/lib/db";
import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { processDocument } from "./ocr/idp";

const openai = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export async function processDocumentOcr(documentId: string, version: number, buffer: Buffer, mimeType: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;

  // Run the new IDP pipeline (Tesseract for images, pdf-parse for PDFs)
  const ocrResult = await processDocument(buffer, mimeType, doc.type);

  const extractionJson = JSON.stringify({
    fields: ocrResult.extractedData,
    confidences: ocrResult.fieldConfidence
  });

  // Check if any field has low confidence
  const needsReview = Object.values(ocrResult.fieldConfidence).some(c => c < 0.7);
  const nextStatus = needsReview ? "MANUAL_REVIEW" : "APPROVED";

  // Chunk and Embed for Vector Search (only if API key is present)
  let chunks: { text: string; embedding: string }[] = [];
  if (process.env.OPENAI_API_KEY && ocrResult.rawText && !ocrResult.rawText.includes("[PDF contained no extractable text")) {
    // Simple semantic chunking by paragraph
    const textChunks = ocrResult.rawText.split(/\n\s*\n/).filter(c => c.trim().length > 20);
    
    if (textChunks.length > 0) {
      try {
        const { embeddings } = await embedMany({
          model: openai.embedding(process.env.OLLAMA_EMBED_MODEL || 'text-embedding-3-small'),
          values: textChunks,
        });

        chunks = textChunks.map((text, i) => ({
          text,
          embedding: JSON.stringify(embeddings[i]),
        }));
      } catch (error) {
        console.error("Embedding generation failed:", error);
      }
    }
  }

  await prisma.$transaction([
    prisma.ocrExtraction.create({
      data: {
        documentId,
        version,
        rawText: ocrResult.rawText,
        confidence: ocrResult.confidence,
        extractedData: extractionJson,
        status: nextStatus === "APPROVED" ? "APPROVED" : "PENDING"
      }
    }),
    prisma.document.update({
      where: { id: documentId },
      data: { status: nextStatus }
    }),
    ...(chunks.length > 0 ? [
      prisma.documentChunk.createMany({
        data: chunks.map(c => ({
          documentId,
          text: c.text,
          embedding: c.embedding
        }))
      })
    ] : [])
  ]);
}
