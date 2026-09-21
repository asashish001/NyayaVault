"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import { useTransformersWorker } from "@/lib/ai/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AiAssistant({ caseId }: { caseId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your completely offline AI Case Assistant. What would you like to know about this case?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string>("");
  const { generate } = useTransformersWorker();

  // Fetch context once when the component mounts
  useEffect(() => {
    async function fetchContext() {
      try {
        const res = await fetch(`/api/cases/${caseId}/context`);
        const data = await res.json();
        if (data.context) {
          setContext(data.context);
        }
      } catch (err) {
        console.error("Failed to fetch case context", err);
      }
    }
    if (caseId) {
      fetchContext();
    }
  }, [caseId]);

  async function sendMessage(text: string) {
    if (!text.trim() || !caseId) return;

    const userMsg = text.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    // Basic heuristic guardrail for greetings/short messages
    const lowerMsg = userMsg.toLowerCase();
    if (lowerMsg.length < 5 || ["hello", "hi", "hey", "helo"].includes(lowerMsg)) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: "Hello! Please ask a specific question regarding the evidence or suspects in this case." }]);
        setLoading(false);
      }, 500);
      return;
    }

    // Truncate context to ~1500 characters to prevent T5 context window overflow (max 512 tokens)
    const safeContext = context.length > 1500 ? context.substring(0, 1500) + "..." : context;
    const prompt = `System: You are a strict, secure AI Case Assistant. You must ONLY answer questions using the provided context. If the question is not related to the case evidence, reply "I cannot answer this."\n\nContext: ${safeContext}\nQuestion: ${userMsg}\nAnswer:`;

    generate(prompt, (response) => {
      if (response.type === 'COMPLETE') {
        setMessages(prev => [...prev, { role: "assistant", content: response.payload.result }]);
        setLoading(false);
      } else if (response.type === 'ERROR') {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${response.payload.error}` }]);
        setLoading(false);
      }
      // Note: you could handle 'PROGRESS' here to show a streaming effect or download progress
    });
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
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 border border-indigo-200" title="Running offline via WebAssembly">
          <Cpu className="h-3 w-3 text-indigo-600" />
          <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-700">
            Local AI Engine Active
          </span>
        </div>
      </div>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
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
            <div className="max-w-[80%] rounded-lg p-3 text-sm bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
              <span className="animate-pulse">Generating offline response...</span>
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

