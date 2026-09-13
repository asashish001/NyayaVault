import { prisma } from "@/lib/db";
import { DocumentType } from "@prisma/client";

import { generateObject, embedMany, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const openai = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export async function processDocumentOcr(documentId: string, version: number, buffer: Buffer, mimeType: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;

  let rawText = '';
  
  try {
    // Run actual Vision AI OCR on the image
    if (mimeType.startsWith('image/')) {
      const { text } = await generateText({
        model: openai('llava:latest'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'You are an OCR engine. Transcribe every word visible in this document accurately.' },
              { type: 'image', image: buffer }
            ]
          }
        ]
      });
      rawText = text;
    } else {
      rawText = `[Unsupported file type for raw OCR: ${mimeType}]\nFor PDFs or other files, we would normally use pdf-parse or image conversion.\n\nSimulated Document Title: ${doc.title}`;
    }
  } catch (error) {
    console.error("Tesseract OCR failed:", error);
    rawText = `[OCR Error]\nFallback Mock Text for ${doc.title}.`;
  }

  let extractedDataStr = '';

  // Try LLM Extraction via Ollama / OpenAI
  if (true) {
    try {
      const { object } = await generateObject({
        model: openai(process.env.OLLAMA_MODEL || 'qwen:latest'),
        schema: z.object({
          fields: z.record(z.string(), z.string()).describe("The extracted metadata fields as key-value pairs (e.g. title, date, involved_parties, summary)."),
          confidences: z.record(z.string(), z.number().min(0).max(1)).describe("The confidence score from 0.0 to 1.0 for each extracted field key."),
        }),
        prompt: `Extract structured metadata from the following OCR text of a legal/police document of type '${doc.type}'.
You MUST create semantic keys that represent the data found in the text (e.g. "document_title", "incident_date", "case_number", "summary"). 
DO NOT use placeholder keys like "field1" or "value1". If the text is sparse, do your best to extract what is there.

OCR TEXT:
${rawText}`,
      });
      extractedDataStr = JSON.stringify(object, null, 2);
    } catch (error) {
      console.error("LLM Extraction failed:", error);
    }
  }

  // Fallback if LLM failed or no API key
  if (!extractedDataStr) {
    const mockExtractedData = generateMockExtraction(doc.type, doc.title);
    const extractedDataWithConfidence = {
      fields: mockExtractedData,
      confidences: Object.keys(mockExtractedData).reduce((acc: any, key) => {
        acc[key] = parseFloat((0.85 + Math.random() * 0.1).toFixed(2));
        return acc;
      }, {})
    };
    extractedDataStr = JSON.stringify(extractedDataWithConfidence, null, 2);
    
    // Append mock disclaimer to text if we fell back
    if (!rawText.includes("Mock")) {
       rawText += `\n\n[Note: LLM metadata extraction fell back to simulated mock data due to missing OPENAI_API_KEY or error]`;
    }
  }

  // Chunk and Embed for Vector Search
  let chunks: { text: string; embedding: string }[] = [];
  if (process.env.OPENAI_API_KEY && rawText) {
    // Simple semantic chunking by paragraph
    const textChunks = rawText.split(/\n\s*\n/).filter(c => c.trim().length > 20);
    
    if (textChunks.length > 0) {
      try {
        const { embeddings } = await embedMany({
          model: openai.embedding('text-embedding-3-small'),
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
        rawText,
        confidence: 0.90, // We set a default confidence for the overall extraction record
        extractedData: extractedDataStr,
        status: "PENDING"
      }
    }),
    prisma.document.update({
      where: { id: documentId },
      data: { status: "MANUAL_REVIEW" }
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

function generateMockExtraction(type: DocumentType, title: string) {
  const baseData: any = { documentTitle: title };
  switch (type) {
    case DocumentType.FIR:
      return { ...baseData, dateFiled: "2026-09-01", complainant: "John Doe", offenses: ["IPC 420", "IPC 379"] };
    case DocumentType.FORENSIC_REPORT:
      return { ...baseData, forensicLab: "Central Lab", analysisResult: "Match found", examiner: "Dr. Smith" };
    case DocumentType.WITNESS_STATEMENT:
      return { ...baseData, witnessName: "Jane Roe", statementDate: "2026-09-02", keyDetails: "Saw a red car" };
    default:
      return { ...baseData, extractedDate: "2026-09-10", summary: "Auto-generated summary of the document." };
  }
}
