import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { listStudents } from "@/lib/db/admin-queries";
import { assembleComplianceReport } from "@/lib/compliance/report";
import { ComplianceReportView } from "@/components/compliance/ComplianceReportView";

// Print-friendly compliance record. Opened in a new tab; use the browser's print.
export default async function CompliancePrintPage({
  params,
}: PageProps<"/admin/compliance/[studentId]/print">) {
  const { studentId } = await params;
  const user = await requireRole("admin");

  const students = await listStudents(user.masjidId);
  const student = students.find((s) => s.id === studentId);
  if (!student) notFound();

  const report = await assembleComplianceReport(student.id, student.name, user.masjidId);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-zinc-900 dark:bg-white dark:text-zinc-900">
      <div className="mb-6 flex items-baseline justify-between border-b border-zinc-300 pb-2">
        <div>
          <p className="text-lg font-semibold">Suffa — home-instruction progress record</p>
          <p className="text-xs text-zinc-500">
            Masjid As-Suffa (Demo) · generated {new Date(report.assembledAt).toLocaleDateString()}
          </p>
        </div>
        <span className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-600 print:hidden">
          Print with ⌘/Ctrl-P
        </span>
      </div>
      <ComplianceReportView report={report} />
    </div>
  );
}
