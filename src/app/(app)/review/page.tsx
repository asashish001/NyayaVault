import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function IDPReviewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Fetch pending OCR extractions
  // For the prototype, we fetch all pending extractions.
  // In a real app, this would be scoped to cases assigned to the user or by role.
  const pendingExtractions = await prisma.ocrExtraction.findMany({
    where: { status: "PENDING" },
    include: { document: { include: { case: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-navy">IDP Review</h1>
        <p className="text-sm text-slate-600">
          Review and approve extracted metadata from uploaded documents.
        </p>
      </div>
      
      {pendingExtractions.length === 0 ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          No documents are pending review at this time.
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendingExtractions.map((extraction) => (
                <tr key={extraction.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-navy">{extraction.document.title}</td>
                  <td className="px-4 py-3 text-slate-600">{extraction.document.case.caseNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${extraction.confidence >= 0.9 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {(extraction.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDistanceToNow(extraction.createdAt, { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/review/${extraction.document.id}`} className="font-medium text-saffron hover:underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
