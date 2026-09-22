import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { generateEmbedding, cosineSimilarity } from "@/lib/ai/embeddings";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { caseId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { query } = body;
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const authResult = await authorizeCase({
    user,
    caseId,
    action: "ask_assistant",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.reason }, { status: authResult.status });
  }

  try {
    // 1. Embed the query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Fetch all chunks for documents in this case
    // In a real app we'd use pgvector, but here we do in-memory cosine similarity
    const documents = await prisma.document.findMany({
      where: { caseId },
      select: { id: true, title: true }
    });
    
    const docIds = documents.map(d => d.id);
    
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId: { in: docIds } }
    });

    // 3. Compute similarities
    const scoredChunks = chunks.map(chunk => {
      const chunkEmbedding = JSON.parse(chunk.embedding);
      const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
      return { ...chunk, score };
    });

    // 4. Sort and take top 3
    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 3);

    // 5. Format context with citations
    const docMap = new Map(documents.map(d => [d.id, d.title]));
    
    const contextBlocks = topChunks.map(chunk => 
      `--- [DocID: ${chunk.documentId}] (Title: ${docMap.get(chunk.documentId)}) ---\n${chunk.text}`
    );

    return NextResponse.json({ 
      context: contextBlocks.length > 0 ? contextBlocks.join("\n\n") : "No relevant documents found." 
    });

  } catch (error) {
    console.error("RAG Context Error:", error);
    return NextResponse.json({ error: "Failed to generate RAG context" }, { status: 500 });
  }
}
