import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const openai = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { caseId } = await params;

  // ABAC: Ensure the user is assigned to this case
  const authResult = await authorizeCase({
    user,
    caseId,
    action: "view_case",
    userAgent: request.headers.get("user-agent"),
  });

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.reason }, { status: authResult.status });
  }

  // 1. Fetch all documents for this case that have OCR text
  const docs = await prisma.document.findMany({
    where: { caseId },
    include: { ocrData: true }
  });

  const docsWithText = docs.filter(d => d.ocrData?.rawText);
  
  if (docsWithText.length === 0) {
    return NextResponse.json({ error: "No documents with searchable text available to summarize." }, { status: 400 });
  }

  const contextBlocks = docsWithText
    .map(d => `--- DOCUMENT [ID: ${d.id} | TITLE: ${d.title}] ---\n${d.ocrData!.rawText}`);

  const prompt = `
System Context: You are a secure AI Case Assistant. Rely ONLY on the provided documents to write a comprehensive case summary.
Task: Write a concise, professional case summary aggregating the facts from all the provided documents. Do not include fictional disclaimers. Focus purely on the facts, timeline, and involved parties.

Context Documents:
${contextBlocks.join("\n\n")}
`;

  try {
    const { object } = await generateObject({
      model: openai(process.env.OLLAMA_MODEL || 'qwen:latest'),
      schema: z.object({
        summary: z.string().describe("The comprehensive professional case summary based on the documents.")
      }),
      prompt,
    });

    const newSummary = object.summary;

    // 2. Update the case record
    await prisma.caseRecord.update({
      where: { id: caseId },
      data: { summary: newSummary }
    });

    // 3. Log the AI Action to Audit Log
    await writeAudit({
      actorId: user.id,
      role: user.role,
      action: "APPROVAL", // Using APPROVAL or AI_QUERY logic, let's use AI_QUERY
      result: "SUCCESS",
      caseId: caseId,
      documentId: null,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
      userAgent: request.headers.get("user-agent"),
      reason: `User generated dynamic AI Case Summary via LLM`,
    });

    return NextResponse.json({ success: true, summary: newSummary });
  } catch (error) {
    console.error("AI Summary generation failed:", error);
    return NextResponse.json({ error: "Failed to generate AI summary from the local LLM." }, { status: 500 });
  }
}
