import { describe, it, expect } from "vitest";
import { transcriptToCsv, type Transcript } from "@/lib/transcript";

const base: Transcript = {
  student: { id: "s1", name: "Yusuf" },
  podName: "Pod Al-Farabi",
  termLabel: "Fall 2026",
  generatedAt: "2026-09-05T12:00:00.000Z",
  courses: [
    {
      courseName: "Math",
      gradeBand: "Secondary 1",
      pathwayStep: 2,
      pathwayTotal: 3,
      checkpointsPassed: 2,
      checkpointsAttempted: 3,
      unitsPassed: 1,
      unitsAttempted: 1,
      bestUnitScore: 0.9,
      termExam: { termLabel: "Fall 2026", score: 0.75, attemptedAt: "2026-06-01T00:00:00Z" },
    },
    {
      courseName: "Seerah",
      gradeBand: "Secondary 1",
      pathwayStep: 1,
      pathwayTotal: 3,
      checkpointsPassed: 0,
      checkpointsAttempted: 0,
      unitsPassed: 0,
      unitsAttempted: 0,
      bestUnitScore: null,
      termExam: null,
    },
  ],
  totals: { checkpointsPassed: 2, unitsPassed: 1, termExamsTaken: 1 },
};

describe("transcriptToCsv", () => {
  const csv = transcriptToCsv(base);
  const lines = csv.trim().split("\n");

  it("has a header + one row per course", () => {
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith("student,term,course,")).toBe(true);
  });

  it("formats scores as percentages and dates as yyyy-mm-dd", () => {
    expect(lines[1]).toContain("90%"); // best unit score
    expect(lines[1]).toContain("75%"); // term exam
    expect(lines[1]).toContain("2026-06-01");
  });

  it("leaves blank cells for missing values", () => {
    const seerah = lines[2].split(",");
    // best_unit_score, term_exam_score, term_exam_date are the last three
    expect(seerah.slice(-3)).toEqual(["", "", ""]);
  });

  it("quotes a value containing a comma", () => {
    const withComma = transcriptToCsv({
      ...base,
      student: { id: "s1", name: "Ali, Jr." },
      courses: [base.courses[0]],
    });
    expect(withComma).toContain('"Ali, Jr."');
  });
});
