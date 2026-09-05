import Link from "next/link";
import { requireRole } from "@/lib/auth";
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
import { ConsistencyStrip } from "@/components/student/ConsistencyStrip";
import { assembleFromChildReport } from "@/lib/compliance/report";
import { LEVEL_LABEL, type ComplianceLevel } from "@/lib/compliance/status";
import { getActiveConsent } from "@/lib/consent";

const pct = (frac: number) => `${Math.round(frac * 100)}%`;
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

const LEVEL_TONE: Record<ComplianceLevel, "success" | "warning" | "danger"> = {
  on_track: "success",
  watch: "warning",
  gap: "danger",
};

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

function CourseCard({ course }: { course: CourseReport }) {
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
          <span>Pathway</span>
          <span className="tabular-nums">
            {course.totalNodes > 0
              ? `step ${course.nodePosition} of ${course.totalNodes}`
              : "not started"}
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
            Checkpoints
          </p>
          {checkpoints.length === 0 ? (
            <p className="mt-0.5 text-sm text-ink-4">None attempted yet.</p>
          ) : (
            <ul className="mt-0.5 divide-y divide-border">
              {checkpoints.map((c, i) => (
                <ResultRow
                  key={i}
                  label={c.nodeTitle}
                  right={
                    <>
                      <Badge tone={c.passed ? "success" : "warning"}>
                        {c.passed ? "Passed" : "Needs review"}
                      </Badge>
                      <span className="text-xs text-ink-4">{shortDate(c.attemptedAt)}</span>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">
            Unit assessment
          </p>
          {unitAssessments.length === 0 ? (
            <p className="mt-0.5 text-sm text-ink-4">Not due yet.</p>
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
                        {u.passed ? "Passed" : "Retry"}
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
            Term exam
          </p>
          {termExams.length === 0 ? (
            <p className="mt-0.5 text-sm text-ink-4">Not taken yet.</p>
          ) : (
            <ul className="mt-0.5 divide-y divide-border">
              {termExams.map((t, i) => (
                <ResultRow
                  key={i}
                  label={t.termLabel}
                  right={
                    <span className="tabular-nums text-sm font-medium text-ink">
                      {pct(t.score)}
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

function BarakahSummary({ barakah }: { barakah: ChildBarakahSummary }) {
  if (barakah.phrases.length === 0 && barakah.entries.length === 0) return null;
  return (
    <Card as="section" tone="teal" className="p-5">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
        <Crescent className="h-4 w-4 text-teal-strong" /> In the circle
      </h3>
      <p className="mt-1 text-xs text-ink-3">
        What the pod&apos;s volunteers have noticed - adab and cooperation, not a score.
      </p>
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
                {e.studentName == null && <span className="text-ink-4"> (whole pod)</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

async function ChildBlock({
  report,
  barakah,
  consistency,
}: {
  report: ChildReport;
  barakah: ChildBarakahSummary;
  consistency: Consistency;
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
            {LEVEL_LABEL[compliance.overall.level]}
          </Badge>
          <span className="text-sm text-ink-2">{compliance.overall.headline}</span>
        </div>
        <Link
          href="/parent/compliance"
          className="text-sm font-medium text-terracotta hover:text-terracotta-strong"
        >
          Full evaluation status &rarr;
        </Link>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {report.courses.map((c) => (
          <CourseCard key={c.courseId} course={c} />
        ))}
      </div>
      <BarakahSummary barakah={barakah} />
      <ConsistencyStrip consistency={consistency} audience="parent" />

      <div className="flex flex-wrap gap-3 text-sm">
        <a
          href={`/print/transcript/${report.child.id}`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-terracotta hover:text-terracotta-strong"
        >
          Term-completion record (printable) &rarr;
        </a>
        <a
          href={`/api/transcript/${report.child.id}?format=csv`}
          className="text-ink-3 hover:text-ink"
        >
          Download as CSV
        </a>
      </div>
    </div>
  );
}

export default async function ParentHome() {
  const user = await requireRole("parent");

  let blocks: {
    report: ChildReport;
    barakah: ChildBarakahSummary;
    consistency: Consistency;
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
        kicker="This week"
        title={`As-salamu alaykum${blocks.length ? "" : ""}`}
        lede="A calm, read-only view of how your child is doing. Results appear here the moment they finish."
      />

      {needsConsent.length > 0 ? (
        <Card tone="warning" className="flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm text-ink-2">
            {needsConsent.join(" and ")}&apos;s playground is locked until you complete the
            consent step.
          </span>
          <Link
            href="/parent/consent"
            className="text-sm font-medium text-terracotta hover:text-terracotta-strong"
          >
            Review consent &rarr;
          </Link>
        </Card>
      ) : null}

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          Progress is unavailable: {loadError}. Run <code>npm run seed</code>.
        </Card>
      ) : blocks.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">
          No child is linked to this account yet.
        </Card>
      ) : (
        <div className="space-y-9">
          {blocks.map((b) => (
            <ChildBlock
              key={b.report.child.id}
              report={b.report}
              barakah={b.barakah}
              consistency={b.consistency}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-2 p-4 text-sm text-ink-3">
        <Dome className="mt-0.5 h-5 w-8 shrink-0 text-terracotta" />
        <p>
          Your pod meets with a community volunteer for live enrichment. Schedule and
          fee/sponsorship details are managed by the masjid - reach out to the
          coordinator with any questions.
        </p>
      </div>

      <RegulationNote>
        Assessment and exam formats shown here are for the demo and must be verified against
        current Quebec evaluation requirements before they stand in for an official
        evaluation.
      </RegulationNote>
    </div>
  );
}
