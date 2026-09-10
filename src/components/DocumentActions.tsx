"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DocumentActions({ docId }: { docId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to attempt deleting this document?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.status === "LEGAL_HOLD_ACTIVE") {
          alert(`BLOCKED: ${data.error}`);
        } else {
          alert(`ERROR: ${data.error}`);
        }
      } else {
        alert("Document archived successfully.");
        window.location.reload();
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a 
        href={`/api/documents/${docId}/download`} 
        target="_blank"
        className="rounded bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200"
      >
        Download
      </a>
      <a 
        href={`/court-bundle/${docId}`} 
        target="_blank"
        className="rounded bg-navy text-white px-2 py-1 text-xs font-medium hover:bg-navy/90"
      >
        Court Export
      </a>
      <button 
        onClick={handleDelete}
        disabled={loading}
        className="rounded bg-red-50 text-red-600 px-2 py-1 text-xs font-medium border border-red-200 hover:bg-red-100 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
