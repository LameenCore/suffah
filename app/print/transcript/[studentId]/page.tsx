import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
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

  const { t, intlLocale } = await getT(user);

  const { data: row } = await getServiceClient()
    .from("users")
    .select("name")
    .eq("id", studentId)
    .maybeSingle();
  const name = (row?.name as string | undefined) ?? "Student";

  const record = await assembleTranscript(studentId, name, user.masjidId);

  return (
    <div data-theme="light" className="min-h-screen bg-bg text-ink-2">
      <div className="mx-auto max-w-3xl p-8">
        <div className="mb-6 flex items-baseline justify-between border-b border-border-strong pb-3">
          <div className="flex items-center gap-2.5">
            <Star8 className="h-6 w-6 text-terracotta" />
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                {t("compliance.printTranscriptTitle")}
              </p>
              <p className="text-xs text-ink-4">
                {t("compliance.printGeneratedByTerm", {
                  term: record.termLabel,
                  when: new Date(record.generatedAt).toLocaleDateString(intlLocale),
                })}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border-strong px-3 py-1 text-xs text-ink-3 print:hidden">
            {t("compliance.printHint")}
          </span>
        </div>

        <div className="mb-4">
          <h1 className="font-display text-xl font-semibold text-ink">{record.student.name}</h1>
          {record.podName ? <p className="text-sm text-ink-3">{record.podName}</p> : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-4 rounded-[var(--radius)] border border-border bg-surface-2 px-4 py-3 text-sm">
          <span>
            <strong>{record.totals.checkpointsPassed}</strong>{" "}
            {t("compliance.transcriptCheckpointsPassed")}
          </span>
          <span>
            <strong>{record.totals.unitsPassed}</strong>{" "}
            {t("compliance.transcriptUnitsPassed")}
          </span>
          <span>
            <strong>{record.totals.termExamsTaken}</strong>{" "}
            {t("compliance.transcriptTermExamsTaken")}
          </span>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-strong text-left text-xs uppercase tracking-wide text-ink-4">
              <th className="py-2 pr-3">{t("compliance.transcriptColCourse")}</th>
              <th className="py-2 pr-3">{t("compliance.transcriptColPathway")}</th>
              <th className="py-2 pr-3">{t("compliance.transcriptColCheckpoints")}</th>
              <th className="py-2 pr-3">{t("compliance.transcriptColUnits")}</th>
              <th className="py-2">{t("compliance.transcriptColTermExam")}</th>
            </tr>
          </thead>
          <tbody>
            {record.courses.map((c) => (
              <tr key={c.courseName} className="border-b border-border align-top">
                <td className="py-2 pr-3">
                  <span className="font-medium text-ink">{c.courseName}</span>
                  <br />
                  <span className="text-xs text-ink-4">{c.gradeBand}</span>
                </td>
                <td className="py-2 pr-3">
                  {c.pathwayTotal > 0
                    ? t("compliance.transcriptStep", {
                        step: c.pathwayStep,
                        total: c.pathwayTotal,
                      })
                    : "-"}
                </td>
                <td className="py-2 pr-3">
                  {c.checkpointsPassed}/{c.checkpointsAttempted}{" "}
                  {t("compliance.transcriptPassedSuffix")}
                </td>
                <td className="py-2 pr-3">
                  {c.unitsPassed}/{c.unitsAttempted} {t("compliance.transcriptPassedSuffix")}
                  {c.bestUnitScore != null
                    ? ` · ${t("compliance.transcriptBestSuffix", { pct: pct(c.bestUnitScore) })}`
                    : ""}
                </td>
                <td className="py-2">
                  {c.termExam
                    ? `${pct(c.termExam.score)} (${c.termExam.attemptedAt.slice(0, 10)})`
                    : t("compliance.transcriptNotTaken")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex items-end justify-between gap-6 border-t border-border-strong pt-4">
          <div className="text-xs text-ink-4">
            <p>{t("compliance.transcriptIssuedBy")}</p>
            <div className="mt-6 w-56 border-b border-ink-3" />
            <p className="mt-1">{t("compliance.transcriptNameDate")}</p>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center whitespace-pre-line rounded-full border-2 border-terracotta/50 text-center text-[9px] leading-tight text-terracotta">
            {t("compliance.transcriptStamp")}
          </div>
        </div>

        <div className="mt-6">
          <RegulationNote>{t("compliance.transcriptRegulationNote")}</RegulationNote>
        </div>
      </div>
    </div>
  );
}
