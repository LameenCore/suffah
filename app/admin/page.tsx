import Link from "next/link";
import { requireRole } from "@/lib/auth";
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
import { LEVEL_LABEL, type ComplianceLevel } from "@/lib/compliance/status";

const money = (v: number) =>
  Math.abs(v).toLocaleString("en-CA", {
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

const SECTIONS: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/admin/pods", label: "Pods & assignment", icon: <NavIcon name="grid" /> },
  { href: "/admin/volunteers", label: "Volunteers", icon: <NavIcon name="users" /> },
  { href: "/admin/continuity", label: "Continuity Fingerprint", icon: <NavIcon name="spark" /> },
  { href: "/admin/handoff-demo", label: "Handoff simulation", icon: <NavIcon name="swap" /> },
  { href: "/admin/compliance", label: "Compliance report", icon: <NavIcon name="clipboard" /> },
  { href: "/admin/ledger", label: "Waqf ledger", icon: <NavIcon name="coins" /> },
  { href: "/admin/ai-spend", label: "AI spend", icon: <NavIcon name="gauge" /> },
  { href: "/admin/seerah", label: "Seerah studio", icon: <NavIcon name="book" /> },
  { href: "/admin/audit", label: "Audit trail", icon: <NavIcon name="shield" /> },
  { href: "/admin/inbox", label: "Help requests", icon: <NavIcon name="inbox" /> },
];

export default async function AdminHome() {
  const user = await requireRole("admin");

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
        kicker="Masjid As-Suffa"
        title="Overview"
        lede="Everything the masjid runs, and how the community is doing this term."
      />

      {loadError || !m ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          Metrics are unavailable{loadError ? `: ${loadError}` : ""}. Run{" "}
          <code>npm run migrate</code> and <code>npm run seed</code>.
        </Card>
      ) : (
        <>
          <section>
            <SectionTitle>At a glance</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Pods" value={m.pods} accent="terracotta" hint={`${m.students} students`} />
              <StatCard
                label="Volunteers"
                value={m.activeVolunteers}
                accent="teal"
                hint={`${m.departedVolunteers} departed (churn log)`}
              />
              <StatCard
                label="Open help requests"
                value={m.openHelpRequests}
                accent="mustard"
                hint={<Link href="/admin/inbox" className="underline">go to inbox</Link>}
              />
              <StatCard
                label="Waqf principal"
                value={money(m.waqf.principal)}
                accent="ink"
                hint="locked - only returns spent"
              />
            </div>
          </section>

          <section>
            <SectionTitle hint="across all students">Learning</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Lessons finished" value={m.lessonsCompleted} accent="teal" />
              <StatCard
                label="Checkpoint pass rate"
                value={m.checkpointAttempts ? pct(m.checkpointPassRate) : "-"}
                accent="terracotta"
                hint={`${m.checkpointAttempts} attempts, ${m.studentsActive} students active`}
              />
              <StatCard
                label="Unit assessment avg"
                value={m.unitAvgScore != null ? pct(m.unitAvgScore) : "-"}
                accent="mustard"
                hint={m.unitAttempts ? `${m.unitAttempts} attempts, ${pct(m.unitPassRate)} passed` : "none yet"}
              />
              <StatCard
                label="Term exam avg"
                value={m.termExamAvgScore != null ? pct(m.termExamAvgScore) : "-"}
                accent="ink"
                hint={m.termExamAttempts ? `${m.termExamAttempts} taken` : "none yet"}
              />
            </div>

            <Card className="mt-3 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-4">
                By course
              </p>
              <ul className="space-y-3">
                {m.courses.map((c) => (
                  <li key={c.courseId} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium text-ink">{c.courseName}</span>
                    <span className="text-xs text-ink-4">
                      {c.nodesWithLesson}/{c.totalNodes} lessons prepared ·{" "}
                      {c.checkpointAttempts} checkpoint attempts
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
              <SectionTitle>Compliance spread</SectionTitle>
              <Card className="flex flex-wrap items-center gap-3 p-4">
                {(["on_track", "watch", "gap"] as ComplianceLevel[]).map((lvl) => (
                  <div key={lvl} className="flex items-center gap-2">
                    <Badge tone={LEVEL_TONE[lvl]} dot>
                      {LEVEL_LABEL[lvl]}
                    </Badge>
                    <span className="text-sm font-medium text-ink">{spread.counts[lvl]}</span>
                  </div>
                ))}
                <Link
                  href="/admin/compliance"
                  className="ml-auto text-sm font-medium text-terracotta hover:text-terracotta-strong"
                >
                  Per-student records &rarr;
                </Link>
              </Card>
            </section>
          ) : null}

          <section>
            <SectionTitle>Waqf & community</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Returns spent" value={money(m.waqf.returnsDisbursed)} accent="teal" hint="operations, from returns only" />
              <StatCard label="Sadaqah received" value={money(m.waqf.sadaqah)} accent="teal" hint="into the scholarship pool" />
              <StatCard label="Scholarships funded" value={money(m.waqf.scholarships)} accent="terracotta" />
              <StatCard label="Barakah notes" value={m.barakahNotes} accent="mustard" hint={`${m.seerahPending} Seerah notes pending`} />
            </div>
          </section>
        </>
      )}

      <section>
        <SectionTitle>Manage</SectionTitle>
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
              <span className="text-sm font-medium text-ink">{s.label}</span>
              <span className="ml-auto text-ink-4 group-hover:text-teal">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>

      <RegulationNote>
        Pod size caps and report formats across these screens follow Quebec&apos;s
        home-instruction exemption as currently understood - confirm against active
        regulation before relying on them.
      </RegulationNote>
    </div>
  );
}
