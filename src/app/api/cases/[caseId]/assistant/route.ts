import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";
import { generateContextAwarePrompt, mockLlmInference } from "@/lib/ai/assistant";

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
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

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

  // 1. Generate Prompt & Context
  const { prompt, docs } = await generateContextAwarePrompt(query, caseId);

  // 2. Perform Mock Inference
  const response = await mockLlmInference(query, docs);

  // 3. Log the AI Query to Audit Log
  await writeAudit({
    actorId: user.id,
    role: user.role,
    action: "AI_QUERY",
    result: "SUCCESS",
    caseId: caseId,
    documentId: response.citations.length > 0 ? response.citations[0].docId : null,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
    userAgent: request.headers.get("user-agent"),
    reason: `User queried AI: "${query.substring(0, 50)}..."`,
    // In a real system, you might not log the raw prompt text if it violates PII, 
    // but for this MVP, audit trails capture the interaction.
  });

  return NextResponse.json(response);
}
