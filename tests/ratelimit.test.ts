import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimits,
  enforceAiRateLimit,
  assertAiRateLimit,
  RateLimitError,
} from "@/lib/ratelimit";

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit, then blocks", () => {
    const rule = { limit: 3, windowMs: 1000 };
    expect(checkRateLimit("k", rule).ok).toBe(true);
    expect(checkRateLimit("k", rule).ok).toBe(true);
    const third = checkRateLimit("k", rule);
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);
    expect(checkRateLimit("k", rule).ok).toBe(false);
  });

  it("keys are independent", () => {
    const rule = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit("a", rule).ok).toBe(true);
    expect(checkRateLimit("b", rule).ok).toBe(true);
    expect(checkRateLimit("a", rule).ok).toBe(false);
  });

  it("frees a slot once the window passes", () => {
    vi.useFakeTimers();
    const rule = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit("k", rule).ok).toBe(true);
    expect(checkRateLimit("k", rule).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit("k", rule).ok).toBe(true);
    vi.useRealTimers();
  });

  it("reports retryAfterMs when blocked", () => {
    vi.useFakeTimers();
    const rule = { limit: 1, windowMs: 2000 };
    checkRateLimit("k", rule);
    vi.advanceTimersByTime(500);
    const blocked = checkRateLimit("k", rule);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBe(1500);
    vi.useRealTimers();
  });
});

describe("AI rate-limit helpers", () => {
  beforeEach(() => resetRateLimits());
  afterEach(() => vi.useRealTimers());

  const actor = { id: "u1", masjidId: "m1" };

  it("enforceAiRateLimit returns a 429 Response once the per-user limit is hit", () => {
    let last: Response | null = null;
    for (let i = 0; i < 20; i += 1) last = enforceAiRateLimit("lesson", actor);
    expect(last).toBeInstanceOf(Response);
    expect(last?.status).toBe(429);
    expect(last?.headers.get("Retry-After")).toBeTruthy();
  });

  it("assertAiRateLimit throws a RateLimitError once blocked", () => {
    expect(() => {
      for (let i = 0; i < 20; i += 1) assertAiRateLimit("checkpoint", actor);
    }).toThrow(RateLimitError);
  });

  it("different features have separate budgets", () => {
    for (let i = 0; i < 20; i += 1) enforceAiRateLimit("lesson", actor);
    expect(enforceAiRateLimit("checkpoint", actor)).toBeNull();
  });
});
