import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/auth/abac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CasesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const assignments = await prisma.caseAssignment.findMany({
    where: { userId: user.id },
    include: { case: true },
  });

  const cases = assignments.filter((row) =>
    evaluateAccess({
      role: user.role,
      assigned: true,
      caseClassification: row.case.classification,
      action: "view_case",
    }).allowed,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-navy">Cases</h1>
        <p className="text-sm text-slate-600">Server-filtered to your assignments. Cross-case access is denied and logged.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Visible cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cases.length === 0 ? (
            <p className="text-sm text-slate-600">
              No cases visible for this role/classification. Admin identities are not assigned to
              WS-2026-0001 by design.
            </p>
          ) : (
            cases.map((row) => (
              <Link key={row.case.id} href={`/cases/${row.case.id}`} className="block rounded border p-4 hover:border-navy">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-navy">{row.case.caseNumber}</span>
                  <Badge tone="slate">{row.case.status}</Badge>
                  <Badge>{row.case.classification}</Badge>
                </div>
                <p className="mt-1 text-sm">{row.case.title}</p>
                <p className="text-xs text-slate-500">
                  FIR {row.case.firNumber} · CCTNS mock {row.case.cctnsRef}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
