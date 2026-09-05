import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Star8, BookMark, Crescent, Dome, Lantern } from "@/components/ui/Motif";
import { getServiceClient } from "@/lib/db";

const SECTIONS: {
  href: string;
  title: string;
  points: string[];
  icon: React.ReactNode;
}[] = [
  {
    href: "/admin/pods",
    title: "Pods & assignment",
    points: ["Assign a volunteer and up to 4 students", "Hard capacity cap", "Continuity matrix"],
    icon: <Dome className="h-5 w-5" />,
  },
  {
    href: "/admin/volunteers",
    title: "Volunteers",
    points: ["Onboarding & vetting status", "Churn log", "Detach on departure keeps the pod's place"],
    icon: <Crescent className="h-5 w-5" />,
  },
  {
    href: "/admin/continuity",
    title: "Continuity Fingerprint",
    points: ["AI handoff briefing per pod", "How the pod learns, not just where it is", "Session notes feed it"],
    icon: <Star8 className="h-5 w-5" />,
  },
  {
    href: "/admin/handoff-demo",
    title: "Live handoff simulation",
    points: ["Take a volunteer offline mid-session", "The pod keeps learning", "Briefing generates on screen"],
    icon: <Lantern className="h-5 w-5" />,
  },
  {
    href: "/admin/compliance",
    title: "Compliance report",
    points: ["Live on-track / watch / gap per course", "Checkpoint + unit + exam data", "Save a snapshot, print per student"],
    icon: <BookMark className="h-5 w-5" />,
  },
  {
    href: "/admin/ledger",
    title: "Waqf & donation ledger",
    points: ["Principal locked and untouched", "Only returns fund operations", "Sadaqah into the scholarship pool"],
    icon: <Dome className="h-5 w-5" />,
  },
  {
    href: "/admin/seerah",
    title: "Seerah studio",
    points: ["Scholars annotate the AI lesson draft", "Notes fold into the next version", "No external vendor needed"],
    icon: <BookMark className="h-5 w-5" />,
  },
];

async function overview(masjidId: string) {
  const db = getServiceClient();
  try {
    const [pods, vols, students, ledger] = await Promise.all([
      db.from("pods").select("id", { count: "exact", head: true }).eq("masjid_id", masjidId),
      db
        .from("volunteers")
        .select("id", { count: "exact", head: true })
        .eq("masjid_id", masjidId)
        .is("left_at", null),
      db
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("masjid_id", masjidId)
        .eq("role", "student"),
      db.from("waqf_ledger").select("amount, entry_type").eq("masjid_id", masjidId),
    ]);
    const principal = (ledger.data ?? [])
      .filter((r) => r.entry_type === "principal_deposit")
      .reduce((s, r) => s + Number(r.amount), 0);
    return {
      pods: pods.count ?? 0,
      volunteers: vols.count ?? 0,
      students: students.count ?? 0,
      principal,
    };
  } catch {
    return null;
  }
}

export default async function AdminHome() {
  const user = await requireRole("admin");
  const o = await overview(user.masjidId);

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Masjid As-Suffa"
        title="Overview"
        lede="Pods and volunteers, the continuity handoff, compliance records, and the waqf ledger - everything the masjid runs from one place."
      />

      {o ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pods" value={o.pods} accent="terracotta" hint="one volunteer, up to 4 students each" />
          <StatCard label="Active volunteers" value={o.volunteers} accent="teal" />
          <StatCard label="Students" value={o.students} accent="mustard" />
          <StatCard
            label="Waqf principal"
            value={`$${(o.principal / 1000).toFixed(0)}k`}
            accent="ink"
            hint="locked - only returns are spent"
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-teal hover:shadow-[var(--shadow-pop)]"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-soft text-teal-strong">
                {s.icon}
              </span>
              <h2 className="font-display text-base font-semibold text-ink">{s.title}</h2>
            </div>
            <ul className="mt-3 flex-1 space-y-1 text-sm text-ink-3">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span aria-hidden className="text-terracotta">
                    &bull;
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <span className="mt-3 text-sm font-medium text-teal group-hover:text-teal-strong">
              Open &rarr;
            </span>
          </Link>
        ))}
      </div>

      <RegulationNote>
        Pod size caps and report formats across these screens follow Quebec&apos;s
        home-instruction exemption as currently understood - confirm against active
        regulation before relying on them.
      </RegulationNote>
    </div>
  );
}
