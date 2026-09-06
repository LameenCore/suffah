import type { Consistency } from "@/lib/db/consistency-queries";
import type { Translator } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

// T52: a calm "you've shown up" nudge. No streak counter, no comparison, no
// prize. Copy leans on itqan (doing things well, consistently).

export function ConsistencyStrip({
  consistency,
  audience,
  t,
}: {
  consistency: Consistency;
  /** changes the pronoun only */
  audience: "student" | "parent";
  t: Translator;
}) {
  const { daysThisWeek, daysThisMonth, recent } = consistency;
  const nothingYet = daysThisMonth === 0;
  const dayWord = (n: number) => `${n} ${n === 1 ? t("student.day") : t("student.days")}`;

  let line: string;
  if (nothingYet) {
    line = t("student.consistencyEmpty");
  } else {
    const base = t(
      audience === "student" ? "student.consistencyYou" : "student.consistencyThey",
      { days: dayWord(daysThisWeek) },
    );
    line =
      daysThisMonth > daysThisWeek
        ? base + t("student.consistencyMonth", { days: dayWord(daysThisMonth) })
        : base + ".";
  }

  return (
    <Card as="section" tone="teal" className="p-5">
      <h3 className="font-display text-lg font-semibold text-ink">{t("student.consistencyTitle")}</h3>
      <p className="mt-1 text-sm text-ink-2">{line}</p>

      <div className="mt-3 flex flex-wrap gap-1" aria-hidden>
        {recent.map((d) => (
          <span
            key={d.date}
            title={d.date}
            className={`h-3 w-3 rounded-[3px] ${d.active ? "bg-teal" : "bg-teal-soft/60"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-4">
        {t("student.consistencyWindow")}{" "}
        {audience === "student"
          ? t("student.consistencyPrivateYou")
          : t("student.consistencyPrivateFamily")}
      </p>
    </Card>
  );
}
