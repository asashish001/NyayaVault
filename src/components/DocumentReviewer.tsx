"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useToast } from "@/components/ui/ToastProvider";

type ReviewDoc = {
  id: string;
  title: string;
  caseNumber: string;
  status: string;
};

export function DocumentReviewer({ pendingDocs }: { pendingDocs: ReviewDoc[] }) {
  const toast = useToast();
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [ocrData, setOcrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedDocId) {
      loadOcrData(selectedDocId);
    } else {
      setOcrData(null);
      setFormData({});
    }
  }, [selectedDocId]);

  async function loadOcrData(docId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/ocr`);
      if (res.ok) {
        const data = await res.json();
        setOcrData(data);
        setFormData(data.extractedData?.fields || {});
      } else {
        setOcrData(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function triggerProcessing() {
    if (!selectedDocId) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/documents/${selectedDocId}/process-ocr`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await loadOcrData(selectedDocId);
      } else {
        toast.error("Processing failed: " + data.error);
      }
    } finally {
      setProcessing(false);
    }
  }

  async function handleApprove() {
    if (!selectedDocId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${selectedDocId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctedFields: formData })
      });
      if (res.ok) {
        toast.success("Document approved successfully!");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("Failed to approve document.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleFieldChange(key: string, value: string) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  const selectedDoc = pendingDocs.find(d => d.id === selectedDocId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Document for Review</CardTitle>
          <p className="text-sm text-slate-500">Documents marked as PROCESSING or MANUAL_REVIEW require attention.</p>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="flex h-10 w-full max-w-xl rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy"
          >
            <option value="" disabled>Select a document...</option>
            {pendingDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.caseNumber} - {d.title} ({d.status})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedDoc && !ocrData && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <p className="text-slate-600">This document has not been processed by the IDP pipeline yet.</p>
              <Button onClick={triggerProcessing} disabled={processing}>
                {processing ? "Running OCR Pipeline..." : "Run Extraction Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-sm text-slate-500 animate-pulse">Loading extraction data...</p>}

      {ocrData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Raw Extracted Text</CardTitle>
              <p className="text-sm text-slate-500">Overall Confidence: {(ocrData.confidence * 100).toFixed(1)}%</p>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-md h-96 overflow-y-auto whitespace-pre-wrap font-mono text-xs border border-slate-200 text-slate-700">
                {ocrData.rawText}
              </div>
              <div className="mt-4 flex justify-between items-center">
                 <a href={`/api/documents/${selectedDocId}/download`} target="_blank" className="text-sm text-blue-600 hover:underline font-medium">
                   View Original Document ↗
                 </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Extracted Fields</CardTitle>
                <Badge tone={ocrData.status === "APPROVED" ? "green" : "saffron"}>
                  {ocrData.status === "APPROVED" ? "APPROVED" : "REVIEW REQUIRED"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">Correct any errors highlighted below before approving.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData).map(([key, value]) => {
                const conf = ocrData.extractedData?.confidences?.[key] || 0;
                const isLowConfidence = conf > 0 && conf < 0.7;
                
                return (
                  <div key={key} className={`p-3 rounded-md border ${isLowConfidence ? 'border-orange-300 bg-orange-50/30' : 'border-slate-100'}`}>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-semibold uppercase text-slate-600">{key}</label>
                      {conf > 0 && (
                        <span className={`text-xs font-medium ${isLowConfidence ? 'text-orange-600' : 'text-green-600'}`}>
                          {(conf * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={value as string}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full text-sm p-2 border border-slate-200 rounded focus:border-navy outline-none"
                    />
                  </div>
                )
              })}

              <Button 
                className="w-full mt-6" 
                onClick={handleApprove} 
                disabled={saving || ocrData.status === "APPROVED"}
              >
                {saving ? "Saving..." : ocrData.status === "APPROVED" ? "Already Approved" : "Approve & Index"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
