import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { authorizeCase, writeAudit } from "@/lib/audit";

export default async function CourtBundlePage({
  params
}: {
  params: Promise<{ docId: string }>
}) {
  const user = await getSessionUser();
  if (!user) return notFound();

  const { docId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      case: true,
      versions: {
        orderBy: { version: "desc" },
        take: 1
      },
      custodyEvents: {
        include: { actor: { select: { name: true, department: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!document) return notFound();

  const authResult = await authorizeCase({
    user,
    caseId: document.caseId,
    action: "export",
    userAgent: "CourtBundleGenerator",
  });

  if (!authResult.ok) return notFound();

  const latestVersion = document.versions[0];

  // Fetch audit logs related to this document
  const auditLogs = await prisma.auditLog.findMany({
    where: { documentId: docId },
    orderBy: { createdAt: "asc" }
  });

  await writeAudit({
    actorId: user.id,
    role: user.role,
    action: "EXPORT",
    result: "SUCCESS",
    caseId: document.caseId,
    documentId: document.id,
    ip: "local",
    userAgent: "CourtBundleGenerator",
    reason: "Generated Court-Ready Export Bundle.",
  });

  return (
    <div className="bg-white min-h-screen text-slate-900 p-8 print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:w-full print:max-w-none">
        
        {/* Print Controls (Hidden when printing) */}
        <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg print:hidden border border-slate-200">
          <div>
            <h2 className="font-bold text-navy">Court Bundle Preview</h2>
            <p className="text-sm text-slate-500">Review the bundle before exporting.</p>
          </div>
          <div className="space-x-4">
            <button 
              id="print-btn"
              className="px-4 py-2 bg-navy text-white rounded text-sm font-medium hover:bg-navy/90"
            >
              Print to PDF
            </button>
          </div>
        </div>

        {/* Certificate Header */}
        <div className="text-center border-b-2 border-slate-900 pb-6">
          <h1 className="text-3xl font-serif font-bold uppercase tracking-widest">Digital Evidence Certificate</h1>
          <p className="text-sm mt-2 uppercase font-semibold text-slate-600">Generated via NyayaVault Security Protocol</p>
          <p className="text-xs mt-1 text-slate-500">Under Section 65B of the Indian Evidence Act</p>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="font-bold border-b border-slate-300 mb-2 uppercase">Case Information</h3>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-600">Case Number:</span>
              <span className="col-span-2 font-mono">{document.case.caseNumber}</span>
              <span className="font-semibold text-slate-600">FIR Number:</span>
              <span className="col-span-2">{document.case.firNumber || "N/A"}</span>
              <span className="font-semibold text-slate-600">Status:</span>
              <span className="col-span-2">{document.case.status}</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold border-b border-slate-300 mb-2 uppercase">Document Meta</h3>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-600">Doc Title:</span>
              <span className="col-span-2">{document.title}</span>
              <span className="font-semibold text-slate-600">Type:</span>
              <span className="col-span-2">{document.type}</span>
              <span className="font-semibold text-slate-600">Classification:</span>
              <span className="col-span-2">{document.classification}</span>
              <span className="font-semibold text-slate-600">Retention:</span>
              <span className="col-span-2 font-bold">{document.legalHold ? "LEGAL HOLD ACTIVE" : "STANDARD"}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Proof */}
        <div className="bg-slate-50 border border-slate-300 p-4 rounded-sm mt-8 break-inside-avoid">
          <h3 className="font-bold uppercase mb-4">Cryptographic Integrity Proof</h3>
          <div className="space-y-3 text-sm font-mono break-all">
            <div>
              <span className="font-bold text-slate-600 block">SHA-256 File Hash:</span>
              <span>{latestVersion?.sha256Hash || "N/A"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block">Ledger Proof ID:</span>
              <span>{latestVersion?.ledgerProofId || "N/A"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block">Current Status:</span>
              <span className="font-bold">{document.anchorStatus}</span>
            </div>
          </div>
        </div>

        {/* Chain of Custody */}
        <div className="mt-8 break-inside-avoid">
          <h3 className="font-bold uppercase border-b border-slate-300 pb-2 mb-4">Chain of Custody Record</h3>
          {document.custodyEvents.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No custody transfers recorded.</p>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-2">Date/Time</th>
                  <th className="p-2">Actor</th>
                  <th className="p-2">Transferred To</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">DSC Signature Ref</th>
                </tr>
              </thead>
              <tbody>
                {document.custodyEvents.map((evt) => (
                  <tr key={evt.id} className="border-b border-slate-200">
                    <td className="p-2 font-mono text-xs">{evt.createdAt.toLocaleString()}</td>
                    <td className="p-2">{evt.actor.name} ({evt.actor.department})</td>
                    <td className="p-2">{evt.toDepartment}</td>
                    <td className="p-2">{evt.reason}</td>
                    <td className="p-2 font-mono text-xs">{evt.signatureRef.substring(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Audit Trail */}
        <div className="mt-8">
          <h3 className="font-bold uppercase border-b border-slate-300 pb-2 mb-4">Immutable Access & Audit Trail</h3>
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-2">Timestamp</th>
                <th className="p-2">Action</th>
                <th className="p-2">Role</th>
                <th className="p-2">Result</th>
                <th className="p-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-200">
                  <td className="p-2">{log.createdAt.toISOString()}</td>
                  <td className="p-2 font-bold">{log.action}</td>
                  <td className="p-2">{log.role}</td>
                  <td className={`p-2 ${log.result === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>{log.result}</td>
                  <td className="p-2">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-slate-500 font-mono border-t border-slate-300 pt-4 print:fixed print:bottom-0 print:w-full">
          Generated on {new Date().toISOString()} • End of Report
        </div>

      </div>

      {/* Script for printing via the button */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('print-btn').addEventListener('click', function() {
            window.print();
          });
        `
      }} />
    </div>
  );
}
