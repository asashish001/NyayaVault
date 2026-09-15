"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export function GenerateSummaryButton({ caseId }: { caseId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/summary`, {
        method: "POST",
      });
      const data = await res.json();
      
      if (data.error) {
        toast.error("Error: " + data.error);
      } else {
        toast.success("AI Summary generated!");
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleGenerate} 
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 text-purple-500" />
      )}
      {loading ? "Reading evidence..." : "Generate AI Summary"}
    </Button>
  );
}
