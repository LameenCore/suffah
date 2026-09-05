import { requireRole } from "@/lib/auth";
import { RegulationNote } from "@/components/RegulationNote";
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

const pct = (frac: number) => `${Math.round(frac * 100)}%`;
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

function ProgressBar({ position, total }: { position: number; total: number }) {
  const frac = total > 0 ? Math.min(1, position / total) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Pathway progress</span>
        <span className="tabular-nums">
          {total > 0 ? `node ${position} of ${total}` : "not started"}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-sky-500 dark:bg-sky-400"
          style={{ width: `${frac * 100}%` }}
        />
      </div>
    </div>
  );
}

function ResultBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
        passed
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
      }`}
    >
      {passed ? "Passed" : "Needs review"}
    </span>
  );
}

function CourseCard({ course }: { course: CourseReport }) {
  const { checkpoints, unitAssessments, termExams } = course;
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium">{course.courseName}</h3>
        <span className="text-xs text-zinc-400">{course.gradeBand}</span>
      </div>

      <div className="mt-3">
        <ProgressBar position={course.nodePosition} total={course.totalNodes} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Checkpoints
          </div>
          {checkpoints.length === 0 ? (
            <p className="mt-1 text-zinc-400">None attempted yet.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {checkpoints.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{c.nodeTitle}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <ResultBadge passed={c.passed} />
                    <span className="text-xs text-zinc-400">{shortDate(c.attemptedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Unit assessments
          </div>
          {unitAssessments.length === 0 ? (
            <p className="mt-1 text-zinc-400">None yet.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {unitAssessments.map((u, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{u.unitTitle}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums">{pct(u.score)}</span>
                    <ResultBadge passed={u.passed} />
                    <span className="text-xs text-zinc-400">{shortDate(u.attemptedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Term exams
          </div>
          {termExams.length === 0 ? (
            <p className="mt-1 text-zinc-400">None yet.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {termExams.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{t.termLabel}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums">{pct(t.score)}</span>
                    <span className="text-xs text-zinc-400">{shortDate(t.attemptedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function BarakahSummary({ barakah }: { barakah: ChildBarakahSummary }) {
  if (barakah.phrases.length === 0 && barakah.entries.length === 0) return null;
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
      <h3 className="font-medium">Character &amp; community</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        What the pod&apos;s volunteers have noticed - not a score.
      </p>
      {barakah.phrases.length > 0 && (
        <p className="mt-2 text-sm capitalize text-zinc-700 dark:text-zinc-200">
          {barakah.phrases.join(" · ")}
        </p>
      )}
      {barakah.entries.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
          {barakah.entries.slice(0, 4).map((e) => (
            <li key={e.id} className="flex gap-2">
              <span aria-hidden className="text-zinc-400">
                ·
              </span>
              <span>
                {e.note ?? e.indicatorLabel}
                {e.studentName == null && (
                  <span className="text-zinc-400"> (whole pod)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ChildBlock({
  report,
  barakah,
}: {
  report: ChildReport;
  barakah: ChildBarakahSummary;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold">{report.child.name}</h2>
        {report.podName && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{report.podName}</span>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {report.courses.map((c) => (
          <CourseCard key={c.courseId} course={c} />
        ))}
      </div>
      <BarakahSummary barakah={barakah} />
    </div>
  );
}

export default async function ParentHome() {
  const user = await requireRole("parent");

  let blocks: { report: ChildReport; barakah: ChildBarakahSummary }[] = [];
  let loadError: string | null = null;

  try {
    const children = await getChildrenForParent(user.id, user.masjidId);
    blocks = await Promise.all(
      children.map(async (c) => ({
        report: await getChildReport(c, user.masjidId),
        barakah: await getChildBarakahSummary(c.id, user.masjidId),
      })),
    );
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load progress";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parent Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Read-only view of your child&apos;s progress. Results appear here as soon as
          your child completes them.
        </p>
      </div>

      <RegulationNote>
        Assessment and exam formats shown here are for the demo and must be verified
        against current Quebec evaluation requirements before they stand in for an
        official evaluation.
      </RegulationNote>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          Progress is unavailable: {loadError}. Configure Supabase and run the seed to
          populate this view.
        </p>
      ) : blocks.length === 0 ? (
        <p className="rounded-xl border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15">
          No child is linked to this account yet.
        </p>
      ) : (
        <div className="space-y-8">
          {blocks.map((b) => (
            <ChildBlock key={b.report.child.id} report={b.report} barakah={b.barakah} />
          ))}
        </div>
      )}
    </div>
  );
}
