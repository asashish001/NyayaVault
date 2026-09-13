"use client";

import { useRouter } from "next/navigation";

export function CaseSelector({
  viewableCases,
  selectedCaseId,
}: {
  viewableCases: { id: string; caseNumber: string; title: string }[];
  selectedCaseId: string | undefined;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedCaseId}
      onChange={(e) => {
        router.push(`?caseId=${e.target.value}`);
      }}
      className="w-full text-sm p-2 border border-slate-200 rounded focus:border-navy outline-none"
    >
      {viewableCases.map((c) => (
        <option key={c.id} value={c.id}>
          {c.caseNumber} - {c.title}
        </option>
      ))}
    </select>
  );
}
