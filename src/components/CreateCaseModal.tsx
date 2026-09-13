"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CreateCaseModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/cases", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json();
      alert("Error: " + data.error);
    }
    setLoading(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-navy hover:bg-navy/90 text-white">
        + Create New Case
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-navy">Create New Case</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Case Title</label>
                <input name="title" required className="w-full p-2 border border-slate-300 rounded focus:border-navy outline-none" placeholder="e.g. State vs. Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Classification</label>
                <select name="classification" className="w-full p-2 border border-slate-300 rounded focus:border-navy outline-none">
                  <option value="GENERAL">General</option>
                  <option value="SENSITIVE">Sensitive</option>
                  <option value="RESTRICTED">Restricted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">FIR Number</label>
                <input name="firNumber" required className="w-full p-2 border border-slate-300 rounded focus:border-navy outline-none" placeholder="e.g. FIR-2026-999" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jurisdiction</label>
                <input name="jurisdiction" required className="w-full p-2 border border-slate-300 rounded focus:border-navy outline-none" placeholder="e.g. Central Station" />
              </div>
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-navy text-white">
                  {loading ? "Creating..." : "Create Case"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
