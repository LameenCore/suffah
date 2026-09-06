import { describe, it, expect } from "vitest";
import {
  computeCourseStatus,
  computeOverall,
  type CourseComplianceStatus,
} from "@/lib/compliance/status";
import type { CourseReport } from "@/lib/db/parent-queries";

const TERM = "Fall 2026";

function course(over: Partial<CourseReport> = {}): CourseReport {
  return {
    courseId: "c1",
    courseName: "Math",
    gradeBand: "Secondary 1",
    nodePosition: 1,
    totalNodes: 3,
    checkpoints: [],
    unitAssessments: [],
    termExams: [],
    ...over,
  };
}
const cp = (title: string, passed: boolean) => ({ nodeTitle: title, passed, attemptedAt: "2026-09-01" });

describe("computeCourseStatus", () => {
  it("on_track when the student is keeping pace with the pod and passing", () => {
    const s = computeCourseStatus(
      course({ nodePosition: 1, checkpoints: [cp("n1", true)] }),
      TERM,
    );
    expect(s.level).toBe("on_track");
    expect(s.metrics.passRate).toBe(1);
  });

  it("gap when fewer than half the attempted nodes are passed", () => {
    const s = computeCourseStatus(
      course({ nodePosition: 3, checkpoints: [cp("n1", true), cp("n2", false), cp("n3", false)] }),
      TERM,
    );
    expect(s.metrics.passRate).toBeCloseTo(1 / 3);
    expect(s.level).toBe("gap");
  });

  it("gap when the pod is ahead but the student has no attempts", () => {
    const s = computeCourseStatus(course({ nodePosition: 2, checkpoints: [] }), TERM);
    expect(s.level).toBe("gap");
  });

  it("gap when a term exam was taken and failed", () => {
    const s = computeCourseStatus(
      course({
        nodePosition: 3,
        checkpoints: [cp("n1", true), cp("n2", true), cp("n3", true)],
        termExams: [{ termLabel: TERM, score: 0.4, attemptedAt: "2026-12-01" }],
      }),
      TERM,
    );
    expect(s.level).toBe("gap");
    expect(s.metrics.termExamPassed).toBe(false);
  });

  it("watch when not started but the pod has (only just) begun", () => {
    const s = computeCourseStatus(course({ nodePosition: 1, checkpoints: [] }), TERM);
    expect(s.level).toBe("watch");
  });

  it("watch when past the first node with no unit assessment", () => {
    const s = computeCourseStatus(
      course({ nodePosition: 2, checkpoints: [cp("n1", true)] }),
      TERM,
    );
    expect(s.level).toBe("watch");
  });

  it("a term exam from a different term does not count", () => {
    const s = computeCourseStatus(
      course({
        nodePosition: 3,
        checkpoints: [cp("n1", true), cp("n2", true), cp("n3", true)],
        termExams: [{ termLabel: "Spring 2026", score: 0.2, attemptedAt: "2026-05-01" }],
      }),
      TERM,
    );
    expect(s.metrics.termExamTaken).toBe(false);
    expect(s.level).not.toBe("gap");
  });

  it("always returns at least one signal", () => {
    const s = computeCourseStatus(course(), TERM);
    expect(s.signals.length).toBeGreaterThan(0);
  });

  it("boundary: pass rate exactly 50% is a watch, not a gap", () => {
    // 1 of 2 distinct nodes passed -> passRate 0.5; gap needs < 0.5
    const s = computeCourseStatus(
      course({ nodePosition: 2, checkpoints: [cp("n1", true), cp("n2", false)] }),
      TERM,
    );
    expect(s.metrics.passRate).toBe(0.5);
    expect(s.level).toBe("watch");
  });

  it("boundary: pass rate exactly at the 70% threshold does not trigger the watch signal", () => {
    // 7 of 10 distinct nodes -> passRate 0.7 (== PASS_THRESHOLD, not <)
    const cps = Array.from({ length: 10 }, (_, i) => cp(`n${i}`, i < 7));
    const s = computeCourseStatus(course({ nodePosition: 2, totalNodes: 10, checkpoints: cps }), TERM);
    expect(s.metrics.passRate).toBeCloseTo(0.7);
    expect(s.signals.some((x) => x.includes("below the 70%"))).toBe(false);
  });

  it("surfaces positives: unit assessment + term exam passed", () => {
    const s = computeCourseStatus(
      course({
        nodePosition: 3,
        totalNodes: 3,
        checkpoints: [cp("n1", true), cp("n2", true), cp("n3", true)],
        unitAssessments: [{ unitTitle: "u1", score: 0.85, passed: true, attemptedAt: "2026-10-01" }],
        termExams: [{ termLabel: TERM, score: 0.9, attemptedAt: "2026-12-01" }],
      }),
      TERM,
    );
    expect(s.level).toBe("on_track");
    expect(s.signals.some((x) => x.startsWith("Unit assessment passed"))).toBe(true);
    expect(s.signals.some((x) => x.startsWith("Term exam passed"))).toBe(true);
  });
});

describe("computeOverall", () => {
  const mk = (level: CourseComplianceStatus["level"]): CourseComplianceStatus => ({
    courseId: "x",
    courseName: "X",
    level,
    signals: [],
    signalCodes: [],
    metrics: {} as CourseComplianceStatus["metrics"],
  });

  it("is the worst of the course levels", () => {
    expect(computeOverall([mk("on_track"), mk("watch"), mk("gap")]).level).toBe("gap");
    expect(computeOverall([mk("on_track"), mk("watch")]).level).toBe("watch");
    expect(computeOverall([mk("on_track"), mk("on_track")]).level).toBe("on_track");
  });

  it("counts each level", () => {
    const o = computeOverall([mk("gap"), mk("gap"), mk("watch")]);
    expect(o.counts).toEqual({ on_track: 0, watch: 1, gap: 2 });
  });

  it("headline reflects the level", () => {
    expect(computeOverall([mk("gap")]).headline).toMatch(/attention needed/i);
    expect(computeOverall([mk("watch")]).headline).toMatch(/mostly on track/i);
    expect(computeOverall([mk("on_track"), mk("on_track")]).headline).toMatch(/on track across all/i);
  });

  it("an empty set is on_track", () => {
    expect(computeOverall([]).level).toBe("on_track");
  });
});
