import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT, type MessageKey } from "@/lib/i18n";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NavIcon } from "@/components/ui/NavIcon";
import { getAdminMetrics, type AdminMetrics } from "@/lib/db/metrics-queries";
import { listStudents } from "@/lib/db/admin-queries";
import { getChildReports } from "@/lib/db/parent-queries";
import { assembleFromChildReport } from "@/lib/compliance/report";
import { type ComplianceLevel } from "@/lib/compliance/status";

const money = (v: number, intlLocale: string) =>
  Math.abs(v).toLocaleString(intlLocale, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
const pct = (f: number) => `${Math.round(f * 100)}%`;

const LEVEL_TONE: Record<ComplianceLevel, "success" | "warning" | "danger"> = {
  on_track: "success",
  watch: "warning",
  gap: "danger",
};

const LEVEL_KEY: Record<ComplianceLevel, MessageKey> = {
  on_track: "admin.levelOnTrack",
  watch: "admin.levelWatch",
  gap: "admin.levelGap",
};

async function complianceSpread(masjidId: string) {
  try {
    const students = await listStudents(masjidId);
    const reports = await getChildReports(
      students.map((s) => ({ id: s.id, name: s.name })),
      masjidId,
    );
    const counts: Record<ComplianceLevel, number> = { on_track: 0, watch: 0, gap: 0 };
    for (const r of reports) counts[assembleFromChildReport(r).overall.level] += 1;
    return { total: students.length, counts };
  } catch {
    return null;
  }
}

function Bar({ value, tone = "teal" }: { value: number; tone?: string }) {
  const colour =
    tone === "teal" ? "bg-teal" : tone === "terracotta" ? "bg-terracotta" : "bg-mustard";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full rounded-full ${colour}`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

const SECTIONS: { href: string; labelKey: MessageKey; icon: React.ReactNode }[] = [
  { href: "/admin/pods", labelKey: "nav.pods", icon: <NavIcon name="grid" /> },
  { href: "/admin/volunteers", labelKey: "nav.volunteers", icon: <NavIcon name="users" /> },
  { href: "/admin/continuity", labelKey: "nav.continuity", icon: <NavIcon name="spark" /> },
  { href: "/admin/handoff-demo", labelKey: "nav.handoff", icon: <NavIcon name="swap" /> },
  { href: "/admin/compliance", labelKey: "nav.compliance", icon: <NavIcon name="clipboard" /> },
  { href: "/admin/ledger", labelKey: "nav.ledger", icon: <NavIcon name="coins" /> },
  { href: "/admin/ai-spend", labelKey: "nav.aiSpend", icon: <NavIcon name="gauge" /> },
  { href: "/admin/seerah", labelKey: "nav.seerah", icon: <NavIcon name="book" /> },
  { href: "/admin/audit", labelKey: "nav.audit", icon: <NavIcon name="shield" /> },
  { href: "/admin/inbox", labelKey: "nav.helpRequests", icon: <NavIcon name="inbox" /> },
];

export default async function AdminHome() {
  const user = await requireRole("admin");
  const { t, intlLocale } = await getT(user);

  let m: AdminMetrics | null = null;
  let loadError: string | null = null;
  try {
    m = await getAdminMetrics(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load metrics";
  }
  const spread = m ? await complianceSpread(user.masjidId) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={t("admin.overviewKicker")}
        title={t("admin.overviewTitle")}
        lede={t("admin.overviewLede")}
      />

      {loadError || !m ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.metricsUnavailable", { detail: loadError ? `: ${loadError}` : "" })}{" "}
          <code>npm run migrate</code> · <code>npm run seed</code>
        </Card>
      ) : (
        <>
          <section>
            <SectionTitle>{t("admin.atAGlance")}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t("admin.statPods")}
                value={m.pods}
                accent="terracotta"
                hint={t("admin.statPodsHint", { n: m.students })}
              />
              <StatCard
                label={t("admin.statVolunteers")}
                value={m.activeVolunteers}
                accent="teal"
                hint={t("admin.statVolunteersHint", { n: m.departedVolunteers })}
              />
              <StatCard
                label={t("admin.statHelpRequests")}
                value={m.openHelpRequests}
                accent="mustard"
                hint={<Link href="/admin/inbox" className="underline">{t("admin.goToInbox")}</Link>}
              />
              <StatCard
                label={t("admin.statWaqfPrincipal")}
                value={money(m.waqf.principal, intlLocale)}
                accent="ink"
                hint={t("admin.statWaqfPrincipalHint")}
              />
            </div>
          </section>

          <section>
            <SectionTitle hint={t("admin.acrossAllStudents")}>{t("admin.learning")}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t("admin.statLessonsFinished")} value={m.lessonsCompleted} accent="teal" />
              <StatCard
                label={t("admin.statCheckpointPassRate")}
                value={m.checkpointAttempts ? pct(m.checkpointPassRate) : "-"}
                accent="terracotta"
                hint={t("admin.statCheckpointHint", {
                  attempts: m.checkpointAttempts,
                  active: m.studentsActive,
                })}
              />
              <StatCard
                label={t("admin.statUnitAvg")}
                value={m.unitAvgScore != null ? pct(m.unitAvgScore) : "-"}
                accent="mustard"
                hint={
                  m.unitAttempts
                    ? t("admin.statUnitHint", {
                        attempts: m.unitAttempts,
                        rate: pct(m.unitPassRate),
                      })
                    : t("admin.statNone")
                }
              />
              <StatCard
                label={t("admin.statTermExamAvg")}
                value={m.termExamAvgScore != null ? pct(m.termExamAvgScore) : "-"}
                accent="ink"
                hint={
                  m.termExamAttempts
                    ? t("admin.statTermExamHint", { n: m.termExamAttempts })
                    : t("admin.statNone")
                }
              />
            </div>

            <Card className="mt-3 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-4">
                {t("admin.byCourse")}
              </p>
              <ul className="space-y-3">
                {m.courses.map((c) => (
                  <li key={c.courseId} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium text-ink">{c.courseName}</span>
                    <span className="text-xs text-ink-4">
                      {t("admin.courseLessonsPrepared", {
                        prepared: c.nodesWithLesson,
                        total: c.totalNodes,
                        attempts: c.checkpointAttempts,
                      })}
                    </span>
                    <div className="col-span-2">
                      <Bar
                        value={c.checkpointAttempts ? c.checkpointPassRate : 0}
                        tone="teal"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {spread && spread.total > 0 ? (
            <section>
              <SectionTitle>{t("admin.complianceSpread")}</SectionTitle>
              <Card className="flex flex-wrap items-center gap-3 p-4">
                {(["on_track", "watch", "gap"] as ComplianceLevel[]).map((lvl) => (
                  <div key={lvl} className="flex items-center gap-2">
                    <Badge tone={LEVEL_TONE[lvl]} dot>
                      {t(LEVEL_KEY[lvl])}
                    </Badge>
                    <span className="text-sm font-medium text-ink">{spread.counts[lvl]}</span>
                  </div>
                ))}
                <Link
                  href="/admin/compliance"
                  className="ml-auto text-sm font-medium text-terracotta hover:text-terracotta-strong"
                >
                  {t("admin.perStudentRecords")} &rarr;
                </Link>
              </Card>
            </section>
          ) : null}

          <section>
            <SectionTitle>{t("admin.waqfCommunity")}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t("admin.statReturnsSpent")} value={money(m.waqf.returnsDisbursed, intlLocale)} accent="teal" hint={t("admin.statReturnsSpentHint")} />
              <StatCard label={t("admin.statSadaqah")} value={money(m.waqf.sadaqah, intlLocale)} accent="teal" hint={t("admin.statSadaqahHint")} />
              <StatCard label={t("admin.statScholarships")} value={money(m.waqf.scholarships, intlLocale)} accent="terracotta" />
              <StatCard label={t("admin.statBarakahNotes")} value={m.barakahNotes} accent="mustard" hint={t("admin.statBarakahHint", { n: m.seerahPending })} />
            </div>
          </section>
        </>
      )}

      <section>
        <SectionTitle>{t("admin.manage")}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-teal"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-soft text-teal-strong">
                {s.icon}
              </span>
              <span className="text-sm font-medium text-ink">{t(s.labelKey)}</span>
              <span className="ml-auto text-ink-4 group-hover:text-teal">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>

      <RegulationNote>{t("admin.overviewRegulationNote")}</RegulationNote>
    </div>
  );
}
