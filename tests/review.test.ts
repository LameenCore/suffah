import { describe, it, expect } from "vitest";
import { scheduleNext } from "@/lib/review";

const T0 = new Date("2026-09-05T00:00:00Z").getTime();
const start = { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0 };

describe("scheduleNext (SM-2)", () => {
  it("first correct -> 1 day", () => {
    const n = scheduleNext(start, true, T0);
    expect(n.intervalDays).toBe(1);
    expect(n.reps).toBe(1);
    expect(new Date(n.dueAt).getTime()).toBe(T0 + 86_400_000);
  });

  it("second correct -> 3 days", () => {
    const n = scheduleNext({ ...start, reps: 1, intervalDays: 1 }, true, T0);
    expect(n.intervalDays).toBe(3);
  });

  it("third correct -> interval * ease, ease creeps up", () => {
    const n = scheduleNext({ ease: 2.5, intervalDays: 3, reps: 2, lapses: 0 }, true, T0);
    expect(n.intervalDays).toBe(Math.round(3 * 2.5));
    expect(n.ease).toBeGreaterThan(2.5);
  });

  it("a miss resets reps, drops ease, next day", () => {
    const n = scheduleNext({ ease: 2.5, intervalDays: 20, reps: 5, lapses: 0 }, false, T0);
    expect(n.intervalDays).toBe(1);
    expect(n.reps).toBe(0);
    expect(n.lapses).toBe(1);
    expect(n.ease).toBeCloseTo(2.3, 5);
  });

  it("ease never falls below 1.3", () => {
    let s = { ease: 1.35, intervalDays: 1, reps: 0, lapses: 0 };
    for (let i = 0; i < 5; i += 1) s = scheduleNext(s, false, T0);
    expect(s.ease).toBe(1.3);
  });
});
