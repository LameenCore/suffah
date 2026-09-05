// Shared render of a ComplianceReport - admin view, parent view, and print page.

import { RegulationNote } from "@/components/RegulationNote";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LEVEL_LABEL, type ComplianceLevel } from "@/lib/compliance/status";
import type { ComplianceReport } from "@/lib/compliance/report";

const TONE: Record<ComplianceLevel, "success" | "warning" | "danger"> = {
  on_track: "success",
  watch: "warning",
  gap: "danger",
};

export function ComplianceReportView({ report }: { report: ComplianceReport }) {
  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Progress &amp; evaluation record &mdash; {report.student.name}
        </h2>
        <p className="text-sm text-ink-3">
          {report.podName ? `${report.podName} · ` : ""}
          {report.termLabel} · assembled {new Date(report.assembledAt).toLocaleString()}
        </p>
      </div>

      <Card tone={TONE[report.overall.level]} className="p-4">
        <div className="flex items-center gap-2.5">
          <Badge tone={TONE[report.overall.level]} dot>
            {LEVEL_LABEL[report.overall.level]}
          </Badge>
          <span className="font-medium text-ink">{report.overall.headline}</span>
        </div>
      </Card>

      <div className="space-y-4">
        {report.courses.map(({ status, evidence }) => (
          <Card
            as="section"
            key={status.courseId}
            accent={TONE[status.level]}
            className="p-4 pl-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">
                {status.courseName}
              </h3>
              <Badge tone={TONE[status.level]}>{LEVEL_LABEL[status.level]}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-4">
              Pathway: step {status.metrics.podPosition} of {status.metrics.totalNodes} ·
              checkpoints passed {status.metrics.checkpointsPassed}/
              {status.metrics.checkpointsAttempted} attempted
            </p>

            <ul className="mt-2 space-y-1 text-sm text-ink-2">
              {status.signals.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="text-ink-4">
                    &bull;
                  </span>
                  {s}
                </li>
              ))}
            </ul>

            {(evidence.checkpoints.length > 0 ||
              evidence.unitAssessments.length > 0 ||
              evidence.termExams.length > 0) && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <tbody className="divide-y divide-border">
                    {evidence.checkpoints.map((c, i) => (
                      <tr key={`c${i}`}>
                        <td className="py-1 pr-3 text-ink-4">Checkpoint</td>
                        <td className="py-1 pr-3 text-ink-2">{c.nodeTitle}</td>
                        <td className="py-1 pr-3 text-ink-2">
                          {c.passed ? "passed" : "not passed"}
                        </td>
                        <td className="py-1 text-ink-4">
                          {new Date(c.attemptedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {evidence.unitAssessments.map((u, i) => (
                      <tr key={`u${i}`}>
                        <td className="py-1 pr-3 text-ink-4">Unit assessment</td>
                        <td className="py-1 pr-3 text-ink-2">{u.unitTitle}</td>
                        <td className="py-1 pr-3 text-ink-2">
                          {Math.round(u.score * 100)}% · {u.passed ? "passed" : "not passed"}
                        </td>
                        <td className="py-1 text-ink-4">
                          {new Date(u.attemptedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {evidence.termExams.map((t, i) => (
                      <tr key={`t${i}`}>
                        <td className="py-1 pr-3 text-ink-4">Term exam</td>
                        <td className="py-1 pr-3 text-ink-2">{t.termLabel}</td>
                        <td className="py-1 pr-3 text-ink-2">{Math.round(t.score * 100)}%</td>
                        <td className="py-1 text-ink-4">
                          {new Date(t.attemptedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>

      <RegulationNote>
        Status thresholds (checkpoint pass rate, {`>= 70%`} to pass an assessment, term-exam
        equivalency) are illustrative for this demo and must be verified against current
        Quebec home-instruction evaluation requirements before this record is used for
        compliance.
      </RegulationNote>
    </div>
  );
}
