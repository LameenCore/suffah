// Shared render of a ComplianceReport - used on the admin view, the parent view,
// and the print page. Pure presentation.

import { RegulationNote } from "@/components/RegulationNote";
import { LEVEL_LABEL, type ComplianceLevel } from "@/lib/compliance/status";
import type { ComplianceReport } from "@/lib/compliance/report";

const LEVEL_PILL: Record<ComplianceLevel, string> = {
  on_track:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60",
  watch:
    "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700/60",
  gap:
    "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-300 dark:border-red-700/60",
};

const OVERALL_BANNER: Record<ComplianceLevel, string> = {
  on_track: "border-emerald-300 bg-emerald-50 dark:border-emerald-700/60 dark:bg-emerald-950/30",
  watch: "border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30",
  gap: "border-red-300 bg-red-50 dark:border-red-700/60 dark:bg-red-950/30",
};

function Pill({ level }: { level: ComplianceLevel }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${LEVEL_PILL[level]}`}>
      {LEVEL_LABEL[level]}
    </span>
  );
}

export function ComplianceReportView({ report }: { report: ComplianceReport }) {
  return (
    <div className="space-y-5">
      <div className="border-b border-black/10 pb-3 dark:border-white/15">
        <h2 className="text-lg font-semibold">
          Progress &amp; evaluation record - {report.student.name}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {report.podName ? `${report.podName} · ` : ""}
          {report.termLabel} · assembled {new Date(report.assembledAt).toLocaleString()}
        </p>
      </div>

      <div className={`rounded-lg border p-3 text-sm ${OVERALL_BANNER[report.overall.level]}`}>
        <div className="flex items-center gap-2">
          <Pill level={report.overall.level} />
          <span className="font-medium text-zinc-800 dark:text-zinc-100">
            {report.overall.headline}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {report.courses.map(({ status, evidence }) => (
          <section
            key={status.courseId}
            className="rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{status.courseName}</h3>
              <Pill level={status.level} />
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Pathway position: node {status.metrics.podPosition} of {status.metrics.totalNodes} ·
              checkpoints passed {status.metrics.checkpointsPassed}/{status.metrics.checkpointsAttempted}{" "}
              attempted
            </p>

            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
              {status.signals.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>

            {(evidence.checkpoints.length > 0 ||
              evidence.unitAssessments.length > 0 ||
              evidence.termExams.length > 0) && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {evidence.checkpoints.map((c, i) => (
                      <tr key={`c${i}`} className="border-t border-black/5 dark:border-white/10">
                        <td className="py-1 pr-3 text-zinc-500">Checkpoint</td>
                        <td className="py-1 pr-3">{c.nodeTitle}</td>
                        <td className="py-1 pr-3">{c.passed ? "passed" : "not passed"}</td>
                        <td className="py-1 text-zinc-400">
                          {new Date(c.attemptedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {evidence.unitAssessments.map((u, i) => (
                      <tr key={`u${i}`} className="border-t border-black/5 dark:border-white/10">
                        <td className="py-1 pr-3 text-zinc-500">Unit assessment</td>
                        <td className="py-1 pr-3">{u.unitTitle}</td>
                        <td className="py-1 pr-3">
                          {Math.round(u.score * 100)}% · {u.passed ? "passed" : "not passed"}
                        </td>
                        <td className="py-1 text-zinc-400">
                          {new Date(u.attemptedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {evidence.termExams.map((t, i) => (
                      <tr key={`t${i}`} className="border-t border-black/5 dark:border-white/10">
                        <td className="py-1 pr-3 text-zinc-500">Term exam</td>
                        <td className="py-1 pr-3">{t.termLabel}</td>
                        <td className="py-1 pr-3">{Math.round(t.score * 100)}%</td>
                        <td className="py-1 text-zinc-400">
                          {new Date(t.attemptedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>

      <RegulationNote>
        Status thresholds (checkpoint pass rate, {`>= 70%`} to pass an assessment, term-exam
        equivalency) are illustrative for this demo and must be verified against current
        Québec home-instruction evaluation requirements before this record is used for
        compliance.
      </RegulationNote>
    </div>
  );
}
