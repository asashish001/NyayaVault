import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { headers } from "next/headers";

export default async function PublicShareView({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params;

  const shareToken = await prisma.shareToken.findUnique({
    where: { token },
    include: {
      document: {
        include: { case: true, ocrData: true }
      }
    }
  });

  if (!shareToken || shareToken.revoked || shareToken.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-red-200 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-slate-600">This secure link is invalid, revoked, or has expired.</p>
        </div>
      </div>
    );
  }

  // Log the view action
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown-ip";
  const userAgent = headersList.get("user-agent") || "unknown-browser";

  await writeAudit({
    actorId: null, // Public view
    role: "EXTERNAL_GUEST",
    action: "VIEW",
    result: "SUCCESS",
    caseId: shareToken.document.caseId,
    documentId: shareToken.documentId,
    ip,
    userAgent,
    reason: `Public token view by ${shareToken.recipient} (${shareToken.purpose})`,
  });

  // Apply Redactions to OCR Text
  let displayText = shareToken.document.ocrData?.rawText || "No text content available.";
  let redactedFieldsList: string[] = [];
  if (shareToken.redactedFields) {
    try {
      redactedFieldsList = JSON.parse(shareToken.redactedFields);
    } catch (e) {
      // Ignore parse error
    }
  }

  if (shareToken.document.ocrData?.extractedData && redactedFieldsList.length > 0) {
    try {
      const extracted = JSON.parse(shareToken.document.ocrData.extractedData);
      redactedFieldsList.forEach(key => {
        const valToRedact = extracted[key];
        if (valToRedact) {
          // Global case-insensitive replacement with [REDACTED]
          const regex = new RegExp(valToRedact, "gi");
          displayText = displayText.replace(regex, "██████████ [REDACTED]");
        }
      });
    } catch (e) {
      // Ignore
    }
  }

  // For the watermark
  const watermarkText = `CONFIDENTIAL • VIEWED BY: ${shareToken.recipient} • IP: ${ip} • AT: ${new Date().toISOString()}`;

  return (
    <div className="relative min-h-screen bg-slate-100 py-10 px-4 overflow-hidden select-none">
      
      {/* Dynamic CSS Watermark Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center opacity-10 mix-blend-multiply overflow-hidden">
        <div className="absolute inset-[-100%] flex flex-wrap items-center justify-center gap-16 transform -rotate-45">
          {Array.from({ length: 150 }).map((_, i) => (
            <span key={i} className="text-xl font-bold whitespace-nowrap">
              {watermarkText}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-sm border border-slate-300 relative z-10 print:shadow-none print:border-none">
        
        {/* Header */}
        <div className="bg-navy text-white p-6 rounded-t-sm">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-serif">{shareToken.document.title}</h1>
              <p className="text-slate-300 text-sm mt-1">Case Number: {shareToken.document.case.caseNumber}</p>
              <p className="text-slate-300 text-sm">Classification: {shareToken.document.classification}</p>
            </div>
            <div className="text-right">
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wider animate-pulse">
                Restricted View
              </span>
              <p className="text-slate-300 text-xs mt-2 max-w-[200px]">
                Authorized exclusively for {shareToken.recipient} ({shareToken.purpose})
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8">
          <div className="mb-6 pb-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Document Content (OCR Extracted)</h2>
            {redactedFieldsList.length > 0 && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                Certain sensitive fields ({redactedFieldsList.join(", ")}) have been actively redacted from this view.
              </p>
            )}
          </div>
          
          <div className="prose prose-slate max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {displayText}
          </div>
        </div>
      </div>
    </div>
  );
}
