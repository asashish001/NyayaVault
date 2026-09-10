import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/rbac";
import { evaluateAccess } from "@/lib/auth/abac";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const assignments = await prisma.caseAssignment.findMany({
    where: { userId: auth.user.id },
    include: { case: true },
  });

  const cases = assignments
    .map((row) => {
      const decision = evaluateAccess({
        role: auth.user.role,
        assigned: true,
        caseClassification: row.case.classification,
        action: "view_case",
      });
      if (!decision.allowed) return null;
      return {
        id: row.case.id,
        caseNumber: row.case.caseNumber,
        title: row.case.title,
        station: row.case.station,
        status: row.case.status,
        classification: row.case.classification,
        firNumber: row.case.firNumber,
        cctnsRef: row.case.cctnsRef,
        purpose: row.purpose,
        fictionalNote: row.case.fictionalNote,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ cases, viewer: auth.user });
}
