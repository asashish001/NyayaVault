import { prisma } from "@/lib/db";

export type Citation = {
  docId: string;
  title: string;
};

export type AiResponse = {
  answer: string;
  citations: Citation[];
};

export async function generateContextAwarePrompt(query: string, caseId: string) {
  // Fetch all documents for this case that have OCR data
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
  // Guardrail: Refusal to make legal conclusions (Rule R18)
  const conclusionKeywords = ["guilty", "innocent", "convict", "sentence", "who committed", "crime", "did he do it"];
  if (conclusionKeywords.some(kw => query.toLowerCase().includes(kw))) {
    return {
      answer: "I cannot provide legal conclusions, determine guilt, or act as a judge. I can only extract factual statements and summaries from the provided case documents.",
      citations: []
    };
  }

  // Guardrail: No context available
  const docsWithText = contextDocs.filter(d => d.ocrData?.rawText);
  if (docsWithText.length === 0) {
    return {
      answer: "I do not have any searchable OCR text available for this case. Please ensure documents are uploaded and processed through the IDP pipeline.",
      citations: []
    };
  }

  // Simulate RAG extraction
  let answer = "Based on the provided case files, I could not find a specific answer to your query.";
  const citations: Citation[] = [];

  const lowerQuery = query.toLowerCase();

  // Simple heuristic matching for MVP
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
        answer = "The names of the individuals involved are listed in the document's header section.";
        matchFound = true;
      }
    } else if (lowerQuery.includes("date") || lowerQuery.includes("when")) {
      if (lowerText.includes("date") || lowerText.includes("202")) {
        answer = "The incident date is recorded in the initial report.";
        matchFound = true;
      }
    } else if (lowerQuery.includes("summary") || lowerQuery.includes("summarize")) {
      answer = "This document appears to be an official police or court record detailing an incident under investigation.";
      matchFound = true;
    }

    if (matchFound) {
      citations.push({ docId: doc.id, title: doc.title });
      break; // Just return the first decent match for the mock
    }
  }

  // Fallback if no specific heuristic matches but we have text
  if (citations.length === 0) {
    answer = `I found information in the case files, but couldn't precisely extract an answer to "${query}". Here is a general reference.`;
    citations.push({ docId: docsWithText[0].id, title: docsWithText[0].title });
  }

  // Simulate a slight network delay to feel like an LLM
  await new Promise(resolve => setTimeout(resolve, 800));

  return { answer, citations };
}
