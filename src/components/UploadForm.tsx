"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Circle, FileText, Check, FileCheck } from "lucide-react";

type CaseOption = { id: string; caseNumber: string; title: string };

type PipelineState = "idle" | "uploading" | "simulating" | "done";

export function UploadForm({ cases }: { cases: CaseOption[] }) {
  const [caseId, setCaseId] = useState(cases.length > 0 ? cases[0].id : "");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("FIR");
  const [state, setState] = useState<PipelineState>("idle");
  const [docId, setDocId] = useState("");
  
  // Pipeline simulation step (0 to 6)
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (state === "simulating") {
      const timer = setInterval(() => {
        setStep((s) => {
          if (s >= 5) {
            clearInterval(timer);
            setState("done");
            return 6;
          }
          return s + 1;
        });
      }, 700);
      return () => clearInterval(timer);
    }
  }, [state]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;

    setState("uploading");
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
        setDocId(data.documentId);
        setState("simulating");
        setStep(0);
      } else {
        alert("Upload failed: " + data.error);
        setState("idle");
      }
    } catch (err) {
      alert("Network error occurred.");
      setState("idle");
    }
  }

  function reset() {
    setState("idle");
    setFile(null);
    setTitle("");
    setStep(0);
  }

  if (state === "simulating" || state === "done") {
    return (
      <Card className="border-blue-100 shadow-md">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Document Processing Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <PipelineItem label="File received" active={step >= 0} done={step >= 1} />
            <PipelineItem label="SHA-256 calculated" active={step >= 1} done={step >= 2} />
            <PipelineItem label="Evidence encrypted" active={step >= 2} done={step >= 3} />
            <PipelineItem label="Integrity proof recorded" active={step >= 3} done={step >= 4} />
            <PipelineItem label="OCR processing" active={step >= 4} done={step >= 5} />
            <PipelineItem label="Metadata extraction" active={step >= 5} done={step >= 6} />
            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <Circle className="h-5 w-5" />
              <span>Human review (Pending)</span>
            </div>
          </div>
          
          {state === "done" && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm font-bold text-green-900 mb-1 uppercase tracking-wider">Success</p>
              <p className="font-mono text-base font-bold text-green-700">Evidence ID: {docId}</p>
              <Button onClick={reset} className="mt-4 bg-green-700 hover:bg-green-800 text-white w-full">
                Upload Another Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
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
              disabled={state === "uploading"}
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
              disabled={state === "uploading"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select 
              value={docType} 
              onChange={e => setDocType(e.target.value)}
              className="w-full text-sm p-2 border rounded"
              disabled={state === "uploading"}
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
              className="w-full text-sm p-2 border rounded cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all text-slate-500"
              disabled={state === "uploading"}
            />
          </div>
          <Button type="submit" disabled={state === "uploading"} className="bg-[#0F294D] hover:bg-[#0F294D]/90 text-white font-bold w-full h-11">
            {state === "uploading" ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading & Encrypting...</span>
            ) : "Upload & Anchor"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PipelineItem({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  if (done) {
    return (
      <div className="flex items-center gap-3 text-green-600 font-bold">
        <CheckCircle2 className="h-5 w-5" />
        <span>{label}</span>
      </div>
    );
  }
  if (active) {
    return (
      <div className="flex items-center gap-3 text-blue-600 font-bold">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{label}...</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 text-slate-400 font-medium">
      <Circle className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}
