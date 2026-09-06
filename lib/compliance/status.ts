// Living-compliance status engine (T20). Pure functions - no DB, no I/O.
//
// Turns a student's raw results into a forward-looking read: for each course,
// "on track / watch / gap" plus the concrete signals behind it. This is what
// makes the compliance report an early-warning system rather than a term-end
// PDF. Thresholds are hardcoded for the demo and carry a "verify with current
// regulation" note wherever they surface.

import { PASS_THRESHOLD } from "@/lib/types";
import type { CourseReport } from "@/lib/db/parent-queries";

export type ComplianceLevel = "on_track" | "watch" | "gap";

/**
 * A translation-ready form of each `signals` entry: a stable code plus the
 * numbers behind it. The view layer renders these through the active locale
 * (see `lib/i18n/compliance-text.ts`); `signals` keeps the English prose so the
 * pure-function unit tests and any English-only callers are unaffected.
 */
export interface SignalCode {
  code: string;
  params?: Record<string, string | number>;
}

export interface CourseComplianceStatus {
  courseId: string;
  courseName: string;
  level: ComplianceLevel;
  /** Human-readable reasons - both concerns and positives. */
  signals: string[];
  /** Same reasons as `signals`, in order, as localisable codes. */
  signalCodes: SignalCode[];
  metrics: {
    checkpointsPassed: number;
    checkpointsAttempted: number;
    totalNodes: number;
    passRate: number; // 0..1 of attempted
    coverage: number; // 0..1 passed of total
    unitAssessmentPassed: boolean;
    unitAssessmentAttempted: boolean;
    termExamTaken: boolean;
    termExamScore: number | null;
    termExamPassed: boolean;
    podPosition: number;
  };
}

const LEVEL_RANK: Record<ComplianceLevel, number> = { on_track: 0, watch: 1, gap: 2 };

export function computeCourseStatus(
  course: CourseReport,
  termLabel: string,
): CourseComplianceStatus {
  const passedNodes = new Set<string>();
  const attemptedNodes = new Set<string>();
  for (const cp of course.checkpoints) {
    attemptedNodes.add(cp.nodeTitle);
    if (cp.passed) passedNodes.add(cp.nodeTitle);
  }
  const checkpointsPassed = passedNodes.size;
  const checkpointsAttempted = attemptedNodes.size;
  const totalNodes = course.totalNodes || 0;
  const passRate = checkpointsAttempted > 0 ? checkpointsPassed / checkpointsAttempted : 0;
  const coverage = totalNodes > 0 ? checkpointsPassed / totalNodes : 0;

  const unitAssessmentAttempted = course.unitAssessments.length > 0;
  const unitAssessmentPassed = course.unitAssessments.some((u) => u.passed);

  const termExams = course.termExams.filter((t) => t.termLabel === termLabel);
  const termExamTaken = termExams.length > 0;
  const termExamScore = termExamTaken
    ? Math.max(...termExams.map((t) => t.score))
    : null;
  const termExamPassed = termExamScore != null && termExamScore >= PASS_THRESHOLD;

  const podPosition = course.nodePosition;
  const podFinished = totalNodes > 0 && podPosition >= totalNodes;

  const signals: string[] = [];
  const signalCodes: SignalCode[] = [];
  const add = (
    text: string,
    code: string,
    params?: Record<string, string | number>,
  ) => {
    signals.push(text);
    signalCodes.push(params ? { code, params } : { code });
  };
  let level: ComplianceLevel = "on_track";

  // --- gap conditions ---
  if (checkpointsAttempted === 0 && podPosition >= 2) {
    level = "gap";
    add(
      `Pod is on node ${podPosition} but this student has no checkpoint attempts on record.`,
      "noCheckpointsPodAhead",
      { pos: podPosition },
    );
  }
  if (checkpointsAttempted > 0 && passRate < 0.5) {
    level = "gap";
    add(
      `Checkpoint pass rate ${Math.round(passRate * 100)}% (${checkpointsPassed}/${checkpointsAttempted}).`,
      "lowPassRateGap",
      {
        pct: Math.round(passRate * 100),
        passed: checkpointsPassed,
        attempted: checkpointsAttempted,
      },
    );
  }
  if (termExamTaken && !termExamPassed) {
    level = "gap";
    add(
      `Term exam ${Math.round((termExamScore ?? 0) * 100)}% - below the ${Math.round(PASS_THRESHOLD * 100)}% threshold.`,
      "termExamBelowThreshold",
      {
        pct: Math.round((termExamScore ?? 0) * 100),
        threshold: Math.round(PASS_THRESHOLD * 100),
      },
    );
  }

  // --- watch conditions (only if not already a gap) ---
  if (level !== "gap") {
    if (checkpointsAttempted === 0 && podPosition >= 1) {
      level = "watch";
      add("Not started here yet - no checkpoint attempted.", "notStartedHere");
    }
    if (checkpointsAttempted > 0 && passRate < PASS_THRESHOLD) {
      level = "watch";
      add(
        `Checkpoint pass rate ${Math.round(passRate * 100)}% - below the ${Math.round(PASS_THRESHOLD * 100)}% mark.`,
        "lowPassRateWatch",
        {
          pct: Math.round(passRate * 100),
          threshold: Math.round(PASS_THRESHOLD * 100),
        },
      );
    }
    if (podPosition >= 2 && !unitAssessmentAttempted) {
      level = "watch";
      add(
        "Pod has moved past the first node but no unit assessment has been attempted.",
        "noUnitAssessment",
      );
    }
    if (podFinished && !termExamTaken) {
      level = "watch";
      add(
        `Pod has finished the course pathway but the ${termLabel} term exam is not done.`,
        "pathwayDoneNoTermExam",
        { term: termLabel },
      );
    }
    if (totalNodes > 0 && coverage < 0.34 && podPosition > 1) {
      level = "watch";
      add(
        `Only ${checkpointsPassed} of ${totalNodes} nodes have a passed checkpoint.`,
        "lowCoverage",
        { passed: checkpointsPassed, total: totalNodes },
      );
    }
  }

  // --- positives (shown alongside) ---
  if (checkpointsPassed > 0 && passRate >= PASS_THRESHOLD) {
    add(
      `${checkpointsPassed} checkpoint${checkpointsPassed === 1 ? "" : "s"} passed at ${Math.round(passRate * 100)}%.`,
      checkpointsPassed === 1
        ? "checkpointsPassedPositiveOne"
        : "checkpointsPassedPositiveMany",
      { count: checkpointsPassed, pct: Math.round(passRate * 100) },
    );
  }
  if (unitAssessmentPassed) {
    const best = Math.max(...course.unitAssessments.map((u) => u.score));
    add(`Unit assessment passed (${Math.round(best * 100)}%).`, "unitAssessmentPassed", {
      pct: Math.round(best * 100),
    });
  }
  if (termExamPassed) {
    add(`Term exam passed (${Math.round((termExamScore ?? 0) * 100)}%).`, "termExamPassed", {
      pct: Math.round((termExamScore ?? 0) * 100),
    });
  }
  if (signals.length === 0) {
    add("On track - no concerns from the data so far.", "onTrackNoConcerns");
  }

  return {
    courseId: course.courseId,
    courseName: course.courseName,
    level,
    signals,
    signalCodes,
    metrics: {
      checkpointsPassed,
      checkpointsAttempted,
      totalNodes,
      passRate,
      coverage,
      unitAssessmentPassed,
      unitAssessmentAttempted,
      termExamTaken,
      termExamScore,
      termExamPassed,
      podPosition,
    },
  };
}

export interface OverallCompliance {
  level: ComplianceLevel;
  headline: string;
  counts: Record<ComplianceLevel, number>;
}

export function computeOverall(statuses: CourseComplianceStatus[]): OverallCompliance {
  const counts: Record<ComplianceLevel, number> = { on_track: 0, watch: 0, gap: 0 };
  for (const s of statuses) counts[s.level] += 1;

  const level = statuses.reduce<ComplianceLevel>(
    (worst, s) => (LEVEL_RANK[s.level] > LEVEL_RANK[worst] ? s.level : worst),
    "on_track",
  );

  const headline =
    level === "gap"
      ? `Attention needed - ${counts.gap} course${counts.gap === 1 ? "" : "s"} with a forming gap.`
      : level === "watch"
        ? `Mostly on track - ${counts.watch} course${counts.watch === 1 ? "" : "s"} to watch.`
        : "On track across all courses for the evaluation requirement.";

  return { level, headline, counts };
}
