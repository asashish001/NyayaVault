"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function OllamaStatusBanner() {
  const [ollamaMissing, setOllamaMissing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if the user has dismissed it in this session
    if (sessionStorage.getItem("nyayavault_ollama_dismissed")) {
      setDismissed(true);
      return;
    }

    // Ping Ollama
    // Note: Since Ollama runs on localhost:11434, the browser will try to hit it directly.
    // If it fails (CORS or network error), it means it's likely not running.
    fetch("http://localhost:11434/api/tags", { method: "HEAD" })
      .then((res) => {
        if (!res.ok) setOllamaMissing(true);
      })
      .catch(() => {
        // Network error means it's completely down
        setOllamaMissing(true);
      });
  }, []);

  if (!ollamaMissing || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("nyayavault_ollama_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="bg-amber-100 text-amber-900 px-4 py-3 flex items-center justify-between text-sm shadow-sm border-b border-amber-200">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p>
          <strong className="font-semibold">⚠️ Local AI engine (Ollama) is not running.</strong>{" "}
          Please run the <code className="bg-amber-200 px-1 rounded">setup-ai</code> script to enable intelligent features. 
          Until then, AI features will run in mock mode.
        </p>
      </div>
      <button 
        onClick={handleDismiss}
        className="ml-4 font-medium underline hover:text-amber-700 whitespace-nowrap"
      >
        Dismiss
      </button>
    </div>
  );
}
