import { requireRole } from "@/lib/auth";
import { getLearningAnalytics, getMissionHealth } from "@/lib/db/analytics-queries";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { RegulationNote } from "@/components/RegulationNote";

export const metadata = { title: "Learning analytics" };

const pct = (f: number) => `${Math.round(f * 100)}%`;
const money = (v: number) =>
  Math.abs(v).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });

/** Tiny inline bar for the drop-off histogram — position 0..N, height = count. */
function DropOff({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  return (
    <div className="flex items-end gap-1" aria-hidden>
      {counts.map((c, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-teal/70"
            style={{ height: `${8 + (c / max) * 44}px` }}
            title={`position ${i}: ${c} student${c === 1 ? "" : "s"}`}
          />
          <span className="text-[10px] tabular-nums text-ink-4">{i}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const user = await requireRole("admin");

  let a: Awaited<ReturnType<typeof getLearningAnalytics>> | null = null;
  let health: Awaited<ReturnType<typeof getMissionHealth>> | null = null;
  let loadError: string | null = null;
  try {
    [a, health] = await Promise.all([
      getLearningAnalytics(user.masjidId),
      getMissionHealth(user.masjidId),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load analytics";
  }

  const one = (v: number | null, suffix = "") =>
    v == null ? "—" : `${v.toFixed(1)}${suffix}`;

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Analytics"
        title="Learning analytics"
        lede="Aggregate engagement, completion, drop-off and cohort views — read-only, no per-student detail beyond what the compliance status already shows."
        back={{ href: "/admin", label: "Overview" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          Analytics unavailable: {loadError}.
        </Card>
      ) : a ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink
              href="/admin/analytics/export"
              variant="ghost"
              size="sm"
              prefetch={false}
            >
              Export CSV
            </ButtonLink>
            <span className="text-xs text-ink-4">Term: {a.termLabel}</span>
          </div>

          {health ? (
            <Card as="section" tone="teal" className="p-5">
              <SectionTitle>Mission health</SectionTitle>
              <p className="mt-1 text-xs text-ink-3">
                The seven numbers defined in{" "}
                <code className="rounded bg-surface-2 px-1">docs/metrics.md</code> — all
                derived from operational data, no tracker.
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-7">
                {[
                  { t: "Completion", v: pct(health.completionRate) },
                  {
                    t: "Time to value",
                    v: one(health.timeToValueDays, "d"),
                  },
                  { t: "Retention 30d", v: pct(health.familyRetention30d) },
                  {
                    t: "At risk",
                    v: `${health.atRiskCount} (${pct(health.atRiskShare)})`,
                  },
                  { t: "Volunteer churn", v: pct(health.volunteerChurnRate) },
                  {
                    t: "AI $/active",
                    v:
                      health.aiCostPerActiveStudentUsd == null
                        ? "—"
                        : `$${health.aiCostPerActiveStudentUsd.toFixed(2)}`,
                  },
                  {
                    t: "Waqf runway",
                    v: one(health.waqfRunwayYears, " yr"),
                  },
                ].map((m) => (
                  <div key={m.t}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">
                      {m.t}
                    </dt>
                    <dd className="mt-0.5 font-display text-lg font-semibold text-ink">
                      {m.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active students"
              value={`${a.studentsActive}/${a.students}`}
              accent="teal"
              hint={`${pct(a.activeRate)} have attempted a checkpoint`}
            />
            <StatCard
              label="On track"
              value={a.atRisk.on_track}
              accent="teal"
              hint={`${a.atRisk.watch} watch · ${a.atRisk.gap} gap`}
            />
            <StatCard
              label="Volunteer churn"
              value={pct(a.volunteers.churnRate)}
              accent="terracotta"
              hint={`${a.volunteers.active} active · ${a.volunteers.departed} departed · ${a.volunteers.departures90d} in 90d`}
            />
            <StatCard
              label="Waqf runway"
              value={a.waqf.runwayYears == null ? "—" : `${a.waqf.runwayYears.toFixed(1)} yr`}
              accent="mustard"
              hint={`draw ceiling ${money(a.waqf.annualDrawCeiling)}/yr · ${money(
                a.waqf.scholarshipsAllocated,
              )} scholarships`}
            />
          </section>

          <section className="space-y-3">
            <SectionTitle>Completion & drop-off by course</SectionTitle>
            <div className="grid gap-4 lg:grid-cols-3">
              {a.courses.map((c) => (
                <Card key={c.courseId} as="section" className="space-y-3 p-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-base font-semibold text-ink">
                      {c.courseName}
                    </h3>
                    <span className="text-xs text-ink-4">{c.totalNodes} nodes</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>
                      <span className="font-semibold text-ink">{pct(c.completionRate)}</span>{" "}
                      <span className="text-ink-4">complete</span>
                    </span>
                    <span>
                      <span className="font-semibold text-ink">
                        {pct(c.unitAssessmentPassRate)}
                      </span>{" "}
                      <span className="text-ink-4">unit pass</span>
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-4">
                      Students by furthest checkpoint passed
                    </p>
                    <DropOff counts={c.dropOff} />
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>Cohorts by pod</SectionTitle>
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-4">
                    <th className="px-4 py-2.5 font-semibold">Pod</th>
                    <th className="px-4 py-2.5 font-semibold">Students</th>
                    <th className="px-4 py-2.5 font-semibold">Avg progress</th>
                    <th className="px-4 py-2.5 font-semibold">Checkpoint pass</th>
                    <th className="px-4 py-2.5 font-semibold">At risk</th>
                  </tr>
                </thead>
                <tbody>
                  {a.cohorts.map((p) => (
                    <tr key={p.podId} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-ink">{p.podName}</td>
                      <td className="px-4 py-2.5 tabular-nums text-ink-2">{p.students}</td>
                      <td className="px-4 py-2.5 tabular-nums text-ink-2">
                        {pct(p.avgProgress)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-ink-2">
                        {pct(p.checkpointPassRate)}
                      </td>
                      <td className="px-4 py-2.5">
                        {p.atRisk > 0 ? (
                          <Badge tone="warning">{p.atRisk}</Badge>
                        ) : (
                          <span className="text-ink-4">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {a.cohorts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-ink-4">
                        No pods with students yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Card>
          </section>

          <RegulationNote>
            &ldquo;At risk&rdquo; uses the same illustrative thresholds as the compliance
            status view and is a planning aid, not an official evaluation. Waqf runway is a
            rough projection (4% annual draw assumption) for internal planning only.
          </RegulationNote>
        </>
      ) : null}
    </div>
  );
}
