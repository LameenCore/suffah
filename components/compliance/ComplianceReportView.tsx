// Shared render of a ComplianceReport - admin view, parent view, and print page.

import { RegulationNote } from "@/components/RegulationNote";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { type ComplianceLevel } from "@/lib/compliance/status";
import type { ComplianceReport } from "@/lib/compliance/report";
import type { Translator } from "@/lib/i18n";
import { levelLabel, overallHeadline, signalText } from "@/lib/i18n/compliance-text";

const TONE: Record<ComplianceLevel, "success" | "warning" | "danger"> = {
  on_track: "success",
  watch: "warning",
  gap: "danger",
};

export function ComplianceReportView({
  report,
  t,
  intlLocale,
}: {
  report: ComplianceReport;
  t: Translator;
  intlLocale: string;
}) {
  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          {t("compliance.recordTitle", { name: report.student.name })}
        </h2>
        <p className="text-sm text-ink-3">
          {report.podName ? `${report.podName} · ` : ""}
          {report.termLabel} ·{" "}
          {t("compliance.metaAssembled", {
            when: new Date(report.assembledAt).toLocaleString(intlLocale),
          })}
        </p>
      </div>

      <Card tone={TONE[report.overall.level]} className="p-4">
        <div className="flex items-center gap-2.5">
          <Badge tone={TONE[report.overall.level]} dot>
            {levelLabel(t, report.overall.level)}
          </Badge>
          <span className="font-medium text-ink">{overallHeadline(t, report.overall)}</span>
        </div>
      </Card>

      {report.pathHistory && report.pathHistory.length > 0 ? (
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-4">
            {t("compliance.pathTaken")}
          </p>
          <ul className="space-y-1 text-sm text-ink-2">
            {report.pathHistory.slice(0, 6).map((e, i) => (
              <li key={i}>
                {e.kind === "remediation_shown"
                  ? t("compliance.pathRemediationShown", {
                      title: e.nodeTitle,
                      course: e.courseName,
                    })
                  : e.kind === "remediation_passed"
                    ? t("compliance.pathRemediationPassed", { title: e.nodeTitle })
                    : t("compliance.pathFastTrack", { title: e.nodeTitle })}
                <span className="ml-2 text-xs text-ink-4">
                  {new Date(e.at).toLocaleDateString(intlLocale, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {report.retention && report.retention.totalItems > 0 ? (
        <p className="text-xs text-ink-4">
          {t("compliance.spacedReview", {
            total: report.retention.totalItems,
            extra:
              report.retention.reviewedLast7 > 0
                ? t("compliance.spacedReviewedPart", { n: report.retention.reviewedLast7 }) +
                  (report.retention.accuracyLast7 != null
                    ? t("compliance.spacedRecalledPart", {
                        pct: Math.round(report.retention.accuracyLast7 * 100),
                      })
                    : "")
                : "",
          })}
        </p>
      ) : null}

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
              <Badge tone={TONE[status.level]}>{levelLabel(t, status.level)}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-4">
              {t("compliance.pathwayMetrics", {
                pos: status.metrics.podPosition,
                total: status.metrics.totalNodes,
                passed: status.metrics.checkpointsPassed,
                attempted: status.metrics.checkpointsAttempted,
              })}
            </p>

            <ul className="mt-2 space-y-1 text-sm text-ink-2">
              {status.signalCodes.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="text-ink-4">
                    &bull;
                  </span>
                  {signalText(t, s)}
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
                        <td className="py-1 pr-3 text-ink-4">
                          {t("compliance.evidenceCheckpoint")}
                        </td>
                        <td className="py-1 pr-3 text-ink-2">{c.nodeTitle}</td>
                        <td className="py-1 pr-3 text-ink-2">
                          {c.passed
                            ? t("compliance.evidencePassed")
                            : t("compliance.evidenceNotPassed")}
                        </td>
                        <td className="py-1 text-ink-4">
                          {new Date(c.attemptedAt).toLocaleDateString(intlLocale)}
                        </td>
                      </tr>
                    ))}
                    {evidence.unitAssessments.map((u, i) => (
                      <tr key={`u${i}`}>
                        <td className="py-1 pr-3 text-ink-4">
                          {t("compliance.evidenceUnit")}
                        </td>
                        <td className="py-1 pr-3 text-ink-2">{u.unitTitle}</td>
                        <td className="py-1 pr-3 text-ink-2">
                          {Math.round(u.score * 100)}% ·{" "}
                          {u.passed
                            ? t("compliance.evidencePassed")
                            : t("compliance.evidenceNotPassed")}
                        </td>
                        <td className="py-1 text-ink-4">
                          {new Date(u.attemptedAt).toLocaleDateString(intlLocale)}
                        </td>
                      </tr>
                    ))}
                    {evidence.termExams.map((tx, i) => (
                      <tr key={`t${i}`}>
                        <td className="py-1 pr-3 text-ink-4">
                          {t("compliance.evidenceTermExam")}
                        </td>
                        <td className="py-1 pr-3 text-ink-2">{tx.termLabel}</td>
                        <td className="py-1 pr-3 text-ink-2">{Math.round(tx.score * 100)}%</td>
                        <td className="py-1 text-ink-4">
                          {new Date(tx.attemptedAt).toLocaleDateString(intlLocale)}
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

      <RegulationNote>{t("compliance.reportRegulationNote")}</RegulationNote>
    </div>
  );
}
