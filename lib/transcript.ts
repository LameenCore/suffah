// Per-student term-completion record / transcript (T49).
//
// Distinct from the compliance snapshot (T12/T20, which is a forward-looking
// status): this is a plain backward record of what was completed - units,
// checkpoints, assessments, term exams - portable if the family leaves.
//
// Data comes from getChildReport (the same batched source the parent dashboard
// and compliance report use); no new queries.

import { getChildReport, type CourseReport } from "@/lib/db/parent-queries";
import { DEMO_TERM_LABEL } from "@/lib/types";

export interface TranscriptCourse {
  courseName: string;
  gradeBand: string;
  pathwayStep: number;
  pathwayTotal: number;
  checkpointsPassed: number;
  checkpointsAttempted: number;
  unitsPassed: number;
  unitsAttempted: number;
  bestUnitScore: number | null;
  termExam: { termLabel: string; score: number; attemptedAt: string } | null;
}

export interface Transcript {
  student: { id: string; name: string };
  podName: string | null;
  termLabel: string;
  generatedAt: string;
  courses: TranscriptCourse[];
  totals: {
    checkpointsPassed: number;
    unitsPassed: number;
    termExamsTaken: number;
  };
}

function summariseCourse(c: CourseReport): TranscriptCourse {
  const cpPassed = c.checkpoints.filter((x) => x.passed).length;
  const uaPassed = c.unitAssessments.filter((x) => x.passed).length;
  const bestUnit = c.unitAssessments.length
    ? Math.max(...c.unitAssessments.map((x) => x.score))
    : null;
  const lastTerm = c.termExams.length ? c.termExams[c.termExams.length - 1] : null;
  return {
    courseName: c.courseName,
    gradeBand: c.gradeBand,
    pathwayStep: c.nodePosition,
    pathwayTotal: c.totalNodes,
    checkpointsPassed: cpPassed,
    checkpointsAttempted: c.checkpoints.length,
    unitsPassed: uaPassed,
    unitsAttempted: c.unitAssessments.length,
    bestUnitScore: bestUnit,
    termExam: lastTerm
      ? { termLabel: lastTerm.termLabel, score: lastTerm.score, attemptedAt: lastTerm.attemptedAt }
      : null,
  };
}

export async function assembleTranscript(
  studentId: string,
  studentName: string,
  masjidId: string,
  termLabel: string = DEMO_TERM_LABEL,
): Promise<Transcript> {
  const report = await getChildReport({ id: studentId, name: studentName }, masjidId);
  const courses = report.courses.map(summariseCourse);
  return {
    student: { id: studentId, name: studentName },
    podName: report.podName,
    termLabel,
    generatedAt: new Date().toISOString(),
    courses,
    totals: {
      checkpointsPassed: courses.reduce((s, c) => s + c.checkpointsPassed, 0),
      unitsPassed: courses.reduce((s, c) => s + c.unitsPassed, 0),
      termExamsTaken: courses.filter((c) => c.termExam).length,
    },
  };
}

const pct = (f: number) => `${Math.round(f * 100)}%`;

/** Flat CSV, one row per course + a totals row. */
export function transcriptToCsv(t: Transcript): string {
  const esc = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    "student",
    "term",
    "course",
    "grade_band",
    "pathway_step",
    "pathway_total",
    "checkpoints_passed",
    "checkpoints_attempted",
    "units_passed",
    "units_attempted",
    "best_unit_score",
    "term_exam_score",
    "term_exam_date",
  ];
  const rows = t.courses.map((c) =>
    [
      t.student.name,
      t.termLabel,
      c.courseName,
      c.gradeBand,
      c.pathwayStep,
      c.pathwayTotal,
      c.checkpointsPassed,
      c.checkpointsAttempted,
      c.unitsPassed,
      c.unitsAttempted,
      c.bestUnitScore != null ? pct(c.bestUnitScore) : "",
      c.termExam ? pct(c.termExam.score) : "",
      c.termExam ? c.termExam.attemptedAt.slice(0, 10) : "",
    ].map(esc),
  );
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n") + "\n";
}
