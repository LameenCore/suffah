import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { listStudents } from "@/lib/db/admin-queries";
import { assembleComplianceReport } from "@/lib/compliance/report";
import { ComplianceReportView } from "@/components/compliance/ComplianceReportView";
import { Star8 } from "@/components/ui/Motif";

// Print-friendly compliance record. Opened in a new tab from the compliance view;
// lives outside the /admin route group so it does NOT inherit the dashboard chrome.
export default async function CompliancePrintPage({
  params,
}: PageProps<"/print/compliance/[studentId]">) {
  const { studentId } = await params;
  const user = await requireRole("admin");
  const { t, intlLocale } = await getT(user);

  const students = await listStudents(user.masjidId);
  const student = students.find((s) => s.id === studentId);
  if (!student) notFound();

  const report = await assembleComplianceReport(student.id, student.name, user.masjidId);

  return (
    <div data-theme="light" className="min-h-screen bg-bg text-ink-2">
      <div className="mx-auto max-w-3xl p-8">
        <div className="mb-6 flex items-baseline justify-between border-b border-border-strong pb-3">
          <div className="flex items-center gap-2.5">
            <Star8 className="h-6 w-6 text-terracotta" />
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                {t("compliance.printRecordTitle")}
              </p>
              <p className="text-xs text-ink-4">
                {t("compliance.printGeneratedBy", {
                  when: new Date(report.assembledAt).toLocaleDateString(intlLocale),
                })}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border-strong px-3 py-1 text-xs text-ink-3 print:hidden">
            {t("compliance.printHint")}
          </span>
        </div>
        <ComplianceReportView report={report} t={t} intlLocale={intlLocale} />
      </div>
    </div>
  );
}
