import { describe, it, expect } from "vitest";
import {
  gradeQuestion,
  gradeQuestions,
  stripQuestionAnswers,
  type Question,
} from "@/lib/ai/questions";

const mcq = (over: Partial<Extract<Question, { type: "mcq" }>> = {}): Question => ({
  id: "q1",
  type: "mcq",
  prompt: "2 + 2 = ?",
  options: ["3", "4", "5"],
  answerIndex: 1,
  explanation: "basic addition",
  ...over,
});

const short = (over: Partial<Extract<Question, { type: "short" }>> = {}): Question => ({
  id: "q2",
  type: "short",
  prompt: "capital of France?",
  answer: "Paris",
  acceptable: ["paris, france"],
  explanation: "",
  ...over,
});

describe("gradeQuestion — MCQ", () => {
  it("marks the right index correct", () => {
    expect(gradeQuestion(mcq(), "1").correct).toBe(true);
  });
  it("marks a wrong index incorrect", () => {
    expect(gradeQuestion(mcq(), "0").correct).toBe(false);
  });
  it("marks a missing answer incorrect (not a crash)", () => {
    const g = gradeQuestion(mcq(), undefined);
    expect(g.correct).toBe(false);
    expect(g.given).toBe("");
  });
  it("marks a non-numeric answer incorrect", () => {
    expect(gradeQuestion(mcq(), "four").correct).toBe(false);
  });
  it("shows the chosen option text when the index is valid", () => {
    expect(gradeQuestion(mcq(), "2").given).toBe("5");
  });
});

describe("gradeQuestion — short answer", () => {
  it("exact match", () => {
    expect(gradeQuestion(short(), "Paris").correct).toBe(true);
  });
  it("case + whitespace + punctuation insensitive", () => {
    expect(gradeQuestion(short(), "  paris. ").correct).toBe(true);
  });
  it("accepts an entry from the acceptable list", () => {
    expect(gradeQuestion(short(), "Paris, France").correct).toBe(true);
  });
  it("numeric answers match within tolerance and ignore units", () => {
    const q = short({ answer: "12", acceptable: [] });
    expect(gradeQuestion(q, "12 apples").correct).toBe(true);
    expect(gradeQuestion(q, "12.0").correct).toBe(true);
    expect(gradeQuestion(q, "13").correct).toBe(false);
  });
  it("negative numbers", () => {
    const q = short({ answer: "-5", acceptable: [] });
    expect(gradeQuestion(q, "-5").correct).toBe(true);
    expect(gradeQuestion(q, "5").correct).toBe(false);
  });
  it("missing answer is incorrect, not a crash", () => {
    expect(gradeQuestion(short(), undefined).correct).toBe(false);
  });
});

describe("gradeQuestions", () => {
  it("scores a mixed set", () => {
    const qs = [mcq(), short()];
    const g = gradeQuestions(qs, { q1: "1", q2: "Paris" });
    expect(g).toMatchObject({ correctCount: 2, total: 2, score: 1 });
  });
  it("partial credit is a fraction", () => {
    const g = gradeQuestions([mcq(), short()], { q1: "0", q2: "Paris" });
    expect(g.score).toBeCloseTo(0.5);
  });
  it("an empty set scores 0, not NaN", () => {
    const g = gradeQuestions([], {});
    expect(g.score).toBe(0);
    expect(Number.isNaN(g.score)).toBe(false);
  });
  it("missing answer keys are graded incorrect", () => {
    const g = gradeQuestions([mcq(), short()], {});
    expect(g.correctCount).toBe(0);
  });
});

describe("stripQuestionAnswers", () => {
  it("never leaks the answer or the index to the student shape", () => {
    const stripped = stripQuestionAnswers([mcq(), short()]);
    const json = JSON.stringify(stripped);
    expect(json).not.toContain("answerIndex");
    expect(json).not.toContain("Paris");
    expect(json).not.toContain("explanation");
    expect(stripped[0]).toEqual({ id: "q1", type: "mcq", prompt: "2 + 2 = ?", options: ["3", "4", "5"] });
  });
});
