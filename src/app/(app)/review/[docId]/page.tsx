import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReviewForm } from "./ReviewForm";
import { authorizeCase } from "@/lib/audit";

export default async function DocumentReviewPage({ params }: { params: Promise<{ docId: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const resolvedParams = await params;

  const doc = await prisma.document.findUnique({
    where: { id: resolvedParams.docId },
    include: { ocrData: true, case: true }
  });

  if (!doc) {
    redirect("/dashboard");
  }

  const authResult = await authorizeCase({
    user,
    caseId: doc.caseId,
    action: "view_document",
    userAgent: "IDPReviewUI",
  });

  if (!authResult.ok) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-navy">Access Denied</h1>
        </div>
        <div className="rounded border border-red-200 bg-red-50 p-8 text-center text-red-800">
          You do not have clearance or assignment to view documents for this case. This attempt has been audited.
        </div>
      </div>
    );
  }

  if (!doc.ocrData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-navy">Review Extraction</h1>
        </div>
        <div className="rounded border border-red-200 bg-red-50 p-8 text-center text-red-800">
          Document or OCR data not found. It may have already been approved or the ID is invalid.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-navy">Review Extraction</h1>
        <p className="text-sm text-slate-600">
          Document: <strong>{doc.title}</strong> (Case: {doc.case.caseNumber})
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-semibold text-navy">Raw Extracted Text</h2>
          <pre className="h-96 overflow-auto rounded bg-slate-50 p-4 text-xs text-slate-600 whitespace-pre-wrap">
            {doc.ocrData.rawText}
          </pre>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-semibold text-navy">Extracted Metadata (JSON)</h2>
          <ReviewForm docId={doc.id} initialData={doc.ocrData.extractedData} />
        </div>
      </div>
    </div>
  );
}
