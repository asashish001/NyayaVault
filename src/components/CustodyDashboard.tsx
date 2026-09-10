"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DocInfo = {
  id: string;
  title: string;
  caseNumber: string;
  ownerDepartment: string;
};

type CustodyEvent = {
  id: string;
  toDepartment: string;
  reason: string;
  signatureRef: string;
  ledgerProofId: string | null;
  createdAt: string;
  actor: {
    name: string;
    role: string;
    department: string | null;
  };
};

export function CustodyDashboard({ documents, currentDept }: { documents: DocInfo[], currentDept: string }) {
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [events, setEvents] = useState<CustodyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);

  // Transfer Form State
  const [toDept, setToDept] = useState("");
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (selectedDocId) {
      loadTimeline(selectedDocId);
    } else {
      setEvents([]);
    }
  }, [selectedDocId]);

  async function loadTimeline(docId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/custody`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDocId) return;

    setTransferring(true);
    try {
      const res = await fetch(`/api/documents/${selectedDocId}/custody`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toDepartment: toDept, reason, pin }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("Custody successfully transferred and digitally signed!");
        setToDept("");
        setReason("");
        setPin("");
        await loadTimeline(selectedDocId);
        // We'd ideally update the local state for ownerDepartment, but a reload is safer for MVP
        window.location.reload();
      } else {
        alert("Transfer failed: " + data.error);
      }
    } finally {
      setTransferring(false);
    }
  }

  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const hasCustody = selectedDoc?.ownerDepartment === currentDept;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Evidence for Custody Transfer</CardTitle>
          <p className="text-sm text-slate-500">View the unbroken chain of custody or securely transfer possession.</p>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="flex h-10 w-full max-w-xl rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy"
          >
            <option value="" disabled>Select a document...</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.caseNumber} - {d.title} (Currently with: {d.ownerDepartment})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedDoc && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transfer Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Transfer Custody</CardTitle>
                <Badge tone={hasCustody ? "green" : "slate"}>
                  {hasCustody ? "You Have Custody" : "Read Only"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">Sign over the digital authority of this evidence to another department.</p>
            </CardHeader>
            <CardContent>
              {!hasCustody ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-600">
                  You cannot transfer custody because this document is currently with <strong>{selectedDoc.ownerDepartment}</strong>.
                </div>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">To Department</label>
                    <select
                      required
                      value={toDept}
                      onChange={e => setToDept(e.target.value)}
                      className="w-full text-sm p-2 border border-slate-200 rounded focus:border-navy outline-none"
                    >
                      <option value="" disabled>Select receiving department...</option>
                      <option value="Forensic Lab">Forensic Lab</option>
                      <option value="Prosecution Directorate">Prosecution Directorate</option>
                      <option value="District Court">District Court</option>
                      <option value="Investigating Agency">Investigating Agency</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Transfer</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Forensic examination of handwriting"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full text-sm p-2 border border-slate-200 rounded focus:border-navy outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Digital Signature PIN (DSC)</label>
                    <p className="text-xs text-slate-500 mb-2">Simulating Class-3 DSC sign-off. (Demo PIN: 1234)</p>
                    <input
                      required
                      type="password"
                      maxLength={4}
                      placeholder="Enter 4-digit PIN"
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                      className="w-32 text-center tracking-[0.25em] text-lg p-2 border border-slate-200 rounded focus:border-navy outline-none"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={transferring}>
                    {transferring ? "Signing..." : "Sign & Transfer"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Chain of Custody Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-slate-500 animate-pulse">Loading timeline...</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-slate-500">No custody transfers recorded yet.</p>
              ) : (
                <div className="relative border-l border-slate-200 ml-3 space-y-6">
                  {events.map((evt, idx) => (
                    <div key={evt.id} className="pl-6 relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-navy border-2 border-white ring-2 ring-slate-100" />
                      
                      <div className="text-xs text-slate-500 mb-1">
                        {new Date(evt.createdAt).toLocaleString()}
                      </div>
                      <div className="font-medium text-sm text-slate-900">
                        Transferred to {evt.toDepartment}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        <span className="font-semibold">By:</span> {evt.actor.name} ({evt.actor.role})
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold">Reason:</span> {evt.reason}
                      </div>
                      <div className="mt-2 text-xs font-mono text-slate-400 break-all bg-slate-50 p-2 rounded border border-slate-100">
                        <strong>DSC Auth:</strong> {evt.signatureRef}<br/>
                        <strong>Ledger Proof:</strong> {evt.ledgerProofId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
