"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReviewForm({ docId, initialData }: { docId: string, initialData: string }) {
  const [data, setData] = useState(() => {
    try {
      const parsed = JSON.parse(initialData);
      return JSON.stringify(parsed.fields || parsed, null, 2);
    } catch {
      return initialData;
    }
  });
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    try {
      // Validate JSON
      JSON.parse(data);
    } catch {
      alert("Invalid JSON format. Please fix errors before approving.");
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/documents/${docId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correctedFields: JSON.parse(data) })
    });
    if (res.ok) {
      router.push("/review");
      router.refresh();
    } else {
      alert("Failed to approve");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="h-96 w-full rounded border border-slate-200 p-4 font-mono text-sm text-slate-800"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/review")} disabled={busy}>Cancel</Button>
        <Button onClick={handleApprove} disabled={busy}>
          {busy ? "Approving..." : "Approve & Save"}
        </Button>
      </div>
    </div>
  );
}
