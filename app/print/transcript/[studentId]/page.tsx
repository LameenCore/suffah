import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/db";
import { canViewStudent } from "@/lib/db/access";
import { assembleTranscript } from "@/lib/transcript";
import { Star8 } from "@/components/ui/Motif";
import { RegulationNote } from "@/components/RegulationNote";

const pct = (f: number) => `${Math.round(f * 100)}%`;

// Print-friendly term-completion record (T49). Outside the dashboard route
// groups, so no chrome. Visible to an admin or a linked parent.
export default async function TranscriptPrintPage({
  params,
}: PageProps<"/print/transcript/[studentId]">) {
  const { studentId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login`);
  if (!(await canViewStudent(user, studentId))) notFound();

  const { data: row } = await getServiceClient()
    .from("users")
    .select("name")
    .eq("id", studentId)
    .maybeSingle();
  const name = (row?.name as string | undefined) ?? "Student";

  const t = await assembleTranscript(studentId, name, user.masjidId);

  return (
    <div data-theme="light" className="min-h-screen bg-bg text-ink-2">
      <div className="mx-auto max-w-3xl p-8">
        <div className="mb-6 flex items-baseline justify-between border-b border-border-strong pb-3">
          <div className="flex items-center gap-2.5">
            <Star8 className="h-6 w-6 text-terracotta" />
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                Suffa - term-completion record
              </p>
              <p className="text-xs text-ink-4">
                Masjid As-Suffa (Demo) &middot; {t.termLabel} &middot; generated{" "}
                {new Date(t.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border-strong px-3 py-1 text-xs text-ink-3 print:hidden">
            Print with Cmd/Ctrl-P
          </span>
        </div>

        <div className="mb-4">
          <h1 className="font-display text-xl font-semibold text-ink">{t.student.name}</h1>
          {t.podName ? <p className="text-sm text-ink-3">{t.podName}</p> : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-4 rounded-[var(--radius)] border border-border bg-surface-2 px-4 py-3 text-sm">
          <span>
            <strong>{t.totals.checkpointsPassed}</strong> checkpoints passed
          </span>
          <span>
            <strong>{t.totals.unitsPassed}</strong> unit assessments passed
          </span>
          <span>
            <strong>{t.totals.termExamsTaken}</strong> term exams taken
          </span>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-strong text-left text-xs uppercase tracking-wide text-ink-4">
              <th className="py-2 pr-3">Course</th>
              <th className="py-2 pr-3">Pathway</th>
              <th className="py-2 pr-3">Checkpoints</th>
              <th className="py-2 pr-3">Units</th>
              <th className="py-2">Term exam</th>
            </tr>
          </thead>
          <tbody>
            {t.courses.map((c) => (
              <tr key={c.courseName} className="border-b border-border align-top">
                <td className="py-2 pr-3">
                  <span className="font-medium text-ink">{c.courseName}</span>
                  <br />
                  <span className="text-xs text-ink-4">{c.gradeBand}</span>
                </td>
                <td className="py-2 pr-3">
                  {c.pathwayTotal > 0 ? `step ${c.pathwayStep} of ${c.pathwayTotal}` : "-"}
                </td>
                <td className="py-2 pr-3">
                  {c.checkpointsPassed}/{c.checkpointsAttempted} passed
                </td>
                <td className="py-2 pr-3">
                  {c.unitsPassed}/{c.unitsAttempted} passed
                  {c.bestUnitScore != null ? ` · best ${pct(c.bestUnitScore)}` : ""}
                </td>
                <td className="py-2">
                  {c.termExam
                    ? `${pct(c.termExam.score)} (${c.termExam.attemptedAt.slice(0, 10)})`
                    : "not taken"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex items-end justify-between gap-6 border-t border-border-strong pt-4">
          <div className="text-xs text-ink-4">
            <p>Issued by the masjid administrator</p>
            <div className="mt-6 w-56 border-b border-ink-3" />
            <p className="mt-1">Name &amp; date</p>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-terracotta/50 text-center text-[9px] leading-tight text-terracotta">
            Masjid
            <br />
            stamp
          </div>
        </div>

        <div className="mt-6">
          <RegulationNote>
            This record reports completed coursework only. It is not a statement of
            grade-level equivalency - confirm any equivalency claim against current Quebec
            home-instruction regulation.
          </RegulationNote>
        </div>
      </div>
    </div>
  );
}
