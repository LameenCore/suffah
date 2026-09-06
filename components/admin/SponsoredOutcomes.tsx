import type { SponsoredOutcome } from "@/lib/db/sponsorship-queries";
import type { Translator } from "@/lib/i18n";

const money = (v: number, intlLocale: string) =>
  v.toLocaleString(intlLocale, { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

function OutcomeCard({
  o,
  t,
  intlLocale,
}: {
  o: SponsoredOutcome;
  t: Translator;
  intlLocale: string;
}) {
  const completionPct = Math.round(o.unitCompletion * 100);
  return (
    <div className="rounded-lg border border-border p-3 ">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{o.sponsorLabel}</span>
        <span className="tabular-nums text-sm text-ink-3 ">
          {money(o.amount, intlLocale)}
        </span>
      </div>
      <div className="mt-0.5 text-xs text-ink-3 ">
        → {o.podName} · {o.unitTitle} <span className="text-ink-4">({o.courseName})</span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-ink-3 ">
          <span>{t("admin.ledger.unitProgress")}</span>
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
          ? t("admin.ledger.assessmentNotTaken")
          : t("admin.ledger.assessmentPassed", {
              passed: o.assessmentsPassed,
              total: o.studentsInPod,
            })}
      </p>

      {o.note && <p className="mt-1 text-xs text-ink-4">{o.note}</p>}
    </div>
  );
}

export function SponsoredOutcomes({
  outcomes,
  t,
  intlLocale,
}: {
  outcomes: SponsoredOutcome[];
  t: Translator;
  intlLocale: string;
}) {
  if (outcomes.length === 0) {
    return <p className="text-sm text-ink-3 ">{t("admin.ledger.noSponsorship")}</p>;
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {outcomes.map((o) => (
          <OutcomeCard key={o.id} o={o} t={t} intlLocale={intlLocale} />
        ))}
      </div>
      <p className="text-xs text-ink-4">{t("admin.ledger.sponsorshipNote")}</p>
    </div>
  );
}
