import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const assignments = await prisma.caseAssignment.findMany({
    where: { userId: user.id },
    include: { case: true },
  });

  const deniedCount = await prisma.auditLog.count({
    where: { action: "ACCESS_DENIED" },
  });

  const anchoredCount = await prisma.document.count({
    where: { anchorStatus: "ANCHORED" }
  });

  const restricted = await prisma.caseRecord.findUnique({
    where: { caseNumber: "WS-2026-0001" },
  });
  const assignedToRestricted = assignments.some((row) => row.case.caseNumber === "WS-2026-0001");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-navy">Operations dashboard</h1>
        <p className="text-sm text-slate-600">Role-scoped view of assigned fictional cases only.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Assigned cases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-navy">{assignments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Integrity status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-navy">{anchoredCount}</p>
            <p className="mt-1 text-xs text-slate-500">Hash-anchored documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Denied access events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-navy">{deniedCount}</p>
            <p className="mt-1 text-xs text-slate-500">Append-only audit (all roles)</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assigned case list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-600">No case assignments for this demo identity.</p>
          ) : (
            assignments.map((row) => (
              <Link
                key={row.id}
                href={`/cases/${row.case.id}`}
                className="block rounded border border-slate-200 p-3 hover:border-navy"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-navy">{row.case.caseNumber}</p>
                  <Badge>{row.case.classification}</Badge>
                </div>
                <p className="text-sm text-slate-600">{row.case.title}</p>
                <p className="text-xs text-slate-500">
                  {row.case.station} · purpose {row.purpose}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
      {restricted && !assignedToRestricted ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle>Unauthorized-access demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              This identity is not assigned to WS-2026-0001. Opening it must fail on the server
              and write ACCESS_DENIED.
            </p>
            <Link className="font-medium text-navy underline" href={`/cases/${restricted.id}`}>
              Attempt restricted case WS-2026-0001
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
