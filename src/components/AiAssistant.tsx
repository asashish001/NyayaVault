"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ShieldCheck, ShieldAlert } from "lucide-react";
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
  const [systemMode, setSystemMode] = useState<"FULL" | "DEGRADED" | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || !caseId) return;

    const userMsg = text.trim();
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
        if (data.mode) setSystemMode(data.mode);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${(data as any).error}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "A network error occurred." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  const suggestions = [
    "Summarize the key events in this case.",
    "Who are the main suspects?",
    "What locations are mentioned in the documents?",
    "Are there any witness statements?"
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-slate-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Case Assistant</span>
        </div>
        {systemMode === "DEGRADED" ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200" title="The AI provider is unavailable. Using basic keyword fallback.">
            <ShieldAlert className="h-3 w-3 text-amber-600" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-amber-700">
              Limited AI mode — semantic reasoning unavailable
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-700">
              AI mode: Evidence Retrieval
            </span>
          </div>
        )}
      </div>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/20">
                  <span className="text-xs font-semibold uppercase opacity-70 mb-1 block">Sources</span>
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

        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 mt-4 ml-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(suggestion)}
                className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-full hover:bg-slate-50 hover:border-slate-300 hover:text-navy transition-colors text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

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
    </div>
  );
}
