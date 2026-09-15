import { prisma } from "@/lib/db";
import { generateObject, embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const openai = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export type Citation = {
  docId: string;
  title: string;
};

export type AiResponse = {
  answer: string;
  citations: Citation[];
  mode?: "FULL" | "DEGRADED";
};

export async function generateContextAwarePrompt(query: string, caseId: string) {
  const docs = await prisma.document.findMany({
    where: { caseId },
    include: { ocrData: true }
  });

  const contextBlocks = docs
    .filter(d => d.ocrData?.rawText)
    .map(d => `--- DOCUMENT [ID: ${d.id} | TITLE: ${d.title}] ---\n${d.ocrData!.rawText}`);

  const prompt = `
System Context: You are a secure AI Case Assistant. Rely ONLY on the provided documents.
User Query: ${query}
Context Documents:
${contextBlocks.join("\n\n")}
`;

  return { prompt, docs };
}

export async function mockLlmInference(query: string, contextDocs: any[]): Promise<AiResponse> {
  const conclusionKeywords = ["guilty", "innocent", "convict", "sentence", "who committed", "crime", "did he do it"];
  if (conclusionKeywords.some(kw => query.toLowerCase().includes(kw))) {
    return {
      answer: "I cannot provide legal conclusions, determine guilt, or act as a judge. I can only extract factual statements and summaries from the provided case documents.",
      citations: []
    };
  }

  const docsWithText = contextDocs.filter(d => d.ocrData?.rawText);
  if (docsWithText.length === 0) {
    return {
      answer: "I do not have any searchable OCR text available for this case. Please ensure documents are uploaded and processed through the IDP pipeline.",
      citations: []
    };
  }

  let answer = "Based on the provided case files, I could not find a specific answer to your query.";
  const citations: Citation[] = [];
  const lowerQuery = query.toLowerCase();

  for (const doc of docsWithText) {
    const lowerText = doc.ocrData.rawText.toLowerCase();
    let matchFound = false;
    
    if (lowerQuery.includes("fir") || lowerQuery.includes("number")) {
      if (lowerText.includes("fir") || lowerText.includes("no.")) {
        answer = "The FIR number mentioned is identified in the case records.";
        matchFound = true;
      }
    } else if (lowerQuery.includes("name") || lowerQuery.includes("accused") || lowerQuery.includes("who")) {
      if (lowerText.includes("accused") || lowerText.includes("name")) {
        answer = "The names of the individuals involved are listed in the document's header section or statement.";
        matchFound = true;
      }
    } else if (lowerQuery.includes("date") || lowerQuery.includes("when")) {
      if (lowerText.includes("date") || lowerText.includes("202")) {
        answer = "The incident date is recorded in the initial report or statements.";
        matchFound = true;
      }
    } else if (lowerQuery.includes("summary") || lowerQuery.includes("summarize") || lowerQuery.includes("statement")) {
      answer = "The case files contain official police records and witness statements detailing the incident.";
      matchFound = true;
    }

    if (matchFound) {
      citations.push({ docId: doc.id, title: doc.title });
    }
  }

  if (citations.length === 0) {
    answer = `I found information in the case files, but couldn't precisely extract an answer to "${query}". Here is a general reference.`;
    citations.push(...docsWithText.map(d => ({ docId: d.id, title: d.title })));
  }

  await new Promise(resolve => setTimeout(resolve, 800));

  return { answer, citations };
}

// ---- Real RAG Pipeline ----

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function performRealRagInference(query: string, caseId: string): Promise<AiResponse> {
  const conclusionKeywords = ["guilty", "innocent", "convict", "sentence", "who committed", "crime", "did he do it"];
  if (conclusionKeywords.some(kw => query.toLowerCase().includes(kw))) {
    return {
      answer: "I cannot provide legal conclusions, determine guilt, or act as a judge. I can only extract factual statements and summaries from the provided case documents.",
      citations: []
    };
  }

  const chunks = await prisma.documentChunk.findMany({
    where: { document: { caseId } },
    include: { document: true }
  });

  if (chunks.length === 0) {
    throw new Error("No searchable OCR text chunks available. LLM embeddings might have failed.");
  }

  try {
    let embedding: number[] = [];
    try {
      const res = await embed({
        model: openai.embedding(process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'),
        value: query,
      });
      embedding = res.embedding;
    } catch (e) {
      console.warn("Embedding failed, falling back to basic matching", e);
      // Fallback: If embedding fails, we'll just use all chunks (or default score 0)
    }

    const scoredChunks = chunks.map(chunk => {
      let chunkEmbedding: number[] = [];
      try {
        chunkEmbedding = JSON.parse(chunk.embedding);
      } catch { }
      const score = chunkEmbedding.length > 0 ? cosineSimilarity(embedding, chunkEmbedding) : 0;
      return { ...chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 5);

    const contextBlocks = topChunks.map(c => 
      `--- DOCUMENT [ID: ${c.documentId} | TITLE: ${c.document.title}] ---\n${c.text}`
    );

    const prompt = `
System Context: You are a secure AI Case Assistant. Rely ONLY on the provided document excerpts below to answer the User Query. If the answer is not in the context, state that you do not know. Do not hallucinate. Provide accurate citations using the Document IDs and Titles provided.
User Query: ${query}

Context Documents:
${contextBlocks.join("\n\n")}
`;

      const { object } = await generateObject({
        model: openai(process.env.OLLAMA_MODEL || 'qwen:latest'),
      schema: z.object({
        answer: z.string().describe("The answer to the user's query based strictly on the context."),
        citations: z.array(z.object({
          docId: z.string(),
          title: z.string()
        })).describe("A list of exact document citations that contributed to the answer.")
      }),
      prompt,
    });

    return object;
  } catch (error) {
    console.error("Real RAG Inference failed:", error);
    return { answer: "An error occurred while communicating with the AI service. Please ensure API keys are correctly configured.", citations: [] };
  }
}
