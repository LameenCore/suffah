import Link from "next/link";
import { RegulationNote } from "@/components/RegulationNote";
import { StubSection } from "@/components/StubSection";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Masjid Admin</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Administer pods, volunteers, compliance reporting, and the waqf ledger.
        </p>
      </div>

      <RegulationNote>
        Pod size caps and report formats below follow Quebec&apos;s home-instruction
        exemption as currently understood — confirm against active regulation before
        relying on them.
      </RegulationNote>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/volunteers"
          className="group rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-emerald-400 dark:border-white/15 dark:bg-zinc-950 dark:hover:border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Volunteers</h2>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Open
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <li className="flex gap-2"><span aria-hidden>·</span>Onboarding form</li>
            <li className="flex gap-2"><span aria-hidden>·</span>Certification / vetting status</li>
            <li className="flex gap-2"><span aria-hidden>·</span>Churn log + continuity note</li>
          </ul>
          <span className="mt-3 inline-block text-sm text-emerald-700 group-hover:underline dark:text-emerald-400">
            Manage volunteers →
          </span>
        </Link>
        <Link
          href="/admin/pods"
          className="group rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-emerald-400 dark:border-white/15 dark:bg-zinc-950 dark:hover:border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Pods</h2>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Open
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <li className="flex gap-2"><span aria-hidden>·</span>Assign volunteer + students (max 4)</li>
            <li className="flex gap-2"><span aria-hidden>·</span>Hard capacity cap enforced</li>
            <li className="flex gap-2"><span aria-hidden>·</span>Continuity handoff view</li>
          </ul>
          <span className="mt-3 inline-block text-sm text-emerald-700 group-hover:underline dark:text-emerald-400">
            Manage pods →
          </span>
        </Link>
        <StubSection
          title="Compliance reports"
          phase="Phase 4"
          items={["Aggregate checkpoint + unit + exam data", "Export per student / pod"]}
        />
        <Link
          href="/admin/ledger"
          className="group rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-emerald-400 dark:border-white/15 dark:bg-zinc-950 dark:hover:border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Waqf &amp; donation ledger</h2>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Open
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <li className="flex gap-2"><span aria-hidden>·</span>Principal balance (locked)</li>
            <li className="flex gap-2"><span aria-hidden>·</span>Return disbursed over time</li>
            <li className="flex gap-2"><span aria-hidden>·</span>Sadaqah / scholarships + fee status</li>
          </ul>
          <span className="mt-3 inline-block text-sm text-emerald-700 group-hover:underline dark:text-emerald-400">
            View ledger →
          </span>
        </Link>
      </div>
    </div>
  );
}
