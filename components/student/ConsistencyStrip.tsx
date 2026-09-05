import type { Consistency } from "@/lib/db/consistency-queries";
import { Card } from "@/components/ui/Card";

// T52: a calm "you've shown up" nudge. No streak counter, no comparison, no
// prize. Copy leans on itqan (doing things well, consistently).

export function ConsistencyStrip({
  consistency,
  audience,
}: {
  consistency: Consistency;
  /** changes the pronoun only */
  audience: "student" | "parent";
}) {
  const { daysThisWeek, daysThisMonth, recent } = consistency;
  const you = audience === "student" ? "You've" : "They've";
  const nothingYet = daysThisMonth === 0;

  return (
    <Card as="section" tone="teal" className="p-5">
      <h3 className="font-display text-lg font-semibold text-ink">Consistency</h3>
      <p className="mt-1 text-sm text-ink-2">
        {nothingYet
          ? "A little each day beats a lot once in a while. The first day counts."
          : `${you} shown up ${daysThisWeek} ${daysThisWeek === 1 ? "day" : "days"} in the last week` +
            (daysThisMonth > daysThisWeek ? `, ${daysThisMonth} this month.` : ".")}
      </p>

      <div className="mt-3 flex flex-wrap gap-1" aria-hidden>
        {recent.map((d) => (
          <span
            key={d.date}
            title={d.date}
            className={`h-3 w-3 rounded-[3px] ${
              d.active ? "bg-teal" : "bg-teal-soft/60"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-4">
        Last 28 days. This is only for {audience === "student" ? "you" : "your family"} - it
        is never compared with anyone else.
      </p>
    </Card>
  );
}
