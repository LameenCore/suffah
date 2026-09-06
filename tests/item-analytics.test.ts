import { describe, it, expect } from "vitest";
import { computeItemStats, isProblemFlag } from "@/lib/analytics/item-analytics";

// 12 attempts: q1 always right (easy), q2 tracks score (good discrimination),
// q3 inverted (strong students miss it -> negative discrimination), q4 always wrong.
const attempts = Array.from({ length: 12 }, (_, i) => {
  const strong = i < 6;
  return {
    score: strong ? 0.9 - i * 0.02 : 0.3 - (i - 6) * 0.02,
    perQuestion: [
      { id: "q1", correct: true },
      { id: "q2", correct: strong },
      { id: "q3", correct: !strong },
      { id: "q4", correct: false },
    ],
  };
});

describe("computeItemStats", () => {
  const stats = new Map(computeItemStats(attempts).map((s) => [s.questionId, s]));

  it("p-value is the fraction correct", () => {
    expect(stats.get("q1")!.pValue).toBe(1);
    expect(stats.get("q2")!.pValue).toBe(0.5);
    expect(stats.get("q4")!.pValue).toBe(0);
  });

  it("a score-tracking item discriminates positively", () => {
    expect(stats.get("q2")!.discrimination).toBeGreaterThan(0.5);
    expect(stats.get("q2")!.flag).toBe("ok");
  });

  it("an inverted item gets negative discrimination + flag", () => {
    expect(stats.get("q3")!.discrimination).toBeLessThan(0);
    expect(stats.get("q3")!.flag).toBe("negative_discrimination");
    expect(isProblemFlag(stats.get("q3")!.flag)).toBe(true);
  });

  it("an always-wrong item flags as too hard", () => {
    expect(stats.get("q4")!.flag).toBe("too_hard");
  });

  it("an always-right item flags as too easy", () => {
    expect(stats.get("q1")!.flag).toBe("too_easy");
  });

  it("marks insufficient data below the attempt threshold", () => {
    const few = computeItemStats(attempts.slice(0, 3));
    expect(few.every((s) => s.flag === "insufficient_data")).toBe(true);
    expect(few.every((s) => s.discrimination === null)).toBe(true);
  });
});
