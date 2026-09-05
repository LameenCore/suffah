import { describe, it, expect } from "vitest";
import { estimateCostUsd, MODEL_PRICING } from "@/lib/ai/usage";
import { budgetState } from "@/lib/ai/budget";

describe("estimateCostUsd", () => {
  it("prices Sonnet 5 at $2/M in + $10/M out", () => {
    // 30k input + 24k output ~= the per-unit content cost cited in docs/pitch.md
    const cost = estimateCostUsd("claude-sonnet-5", {
      input_tokens: 30_000,
      output_tokens: 24_000,
    });
    // 30_000 * 2/1e6 + 24_000 * 10/1e6 = 0.06 + 0.24 = 0.30
    expect(cost).toBeCloseTo(0.3, 6);
  });

  it("is zero for an unknown model", () => {
    expect(estimateCostUsd("some-future-model", { input_tokens: 1000, output_tokens: 1000 })).toBe(0);
  });

  it("is zero for missing usage", () => {
    expect(estimateCostUsd("claude-sonnet-5", null)).toBe(0);
    expect(estimateCostUsd("claude-sonnet-5", undefined)).toBe(0);
  });

  it("treats missing token counts as zero", () => {
    expect(estimateCostUsd("claude-sonnet-5", { output_tokens: 1_000_000 })).toBeCloseTo(10, 6);
  });

  it("exposes pricing for the model the app uses", () => {
    expect(MODEL_PRICING["claude-sonnet-5"]).toEqual({ input: 2 / 1_000_000, output: 10 / 1_000_000 });
  });
});

describe("budgetState", () => {
  it("is ok below the soft-alert ratio", () => {
    expect(budgetState(0, 0.8)).toBe("ok");
    expect(budgetState(0.79, 0.8)).toBe("ok");
  });
  it("warns from the soft-alert ratio up to the limit", () => {
    expect(budgetState(0.8, 0.8)).toBe("warn");
    expect(budgetState(0.99, 0.8)).toBe("warn");
  });
  it("is over at or past the limit", () => {
    expect(budgetState(1, 0.8)).toBe("over");
    expect(budgetState(3.2, 0.8)).toBe("over");
  });
});
