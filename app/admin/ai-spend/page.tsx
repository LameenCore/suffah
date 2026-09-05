import { requireRole } from "@/lib/auth";
import { getBudgetStatus } from "@/lib/ai/budget";
import { getLedgerSummary } from "@/lib/db/ledger-queries";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { RegulationNote } from "@/components/RegulationNote";
import { BudgetForm } from "@/components/admin/BudgetForm";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const FEATURE_LABEL: Record<string, string> = {
  lesson: "Lessons",
  checkpoint: "Checkpoints",
  assessment: "Unit assessments",
  term_exam: "Term exams",
  briefing: "Handoff briefings",
};

const STATE_TONE = { ok: "success", warn: "warning", over: "danger" } as const;
const STATE_TEXT = {
  ok: "Within budget",
  warn: "Approaching the limit",
  over: "Over budget - model calls are falling back to cached content",
} as const;

export default async function AiSpendPage() {
  const user = await requireRole("admin");

  let status: Awaited<ReturnType<typeof getBudgetStatus>> | null = null;
  let operatingDraw: number | null = null;
  let loadError: string | null = null;
  try {
    status = await getBudgetStatus(user.masjidId);
    operatingDraw = (await getLedgerSummary(user.masjidId)).returnsDisbursed;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load AI spend";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="AI spend"
        title="What the model is costing"
        lede="Every lesson, checkpoint, assessment and briefing generation is metered. Content is generated once and served from the database after that, so spend is a one-time curriculum cost, not a per-student one."
        back={{ href: "/admin", label: "Overview" }}
      />

      {loadError || !status ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError ?? "unavailable"}. Run <code>npm run migrate</code>.
        </Card>
      ) : (
        <>
          <section>
            <SectionTitle hint="calendar month to date">This month</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Spent" value={usd(status.spentUsd)} accent="terracotta" />
              <StatCard
                label="Monthly limit"
                value={usd(status.monthlyLimitUsd)}
                accent="ink"
                hint={`${Math.round(status.ratio * 100)}% used`}
              />
              <StatCard
                label="Model calls"
                value={status.modelCalls}
                accent="teal"
                hint={`${status.fallbackCalls} served from cache`}
              />
              <StatCard
                label="Avg cost / call"
                value={
                  status.modelCalls > 0
                    ? usd(status.spentUsd / status.modelCalls)
                    : "-"
                }
                accent="mustard"
              />
            </div>

            <Card className="mt-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={STATE_TONE[status.state]} dot>
                  {STATE_TEXT[status.state]}
                </Badge>
                <span className="text-xs text-ink-4">
                  soft alert at {Math.round(status.softAlertRatio * 100)}% ·{" "}
                  {status.hardCapEnabled ? "hard cap on" : "hard cap off"}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${
                    status.state === "over"
                      ? "bg-danger"
                      : status.state === "warn"
                        ? "bg-mustard"
                        : "bg-teal"
                  }`}
                  style={{ width: `${Math.min(100, Math.round(status.ratio * 100))}%` }}
                />
              </div>
            </Card>
          </section>

          <section>
            <SectionTitle>By feature</SectionTitle>
            <Card className="p-5">
              {status.byFeature.length === 0 ? (
                <p className="text-sm text-ink-4">No model calls recorded this month.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {status.byFeature.map((f) => (
                    <li key={f.feature} className="flex items-center justify-between gap-3">
                      <span className="text-ink-2">
                        {FEATURE_LABEL[f.feature] ?? f.feature}
                      </span>
                      <span className="text-xs text-ink-4">
                        {f.calls} call{f.calls === 1 ? "" : "s"} · {usd(f.costUsd)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Budget</SectionTitle>
            <Card className="p-5">
              <BudgetForm
                monthlyLimitUsd={status.monthlyLimitUsd}
                softAlertPercent={Math.round(status.softAlertRatio * 100)}
                hardCapEnabled={status.hardCapEnabled}
              />
            </Card>
          </section>

          <section>
            <SectionTitle>Reconciliation with the waqf ledger</SectionTitle>
            <Card className="p-5 text-sm text-ink-2">
              <p>
                Operating draw from returns (all time):{" "}
                <strong>{operatingDraw != null ? usd(operatingDraw) : "-"}</strong>
              </p>
              <p className="mt-1">
                AI spend this month: <strong>{usd(status.spentUsd)}</strong>
              </p>
              <p className="mt-2 text-xs text-ink-4">
                AI is one line item inside the operating draw (alongside hosting and the
                part-time community coordinator). The draw should always exceed metered AI
                spend; if it does not, the endowment return assumption needs revisiting.
              </p>
              <div className="mt-3">
                <RegulationNote>
                  Ledger figures are seeded mock data for the demo - see the Waqf ledger page.
                </RegulationNote>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
