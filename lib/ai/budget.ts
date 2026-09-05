// Per-masjid AI budget: month-to-date spend, soft alert, hard cap (T56).
//
// Spend comes from model_call_log (T34). The hard cap is checked by every
// generator before it calls the model - over budget, they fall back to
// hand-authored content instead of spending more.

import { getServiceClient } from "@/lib/db";
import type { ModelFeature } from "@/lib/ai/usage";

export interface AiBudget {
  monthlyLimitUsd: number;
  softAlertRatio: number;
  hardCapEnabled: boolean;
}

export const DEFAULT_BUDGET: AiBudget = {
  monthlyLimitUsd: 25,
  softAlertRatio: 0.8,
  hardCapEnabled: true,
};

export type BudgetState = "ok" | "warn" | "over";

export interface BudgetStatus extends AiBudget {
  /** First day of the current calendar month, ISO. */
  periodStart: string;
  spentUsd: number;
  /** spentUsd / monthlyLimitUsd, capped display is the caller's job. */
  ratio: number;
  state: BudgetState;
  modelCalls: number;
  fallbackCalls: number;
  byFeature: Array<{ feature: string; calls: number; costUsd: number }>;
}

function monthStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Pure: bucket a spend ratio into a budget state. */
export function budgetState(ratio: number, softAlertRatio: number): BudgetState {
  if (ratio >= 1) return "over";
  if (ratio >= softAlertRatio) return "warn";
  return "ok";
}

export async function getAiBudget(masjidId: string): Promise<AiBudget> {
  const { data, error } = await getServiceClient()
    .from("masjid_ai_budget")
    .select("monthly_limit_usd, soft_alert_ratio, hard_cap_enabled")
    .eq("masjid_id", masjidId)
    .maybeSingle();
  if (error) throw new Error(`getAiBudget: ${error.message}`);
  if (!data) return DEFAULT_BUDGET;
  return {
    monthlyLimitUsd: Number(data.monthly_limit_usd),
    softAlertRatio: Number(data.soft_alert_ratio),
    hardCapEnabled: Boolean(data.hard_cap_enabled),
  };
}

export async function setAiBudget(
  masjidId: string,
  patch: Partial<AiBudget>,
): Promise<void> {
  const current = await getAiBudget(masjidId);
  const next = { ...current, ...patch };
  const { error } = await getServiceClient()
    .from("masjid_ai_budget")
    .upsert({
      masjid_id: masjidId,
      monthly_limit_usd: next.monthlyLimitUsd,
      soft_alert_ratio: next.softAlertRatio,
      hard_cap_enabled: next.hardCapEnabled,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(`setAiBudget: ${error.message}`);
}

/** Month-to-date spend + call counts for a masjid, from model_call_log. */
export async function getMonthSpend(masjidId: string): Promise<{
  spentUsd: number;
  modelCalls: number;
  fallbackCalls: number;
  byFeature: Array<{ feature: string; calls: number; costUsd: number }>;
}> {
  const start = monthStart().toISOString();
  const { data, error } = await getServiceClient()
    .from("model_call_log")
    .select("feature, source, cost_usd")
    .eq("masjid_id", masjidId)
    .gte("at", start);
  if (error) throw new Error(`getMonthSpend: ${error.message}`);

  const rows = (data ?? []) as { feature: string; source: string; cost_usd: number }[];
  let spentUsd = 0;
  let modelCalls = 0;
  let fallbackCalls = 0;
  const byFeatureMap = new Map<string, { calls: number; costUsd: number }>();
  for (const r of rows) {
    const cost = Number(r.cost_usd) || 0;
    spentUsd += cost;
    if (r.source === "fallback") fallbackCalls += 1;
    else modelCalls += 1;
    const f = byFeatureMap.get(r.feature) ?? { calls: 0, costUsd: 0 };
    f.calls += 1;
    f.costUsd += cost;
    byFeatureMap.set(r.feature, f);
  }
  const byFeature = [...byFeatureMap.entries()]
    .map(([feature, v]) => ({ feature, ...v }))
    .sort((a, b) => b.costUsd - a.costUsd);
  return { spentUsd, modelCalls, fallbackCalls, byFeature };
}

export async function getBudgetStatus(masjidId: string): Promise<BudgetStatus> {
  const [budget, spend] = await Promise.all([getAiBudget(masjidId), getMonthSpend(masjidId)]);
  const ratio = budget.monthlyLimitUsd > 0 ? spend.spentUsd / budget.monthlyLimitUsd : 0;
  const state = budgetState(ratio, budget.softAlertRatio);
  return {
    ...budget,
    periodStart: monthStart().toISOString(),
    spentUsd: spend.spentUsd,
    ratio,
    state,
    modelCalls: spend.modelCalls,
    fallbackCalls: spend.fallbackCalls,
    byFeature: spend.byFeature,
  };
}

export class AiBudgetExceededError extends Error {
  constructor(
    public readonly feature: ModelFeature,
    public readonly masjidId: string,
  ) {
    super(`AI budget for this month is spent - ${feature} is using cached content`);
    this.name = "AiBudgetExceededError";
  }
}

/**
 * Throw {@link AiBudgetExceededError} when the masjid is over its hard cap.
 * Generators call this before the model; their catch routes to the fallback.
 * Best-effort: a lookup failure never blocks generation.
 */
export async function assertWithinAiBudget(
  feature: ModelFeature,
  masjidId: string,
): Promise<void> {
  try {
    const status = await getBudgetStatus(masjidId);
    if (status.hardCapEnabled && status.state === "over") {
      throw new AiBudgetExceededError(feature, masjidId);
    }
  } catch (err) {
    if (err instanceof AiBudgetExceededError) throw err;
    console.error("[budget] check failed, allowing the call:", err);
  }
}
