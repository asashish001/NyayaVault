import React from "react";
import { Info, ShieldCheck, Lightbulb } from "lucide-react";

interface ContextPanelProps {
  title: string;
  type?: "info" | "security" | "tip";
  children: React.ReactNode;
}

export function ContextPanel({ title, type = "info", children }: ContextPanelProps) {
  // Define styles and icons based on panel type
  let bgClass = "bg-blue-50/50 border-blue-100";
  let titleClass = "text-blue-900";
  let Icon = Info;
  let iconClass = "text-blue-500";

  if (type === "security") {
    bgClass = "bg-emerald-50/50 border-emerald-100";
    titleClass = "text-emerald-900";
    Icon = ShieldCheck;
    iconClass = "text-emerald-600";
  } else if (type === "tip") {
    bgClass = "bg-amber-50/50 border-amber-100";
    titleClass = "text-amber-900";
    Icon = Lightbulb;
    iconClass = "text-amber-500";
  }

  return (
    <div className={`mb-6 overflow-hidden rounded-xl border p-5 ${bgClass}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <h3 className={`font-semibold ${titleClass}`}>{title}</h3>
      </div>
      <div className="text-sm text-slate-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
