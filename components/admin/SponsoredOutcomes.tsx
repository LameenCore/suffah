import type { SponsoredOutcome } from "@/lib/db/sponsorship-queries";

const money = (v: number) =>
  v.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

function Card({ o }: { o: SponsoredOutcome }) {
  const completionPct = Math.round(o.unitCompletion * 100);
  return (
    <div className="rounded-lg border border-border p-3 ">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{o.sponsorLabel}</span>
        <span className="tabular-nums text-sm text-ink-3 ">
          {money(o.amount)}
        </span>
      </div>
      <div className="mt-0.5 text-xs text-ink-3 ">
        → {o.podName} · {o.unitTitle} <span className="text-ink-4">({o.courseName})</span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-ink-3 ">
          <span>Unit progress</span>
          <span className="tabular-nums">{completionPct}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2 ">
          <div
            className="h-full rounded-full bg-success "
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-2 ">
        {o.assessmentsTaken === 0
          ? "Unit assessment not taken yet."
          : `${o.assessmentsPassed} of ${o.studentsInPod} students passed the unit assessment.`}
      </p>

      {o.note && <p className="mt-1 text-xs text-ink-4">{o.note}</p>}
    </div>
  );
}

export function SponsoredOutcomes({ outcomes }: { outcomes: SponsoredOutcome[] }) {
  if (outcomes.length === 0) {
    return (
      <p className="text-sm text-ink-3 ">
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
      <p className="text-xs text-ink-4">
        Sponsorship links are illustrative. Outcomes are pod-level and anonymized,
        drawn from real pathway progress and unit-assessment results.
      </p>
    </div>
  );
}
