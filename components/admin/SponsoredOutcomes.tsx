import type { SponsoredOutcome } from "@/lib/db/sponsorship-queries";

const money = (v: number) =>
  v.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

function Card({ o }: { o: SponsoredOutcome }) {
  const completionPct = Math.round(o.unitCompletion * 100);
  return (
    <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{o.sponsorLabel}</span>
        <span className="tabular-nums text-sm text-zinc-500 dark:text-zinc-400">
          {money(o.amount)}
        </span>
      </div>
      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        → {o.podName} · {o.unitTitle} <span className="text-zinc-400">({o.courseName})</span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Unit progress</span>
          <span className="tabular-nums">{completionPct}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
        {o.assessmentsTaken === 0
          ? "Unit assessment not taken yet."
          : `${o.assessmentsPassed} of ${o.studentsInPod} students passed the unit assessment.`}
      </p>

      {o.note && <p className="mt-1 text-xs text-zinc-400">{o.note}</p>}
    </div>
  );
}

export function SponsoredOutcomes({ outcomes }: { outcomes: SponsoredOutcome[] }) {
  if (outcomes.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No sponsorship links recorded.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {outcomes.map((o) => (
          <Card key={o.id} o={o} />
        ))}
      </div>
      <p className="text-xs text-zinc-400">
        Sponsorship links are illustrative. Outcomes are pod-level and anonymized —
        drawn from real pathway progress and unit-assessment results.
      </p>
    </div>
  );
}
