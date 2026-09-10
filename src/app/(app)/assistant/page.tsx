import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { AiAssistant } from "@/components/AiAssistant";
import { evaluateAccess } from "@/lib/auth/abac";

export default async function AssistantPage({
  searchParams
}: {
  searchParams: Promise<{ caseId?: string }>
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const resolvedSearchParams = await searchParams;

  // Fetch cases assigned to the user
  const assignments = await prisma.caseAssignment.findMany({
    where: { userId: user.id },
    include: { case: true },
  });

  // Filter cases where the user actually has 'view' permissions based on ABAC
  const viewableCases = assignments
    .filter((row) =>
      evaluateAccess({
        role: user.role,
        assigned: true,
        caseClassification: row.case.classification,
        action: "view_case",
      }).allowed
    )
    .map((row) => ({
      id: row.case.id,
      caseNumber: row.case.caseNumber,
      title: row.case.title,
    }));

  const selectedCaseId = resolvedSearchParams.caseId || (viewableCases.length > 0 ? viewableCases[0].id : undefined);
  const selectedCase = viewableCases.find(c => c.id === selectedCaseId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">AI Case Assistant</h1>
        <p className="text-slate-500 mt-1">Context-aware, logged query interface for evidence discovery.</p>
      </div>

      {viewableCases.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white border rounded-lg">
          You are not currently assigned to any cases that permit AI Assistant access.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Case Context:</label>
            <form method="GET" className="flex-1 max-w-sm">
              <select
                name="caseId"
                value={selectedCaseId}
                onChange={(e) => e.target.form?.submit()}
                className="w-full text-sm p-2 border border-slate-200 rounded focus:border-navy outline-none"
              >
                {viewableCases.map(c => (
                  <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
                ))}
              </select>
            </form>
          </div>

          {selectedCaseId ? (
            <AiAssistant caseId={selectedCaseId} />
          ) : null}
        </div>
      )}
    </div>
  );
}
