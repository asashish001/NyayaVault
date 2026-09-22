"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { useTransformersWorker } from "@/lib/ai/client";

export function GenerateSummaryButton({ caseId }: { caseId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const router = useRouter();
  const { generate } = useTransformersWorker();

  const handleGenerate = async () => {
    setLoading(true);
    setAiSummary(null);
    try {
      // 1. Fetch raw context
      const contextRes = await fetch(`/api/cases/${caseId}/context`);
      const contextData = await contextRes.json();
      
      if (!contextData.context) {
        toast.error("No extractable text found in this case.");
        setLoading(false);
        return;
      }

      const prompt = `System: Summarize the following case files briefly.\n\nContext:\n${contextData.context}`;

      // 2. Generate summary fully offline via WebWorker
      generate(prompt, async (response) => {
        if (response.type === 'COMPLETE') {
          // 3. Display it locally instead of overwriting the official record
          setAiSummary(response.payload.result);
          toast.success("Offline AI Summary generated (Draft mode)");
          setLoading(false);
        } else if (response.type === 'ERROR') {
          toast.error("Offline AI failed: " + response.payload.error);
          setLoading(false);
        }
      });
      
    } catch (err) {
      toast.error("Failed to generate offline summary");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleGenerate} 
        disabled={loading}
        className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800"
        title="Generates a summary entirely on your device using a local LLM"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        ) : (
          <Cpu className="w-4 h-4 text-indigo-500" />
        )}
        {loading ? "Processing locally..." : "Generate Local AI Summary"}
      </Button>
      {aiSummary && (
        <div className="mt-4 p-4 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded text-sm w-[400px] text-left shadow-sm z-10 absolute right-6 top-16">
          <p className="font-semibold mb-2 flex items-center justify-between">
            AI Generated Insights (Draft)
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-indigo-500" onClick={() => setAiSummary(null)}>×</Button>
          </p>
          <p className="whitespace-pre-wrap">{aiSummary}</p>
        </div>
      )}
    </div>
  );
}
