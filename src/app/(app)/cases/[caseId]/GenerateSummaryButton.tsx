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
  const router = useRouter();
  const { generate } = useTransformersWorker();

  const handleGenerate = async () => {
    setLoading(true);
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
          // 3. Save the offline-generated summary to the database
          await fetch(`/api/cases/${caseId}/summary/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: response.payload.result })
          });
          
          toast.success("Offline AI Summary generated!");
          setLoading(false);
          router.refresh();
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
  );
}
