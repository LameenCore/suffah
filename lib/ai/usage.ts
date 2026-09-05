// Model-call accounting (T34, migration 0011). Every lib/ai generator logs one
// row per attempt - real model call or hand-authored fallback - so AI spend can
// be monitored per masjid and reconciled against the waqf ledger (T56).

import { getServiceClient } from "@/lib/db";

export type ModelFeature =
  | "lesson"
  | "checkpoint"
  | "assessment"
  | "term_exam"
  | "briefing"
  | "tutor"
  | "remediation";

/** Anthropic list price, USD per token. Sonnet 5: $2 / 1M in, $10 / 1M out. */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5": { input: 2 / 1_000_000, output: 10 / 1_000_000 },
};

export interface TokenUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
}

export function estimateCostUsd(model: string, usage: TokenUsage | null | undefined): number {
  const price = MODEL_PRICING[model];
  if (!price || !usage) return 0;
  const inTok = usage.input_tokens ?? 0;
  const outTok = usage.output_tokens ?? 0;
  return inTok * price.input + outTok * price.output;
}

export interface LogModelCallInput {
  feature: ModelFeature;
  masjidId: string | null;
  actorUserId?: string | null;
  model: string;
  /** 'model' when Anthropic answered, 'fallback' when we used static content. */
  source: "model" | "fallback";
  usage?: TokenUsage | null;
  ok?: boolean;
}

/** Write one model_call_log row. Best-effort: never throws. */
export async function logModelCall(input: LogModelCallInput): Promise<void> {
  try {
    const inTok = input.usage?.input_tokens ?? 0;
    const outTok = input.usage?.output_tokens ?? 0;
    const { error } = await getServiceClient()
      .from("model_call_log")
      .insert({
        masjid_id: input.masjidId,
        actor_user_id: input.actorUserId ?? null,
        feature: input.feature,
        model: input.model,
        source: input.source,
        input_tokens: inTok,
        output_tokens: outTok,
        cost_usd: input.source === "model" ? estimateCostUsd(input.model, input.usage) : 0,
        ok: input.ok ?? true,
      });
    if (error) console.error("[usage] model_call_log insert failed:", error.message);
  } catch (err) {
    console.error("[usage] model_call_log insert threw:", err);
  }
}
