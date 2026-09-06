import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT, type Translator } from "@/lib/i18n";
import { RegulationNote } from "@/components/RegulationNote";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dome, Crescent } from "@/components/ui/Motif";
import {
  getChildReport,
  getChildrenForParent,
  type ChildReport,
  type CourseReport,
} from "@/lib/db/parent-queries";
import {
  getChildBarakahSummary,
  type ChildBarakahSummary,
} from "@/lib/db/barakah-queries";
import { getConsistency, type Consistency } from "@/lib/db/consistency-queries";
import {
  getChildAttendanceSummary,
  type ChildAttendanceSummary,
} from "@/lib/db/attendance-queries";
import { ConsistencyStrip } from "@/components/student/ConsistencyStrip";
import { assembleFromChildReport } from "@/lib/compliance/report";
import { type ComplianceLevel, type OverallCompliance } from "@/lib/compliance/status";
import { getActiveConsent } from "@/lib/consent";

const pct = (frac: number) => `${Math.round(frac * 100)}%`;
const shortDate = (iso: string, intlLocale: string) =>
  new Date(iso).toLocaleDateString(intlLocale, { month: "short", day: "numeric" });

const LEVEL_TONE: Record<ComplianceLevel, "success" | "warning" | "danger"> = {
  on_track: "success",
  watch: "warning",
  gap: "danger",
};

const LEVEL_KEY: Record<ComplianceLevel, "parent.levelOnTrack" | "parent.levelWatch" | "parent.levelGap"> = {
  on_track: "parent.levelOnTrack",
  watch: "parent.levelWatch",
  gap: "parent.levelGap",
};

/** Localised restatement of computeOverall's English headline, from level + counts. */
function overallHeadline(t: Translator, o: OverallCompliance): string {
  if (o.level === "gap") {
    return t(o.counts.gap === 1 ? "parent.overallGapOne" : "parent.overallGapMany", {
      n: o.counts.gap,
    });
  }
  if (o.level === "watch") {
    return t(o.counts.watch === 1 ? "parent.overallWatchOne" : "parent.overallWatchMany", {
      n: o.counts.watch,
    });
  }
  return t("parent.overallOnTrack");
}

function ResultRow({
  label,
  right,
}: {
  label: string;
  right: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="min-w-0 truncate text-ink-2">{label}</span>
      <span className="flex shrink-0 items-center gap-2">{right}</span>
    </li>
  );
}

function CourseCard({
  course,
  t,
  intlLocale,
}: {
  course: CourseReport;
  t: Translator;
  intlLocale: string;
}) {
  const { checkpoints, unitAssessments, termExams } = course;
  const frac =
    course.totalNodes > 0
      ? Math.min(1, course.nodePosition / course.totalNodes)
      : 0;

  return (
    <Card as="section" className="p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">{course.courseName}</h3>
        <span className="text-xs text-ink-4">{course.gradeBand}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-ink-4">
          <span>{t("parent.pathway")}</span>
          <span className="tabular-nums">
            {course.totalNodes > 0
              ? t("parent.courseStep", { n: course.nodePosition, total: course.totalNodes })
              : t("parent.courseNotStarted")}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-teal transition-all"
            style={{ width: `${frac * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">
            {t("parent.checkpoints")}
          </p>
          {checkpoints.length === 0 ? (
            <p className="mt-0.5 text-sm text-ink-4">{t("parent.checkpointsNone")}</p>
          ) : (
            <ul className="mt-0.5 divide-y divide-border">
              {checkpoints.map((c, i) => (
                <ResultRow
                  key={i}
                  label={c.nodeTitle}
                  right={
                    <>
                      <Badge tone={c.passed ? "success" : "warning"}>
                        {c.passed ? t("parent.resultPassed") : t("parent.resultNeedsReview")}
                      </Badge>
                      <span className="text-xs text-ink-4">
                        {shortDate(c.attemptedAt, intlLocale)}
                      </span>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">
            {t("parent.unitAssessment")}
          </p>
          {unitAssessments.length === 0 ? (
            <p className="mt-0.5 text-sm text-ink-4">{t("parent.unitAssessmentNone")}</p>
          ) : (
            <ul className="mt-0.5 divide-y divide-border">
              {unitAssessments.map((u, i) => (
                <ResultRow
                  key={i}
                  label={u.unitTitle}
                  right={
                    <>
                      <span className="tabular-nums text-sm text-ink-2">{pct(u.score)}</span>
                      <Badge tone={u.passed ? "success" : "warning"}>
                        {u.passed ? t("parent.resultPassed") : t("parent.resultRetry")}
                      </Badge>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">
            {t("parent.termExam")}
          </p>
          {termExams.length === 0 ? (
            <p className="mt-0.5 text-sm text-ink-4">{t("parent.termExamNone")}</p>
          ) : (
            <ul className="mt-0.5 divide-y divide-border">
              {termExams.map((tx, i) => (
                <ResultRow
                  key={i}
                  label={tx.termLabel}
                  right={
                    <span className="tabular-nums text-sm font-medium text-ink">
                      {pct(tx.score)}
                    </span>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function BarakahSummary({
  barakah,
  t,
}: {
  barakah: ChildBarakahSummary;
  t: Translator;
}) {
  if (barakah.phrases.length === 0 && barakah.entries.length === 0) return null;
  return (
    <Card as="section" tone="teal" className="p-5">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
        <Crescent className="h-4 w-4 text-teal-strong" /> {t("parent.circleTitle")}
      </h3>
      <p className="mt-1 text-xs text-ink-3">{t("parent.circleLede")}</p>
      {barakah.phrases.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {barakah.phrases.map((p) => (
            <span
              key={p}
              className="inline-block rounded-full bg-teal-soft px-2.5 py-1 text-xs font-medium text-teal-strong first-letter:uppercase"
            >
              {p}
            </span>
          ))}
        </div>
      )}
      {barakah.entries.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-ink-2">
          {barakah.entries.slice(0, 4).map((e) => (
            <li key={e.id} className="flex gap-2">
              <span aria-hidden className="text-teal-strong">
                &bull;
              </span>
              <span>
                {e.note ?? e.indicatorLabel}
                {e.studentName == null && (
                  <span className="text-ink-4"> ({t("parent.wholePod")})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AttendanceSummary({
  attendance,
  t,
  intlLocale,
}: {
  attendance: ChildAttendanceSummary;
  t: Translator;
  intlLocale: string;
}) {
  const tone: Record<ChildAttendanceSummary["recent"][number]["status"], "success" | "warning" | "danger"> = {
    present: "success",
    excused: "warning",
    absent: "danger",
  };
  const label: Record<ChildAttendanceSummary["recent"][number]["status"], string> = {
    present: t("parent.attendancePresent"),
    excused: t("parent.attendanceExcused"),
    absent: t("parent.attendanceAbsent"),
  };
  return (
    <Card as="section" className="p-5">
      <h3 className="font-display text-lg font-semibold text-ink">
        {t("parent.attendanceTitle")}
      </h3>
      <p className="mt-1 text-xs text-ink-3">{t("parent.attendanceLede")}</p>
      {attendance.sessions === 0 ? (
        <p className="mt-3 text-sm text-ink-4">{t("parent.attendanceNone")}</p>
      ) : (
        <>
          <p className="mt-3 text-sm text-ink-2">
            {t("parent.attendanceCount", {
              present: attendance.present,
              sessions: attendance.sessions,
            })}
          </p>
          <ul className="mt-2 divide-y divide-border">
            {attendance.recent.map((r, i) => (
              <ResultRow
                key={i}
                label={r.topic ?? shortDate(`${r.date}T12:00:00`, intlLocale)}
                right={
                  <>
                    <Badge tone={tone[r.status]}>{label[r.status]}</Badge>
                    <span className="text-xs text-ink-4">
                      {shortDate(`${r.date}T12:00:00`, intlLocale)}
                    </span>
                  </>
                }
              />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function ChildBlock({
  report,
  barakah,
  consistency,
  attendance,
  t,
  intlLocale,
}: {
  report: ChildReport;
  barakah: ChildBarakahSummary;
  consistency: Consistency;
  attendance: ChildAttendanceSummary;
  t: Translator;
  intlLocale: string;
}) {
  // report is already loaded by ParentHome - assemble the status view in memory
  // rather than re-fetching the whole child report.
  const compliance = assembleFromChildReport(report);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">{report.child.name}</h2>
        {report.podName && <span className="text-sm text-ink-3">{report.podName}</span>}
      </div>

      <Card
        as="section"
        tone={LEVEL_TONE[compliance.overall.level]}
        className="flex flex-wrap items-center justify-between gap-3 p-4"
      >
        <div className="flex items-center gap-2.5">
          <Badge tone={LEVEL_TONE[compliance.overall.level]} dot>
            {t(LEVEL_KEY[compliance.overall.level])}
          </Badge>
          <span className="text-sm text-ink-2">{overallHeadline(t, compliance.overall)}</span>
        </div>
        <Link
          href="/parent/compliance"
          className="text-sm font-medium text-terracotta hover:text-terracotta-strong"
        >
          {t("parent.fullEvaluation")} &rarr;
        </Link>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {report.courses.map((c) => (
          <CourseCard key={c.courseId} course={c} t={t} intlLocale={intlLocale} />
        ))}
      </div>
      <BarakahSummary barakah={barakah} t={t} />
      <AttendanceSummary attendance={attendance} t={t} intlLocale={intlLocale} />
      <ConsistencyStrip consistency={consistency} audience="parent" t={t} />

      <div className="flex flex-wrap gap-3 text-sm">
        <a
          href={`/print/transcript/${report.child.id}`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-terracotta hover:text-terracotta-strong"
        >
          {t("parent.transcriptPrintable")} &rarr;
        </a>
        <a
          href={`/api/transcript/${report.child.id}?format=csv`}
          className="text-ink-3 hover:text-ink"
        >
          {t("parent.downloadCsv")}
        </a>
      </div>
    </div>
  );
}

export default async function ParentHome() {
  const user = await requireRole("parent");
  const { t, intlLocale } = await getT(user);

  let blocks: {
    report: ChildReport;
    barakah: ChildBarakahSummary;
    consistency: Consistency;
    attendance: ChildAttendanceSummary;
  }[] = [];
  let loadError: string | null = null;
  let needsConsent: string[] = [];

  try {
    const children = await getChildrenForParent(user.id, user.masjidId);
    blocks = await Promise.all(
      children.map(async (c) => ({
        report: await getChildReport(c, user.masjidId),
        barakah: await getChildBarakahSummary(c.id, user.masjidId),
        consistency: await getConsistency(c.id, user.masjidId),
        attendance: await getChildAttendanceSummary(c.id, user.masjidId),
      })),
    );
    const consent = await Promise.all(
      children.map(async (c) => ({
        name: c.name,
        ok: (await getActiveConsent(c.id, user.masjidId)) !== null,
      })),
    );
    needsConsent = consent.filter((c) => !c.ok).map((c) => c.name);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load progress";
  }

  return (
    <div className="space-y-7">
      <PageHeader
        kicker={t("nav.thisWeek")}
        title={t("parent.greeting")}
        lede={t("parent.lede")}
      />

      {needsConsent.length > 0 ? (
        <Card tone="warning" className="flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm text-ink-2">
            {t("parent.consentLocked", {
              names: needsConsent.join(` ${t("common.and")} `),
            })}
          </span>
          <Link
            href="/parent/consent"
            className="text-sm font-medium text-terracotta hover:text-terracotta-strong"
          >
            {t("parent.reviewConsent")} &rarr;
          </Link>
        </Card>
      ) : null}

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("parent.progressUnavailable", { error: loadError })}{" "}
          <code>npm run seed</code>
        </Card>
      ) : blocks.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">{t("parent.noChildLinked")}</Card>
      ) : (
        <div className="space-y-9">
          {blocks.map((b) => (
            <ChildBlock
              key={b.report.child.id}
              report={b.report}
              barakah={b.barakah}
              consistency={b.consistency}
              attendance={b.attendance}
              t={t}
              intlLocale={intlLocale}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-2 p-4 text-sm text-ink-3">
        <Dome className="mt-0.5 h-5 w-8 shrink-0 text-terracotta" />
        <p>{t("parent.enrichmentNote")}</p>
      </div>

      <RegulationNote>{t("parent.regulationNote")}</RegulationNote>
    </div>
  );
}
