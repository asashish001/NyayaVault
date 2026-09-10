"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CaseOption = { id: string; caseNumber: string; title: string };

export function UploadForm({ cases }: { cases: CaseOption[] }) {
  const [caseId, setCaseId] = useState(cases.length > 0 ? cases[0].id : "");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("FIR");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", caseId);
    formData.append("title", title);
    formData.append("docType", docType);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert("Upload successful! Hash: " + data.hash);
        window.location.reload();
      } else {
        alert("Upload failed: " + data.error);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Case</label>
            <select 
              value={caseId} 
              onChange={e => setCaseId(e.target.value)}
              className="w-full text-sm p-2 border rounded"
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input 
              required
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select 
              value={docType} 
              onChange={e => setDocType(e.target.value)}
              className="w-full text-sm p-2 border rounded"
            >
              <option value="FIR">FIR</option>
              <option value="WITNESS_STATEMENT">Witness Statement</option>
              <option value="FORENSIC_REPORT">Forensic Report</option>
              <option value="CHARGE_SHEET">Charge Sheet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">File</label>
            <input 
              required
              type="file" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm p-2 border rounded"
            />
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Encrypting & Uploading..." : "Upload & Anchor"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
