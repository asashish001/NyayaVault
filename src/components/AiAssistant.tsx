"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Citation, AiResponse } from "@/lib/ai/assistant";

type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

export function AiAssistant({ caseId }: { caseId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your AI Case Assistant. You can ask me questions about the documents uploaded and processed in this case. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !caseId) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/cases/${caseId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg })
      });
      
      const data: AiResponse = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.answer, citations: data.citations }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${(data as any).error}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "A network error occurred." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b border-slate-100 bg-slate-50 shrink-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-navy flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            AI Assistant
          </CardTitle>
          <Badge tone="navy">Secure / Logged</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">Queries are logged and restricted to OCR-extracted documents within this case.</p>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/20">
                  <span className="text-xs font-semibold uppercase opacity-70">Sources Cited:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {m.citations.map((c, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-white/20 rounded border border-slate-300/30">
                        📄 {c.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 text-sm bg-slate-100 text-slate-500 border border-slate-200">
              <span className="animate-pulse">Analyzing case documents...</span>
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-4 border-t border-slate-100 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about the evidence..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading || !caseId}
            className="flex-1 text-sm p-2 border border-slate-200 rounded focus:border-navy outline-none disabled:bg-slate-50"
          />
          <Button type="submit" disabled={loading || !caseId || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
}
