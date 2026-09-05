import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listStudents } from "@/lib/db/admin-queries";
import { assembleComplianceReport, getLatestStoredReport } from "@/lib/compliance/report";
import { getTutorTranscript } from "@/lib/ai/tutor";
import { ComplianceReportView } from "@/components/compliance/ComplianceReportView";
import { TutorTranscriptView } from "@/components/student/TutorTranscriptView";
import { SnapshotBar } from "@/components/compliance/SnapshotBar";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default async function AdminCompliancePage({
  searchParams,
}: PageProps<"/admin/compliance">) {
  const user = await requireRole("admin");
  const sp = await searchParams;
  const selectedId = typeof sp.student === "string" ? sp.student : null;

  let students: Awaited<ReturnType<typeof listStudents>> = [];
  let loadError: string | null = null;
  try {
    students = await listStudents(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load students";
  }

  const selected = students.find((s) => s.id === selectedId) ?? students[0] ?? null;

  const [report, stored, tutorTranscripts] = selected
    ? await Promise.all([
        assembleComplianceReport(selected.id, selected.name, user.masjidId),
        getLatestStoredReport(selected.id, user.masjidId),
        getTutorTranscript(selected.id, user.masjidId).catch(() => []),
      ])
    : [null, null, []];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Compliance"
        title="Progress & evaluation record"
        lede="Assembled continuously from checkpoint, unit-assessment and term-exam data. Each course carries a forward-looking status - on track, watch, or gap forming - not just a backward record."
        back={{ href: "/admin", label: "Overview" }}
      />

      <RegulationNote>
        Whether this record satisfies Quebec&apos;s home-instruction evaluation requirement,
        and in what format, must be confirmed against current regulation. The status
        thresholds here are illustrative.
      </RegulationNote>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. Run <code>npm run seed</code>.
        </Card>
      ) : students.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">No students yet.</Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <Link
                key={s.id}
                href={`/admin/compliance?student=${s.id}`}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  selected?.id === s.id
                    ? "border-terracotta bg-terracotta-soft font-medium text-terracotta-strong"
                    : "border-border text-ink-3 hover:border-border-strong"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>

          {selected && report ? (
            <>
              <SnapshotBar
                studentId={selected.id}
                studentName={selected.name}
                lastSnapshotAt={stored?.generatedAt ?? null}
              />
              <ComplianceReportView report={report} />
              <TutorTranscriptView transcripts={tutorTranscripts} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
