import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { getLearningAnalytics, getMissionHealth } from "@/lib/db/analytics-queries";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { RegulationNote } from "@/components/RegulationNote";

export const metadata = { title: "Learning analytics" };

const pct = (f: number) => `${Math.round(f * 100)}%`;

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
  const { t, intlLocale } = await getT(user);
  const money = (v: number) =>
    Math.abs(v).toLocaleString(intlLocale, {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    });

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
        kicker={t("admin.analytics.kicker")}
        title={t("admin.analytics.title")}
        lede={t("admin.analytics.lede")}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.analytics.unavailable", { detail: loadError })}
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
              {t("admin.analytics.exportCsv")}
            </ButtonLink>
            <span className="text-xs text-ink-4">
              {t("admin.analytics.term", { term: a.termLabel })}
            </span>
          </div>

          {health ? (
            <Card as="section" tone="teal" className="p-5">
              <SectionTitle>{t("admin.analytics.missionHealth")}</SectionTitle>
              <p className="mt-1 text-xs text-ink-3">
                {t("admin.analytics.missionHealthLedeBefore")}
                <code className="rounded bg-surface-2 px-1">docs/metrics.md</code>
                {t("admin.analytics.missionHealthLedeAfter")}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-7">
                {[
                  { t: t("admin.analytics.mhCompletion"), v: pct(health.completionRate) },
                  {
                    t: t("admin.analytics.mhTimeToValue"),
                    v: one(health.timeToValueDays, t("admin.analytics.unitDays")),
                  },
                  {
                    t: t("admin.analytics.mhRetention30d"),
                    v: pct(health.familyRetention30d),
                  },
                  {
                    t: t("admin.analytics.mhAtRisk"),
                    v: t("admin.analytics.atRiskValue", {
                      count: health.atRiskCount,
                      share: pct(health.atRiskShare),
                    }),
                  },
                  {
                    t: t("admin.analytics.mhVolunteerChurn"),
                    v: pct(health.volunteerChurnRate),
                  },
                  {
                    t: t("admin.analytics.mhAiPerActive"),
                    v:
                      health.aiCostPerActiveStudentUsd == null
                        ? "—"
                        : `$${health.aiCostPerActiveStudentUsd.toFixed(2)}`,
                  },
                  {
                    t: t("admin.analytics.mhWaqfRunway"),
                    v: one(health.waqfRunwayYears, t("admin.analytics.unitYears")),
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
              label={t("admin.analytics.activeStudents")}
              value={`${a.studentsActive}/${a.students}`}
              accent="teal"
              hint={t("admin.analytics.activeStudentsHint", { pct: pct(a.activeRate) })}
            />
            <StatCard
              label={t("admin.analytics.onTrack")}
              value={a.atRisk.on_track}
              accent="teal"
              hint={t("admin.analytics.onTrackHint", {
                watch: a.atRisk.watch,
                gap: a.atRisk.gap,
              })}
            />
            <StatCard
              label={t("admin.analytics.volunteerChurn")}
              value={pct(a.volunteers.churnRate)}
              accent="terracotta"
              hint={t("admin.analytics.volunteerChurnHint", {
                active: a.volunteers.active,
                departed: a.volunteers.departed,
                d90: a.volunteers.departures90d,
              })}
            />
            <StatCard
              label={t("admin.analytics.waqfRunway")}
              value={
                a.waqf.runwayYears == null
                  ? "—"
                  : `${a.waqf.runwayYears.toFixed(1)}${t("admin.analytics.unitYears")}`
              }
              accent="mustard"
              hint={t("admin.analytics.waqfRunwayHint", {
                ceiling: money(a.waqf.annualDrawCeiling),
                scholarships: money(a.waqf.scholarshipsAllocated),
              })}
            />
          </section>

          <section className="space-y-3">
            <SectionTitle>{t("admin.analytics.completionDropoff")}</SectionTitle>
            <div className="grid gap-4 lg:grid-cols-3">
              {a.courses.map((c) => (
                <Card key={c.courseId} as="section" className="space-y-3 p-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-base font-semibold text-ink">
                      {c.courseName}
                    </h3>
                    <span className="text-xs text-ink-4">
                      {t("admin.analytics.nodesCount", { n: c.totalNodes })}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>
                      <span className="font-semibold text-ink">{pct(c.completionRate)}</span>{" "}
                      <span className="text-ink-4">{t("admin.analytics.complete")}</span>
                    </span>
                    <span>
                      <span className="font-semibold text-ink">
                        {pct(c.unitAssessmentPassRate)}
                      </span>{" "}
                      <span className="text-ink-4">{t("admin.analytics.unitPass")}</span>
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-4">
                      {t("admin.analytics.byFurthestCheckpoint")}
                    </p>
                    <DropOff counts={c.dropOff} />
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>{t("admin.analytics.cohortsByPod")}</SectionTitle>
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-4">
                    <th className="px-4 py-2.5 font-semibold">{t("admin.analytics.colPod")}</th>
                    <th className="px-4 py-2.5 font-semibold">
                      {t("admin.analytics.colStudents")}
                    </th>
                    <th className="px-4 py-2.5 font-semibold">
                      {t("admin.analytics.colAvgProgress")}
                    </th>
                    <th className="px-4 py-2.5 font-semibold">
                      {t("admin.analytics.colCheckpointPass")}
                    </th>
                    <th className="px-4 py-2.5 font-semibold">
                      {t("admin.analytics.colAtRisk")}
                    </th>
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
                        {t("admin.analytics.noCohorts")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Card>
          </section>

          <RegulationNote>{t("admin.analytics.regulationNote")}</RegulationNote>
        </>
      ) : null}
    </div>
  );
}
