"use client";

import { useState } from "react";
import { Bot, X, MessageSquare } from "lucide-react";
import { AiAssistant } from "@/components/AiAssistant";

type ViewableCase = {
  id: string;
  caseNumber: string;
  title: string;
};

export function FloatingAssistantClient({
  viewableCases
}: {
  viewableCases: ViewableCase[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(
    viewableCases.length > 0 ? viewableCases[0].id : undefined
  );

  return (
    <>
      {/* Floating Action Container */}
      <div className="fixed bottom-8 right-8 z-50 flex items-center justify-center h-16 w-16">
        
        {/* Full circular text ring */}
        {!isOpen && (
          <div className="absolute -inset-6 pointer-events-none animate-[spin_20s_linear_infinite]">
            <svg viewBox="0 0 100 100" className="w-full h-full text-black">
              <path id="text-path" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="none" />
              <text className="text-[10px] font-black uppercase fill-current">
                <textPath href="#text-path" startOffset="0%" textLength="250" lengthAdjust="spacing">
                  AI CASE ASSISTANT • AI CASE ASSISTANT • 
                </textPath>
              </text>
            </svg>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative h-16 w-16 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-10 ${
            isOpen ? "shadow-[#001030]/40" : "shadow-[#6B46C1]/30"
          }`}
          style={{ 
            background: isOpen 
              ? "#001030" 
              : "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" 
          }}
        >
          {isOpen ? (
            <X className="h-7 w-7 text-white" />
          ) : (
            <div className="relative h-full w-full">
              <img src="/AI logo.png" alt="AI Assistant Logo" className="h-full w-full object-cover rounded-full shadow-inner" />
            </div>
          )}
        </button>
      </div>

      {/* Popover Panel */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 z-50 w-[450px] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-white animate-in slide-in-from-bottom-5 fade-in duration-300 origin-bottom-right">
          
          {viewableCases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white">
              You are not currently assigned to any cases that permit AI Assistant access.
            </div>
          ) : (
            <div className="flex flex-col h-[650px] max-h-[calc(100vh-140px)]">
              {/* Header with Case Selector */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#0F294D] flex items-center gap-2">
                    <img src="/AI logo.png" alt="AI Assistant" className="h-6 w-6 rounded-full object-cover shadow-sm" />
                    AI Case Assistant
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Context:</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="flex-1 text-sm p-1.5 border border-slate-300 rounded focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none bg-white font-medium text-slate-700 shadow-sm"
                  >
                    {viewableCases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.caseNumber} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 overflow-hidden relative">
                {selectedCaseId ? (
                  <AiAssistant caseId={selectedCaseId} />
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
