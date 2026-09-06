import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { getBudgetStatus } from "@/lib/ai/budget";
import { getLedgerSummary } from "@/lib/db/ledger-queries";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { RegulationNote } from "@/components/RegulationNote";
import { BudgetForm } from "@/components/admin/BudgetForm";

const FEATURE_KEY: Record<string, MessageKey> = {
  lesson: "admin.aiSpend.featLesson",
  checkpoint: "admin.aiSpend.featCheckpoint",
  assessment: "admin.aiSpend.featAssessment",
  term_exam: "admin.aiSpend.featTermExam",
  briefing: "admin.aiSpend.featBriefing",
};

const STATE_TONE = { ok: "success", warn: "warning", over: "danger" } as const;
const STATE_KEY = {
  ok: "admin.aiSpend.stateOk",
  warn: "admin.aiSpend.stateWarn",
  over: "admin.aiSpend.stateOver",
} as const;

export default async function AiSpendPage() {
  const user = await requireRole("admin");
  const { t, intlLocale } = await getT(user);
  const usd = (n: number) =>
    n.toLocaleString(intlLocale, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

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
        kicker={t("admin.aiSpend.kicker")}
        title={t("admin.aiSpend.title")}
        lede={t("admin.aiSpend.lede")}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      {loadError || !status ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.aiSpend.unavailable", {
            detail: loadError ?? t("admin.aiSpend.unavailableFallback"),
            cmd: "npm run migrate",
          })}
        </Card>
      ) : (
        <>
          <section>
            <SectionTitle hint={t("admin.aiSpend.thisMonthHint")}>
              {t("admin.aiSpend.thisMonth")}
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t("admin.aiSpend.spent")}
                value={usd(status.spentUsd)}
                accent="terracotta"
              />
              <StatCard
                label={t("admin.aiSpend.monthlyLimit")}
                value={usd(status.monthlyLimitUsd)}
                accent="ink"
                hint={t("admin.aiSpend.pctUsed", { pct: Math.round(status.ratio * 100) })}
              />
              <StatCard
                label={t("admin.aiSpend.modelCalls")}
                value={status.modelCalls}
                accent="teal"
                hint={t("admin.aiSpend.servedFromCache", { n: status.fallbackCalls })}
              />
              <StatCard
                label={t("admin.aiSpend.avgCost")}
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
                  {t(STATE_KEY[status.state])}
                </Badge>
                <span className="text-xs text-ink-4">
                  {t("admin.aiSpend.softAlertAt", {
                    pct: Math.round(status.softAlertRatio * 100),
                  })}{" "}
                  ·{" "}
                  {status.hardCapEnabled
                    ? t("admin.aiSpend.hardCapOn")
                    : t("admin.aiSpend.hardCapOff")}
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
            <SectionTitle>{t("admin.aiSpend.byFeature")}</SectionTitle>
            <Card className="p-5">
              {status.byFeature.length === 0 ? (
                <p className="text-sm text-ink-4">{t("admin.aiSpend.noModelCalls")}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {status.byFeature.map((f) => (
                    <li key={f.feature} className="flex items-center justify-between gap-3">
                      <span className="text-ink-2">
                        {FEATURE_KEY[f.feature] ? t(FEATURE_KEY[f.feature]) : f.feature}
                      </span>
                      <span className="text-xs text-ink-4">
                        {t(
                          f.calls === 1 ? "admin.aiSpend.callsOne" : "admin.aiSpend.callsMany",
                          { n: f.calls, cost: usd(f.costUsd) },
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>{t("admin.aiSpend.budget")}</SectionTitle>
            <Card className="p-5">
              <BudgetForm
                monthlyLimitUsd={status.monthlyLimitUsd}
                softAlertPercent={Math.round(status.softAlertRatio * 100)}
                hardCapEnabled={status.hardCapEnabled}
              />
            </Card>
          </section>

          <section>
            <SectionTitle>{t("admin.aiSpend.reconciliation")}</SectionTitle>
            <Card className="p-5 text-sm text-ink-2">
              <p>
                {t("admin.aiSpend.operatingDraw")}
                <strong>{operatingDraw != null ? usd(operatingDraw) : "-"}</strong>
              </p>
              <p className="mt-1">
                {t("admin.aiSpend.aiSpendThisMonth")}
                <strong>{usd(status.spentUsd)}</strong>
              </p>
              <p className="mt-2 text-xs text-ink-4">{t("admin.aiSpend.reconNote")}</p>
              <div className="mt-3">
                <RegulationNote>{t("admin.aiSpend.ledgerMockNote")}</RegulationNote>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
