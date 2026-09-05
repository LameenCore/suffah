// Shared question shape + objective grading for checkpoints (T07), unit
// assessments (T08), and term exams (T09). One place for "what a question looks
// like" and "how we grade it without a rubric" (PRD Non-Goal: no subjective grading).

import { z } from "zod";

export const McqQuestionSchema = z.object({
  id: z.string().describe("Stable id like 'q1'."),
  type: z.literal("mcq"),
  prompt: z.string(),
  options: z.array(z.string()).min(3).max(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export const ShortQuestionSchema = z.object({
  id: z.string(),
  type: z.literal("short"),
  prompt: z.string(),
  answer: z.string().describe("The canonical short answer - a number or a few words."),
  acceptable: z
    .array(z.string())
    .describe("Other answers that should be marked correct (spellings, phrasings, units)."),
  explanation: z.string(),
});

export const QuestionSchema = z.discriminatedUnion("type", [
  McqQuestionSchema,
  ShortQuestionSchema,
]);

export type Question = z.infer<typeof QuestionSchema>;

/** A question as shown to a student - no answers leaked. */
export type QuestionForStudent =
  | { id: string; type: "mcq"; prompt: string; options: string[] }
  | { id: string; type: "short"; prompt: string };

export function stripQuestionAnswers(questions: Question[]): QuestionForStudent[] {
  return questions.map((q) =>
    q.type === "mcq"
      ? { id: q.id, type: "mcq", prompt: q.prompt, options: q.options }
      : { id: q.id, type: "short", prompt: q.prompt },
  );
}

// --- Grading ---------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s.\-/]/gu, "")
    .replace(/\s+/g, " ");
}

function asNumber(s: string): number | null {
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function shortAnswerCorrect(given: string, q: z.infer<typeof ShortQuestionSchema>): boolean {
  const candidates = [q.answer, ...q.acceptable];
  const g = normalize(given);
  if (candidates.some((c) => normalize(c) === g)) return true;

  const gn = asNumber(given);
  return (
    gn !== null &&
    candidates.some((c) => {
      const cn = asNumber(c);
      return cn !== null && Math.abs(cn - gn) < 1e-9;
    })
  );
}

export interface QuestionGrade {
  id: string;
  correct: boolean;
  given: string;
  correctAnswer: string;
  explanation: string;
}

export function gradeQuestion(q: Question, raw: string | undefined): QuestionGrade {
  const given = (raw ?? "").toString();
  if (q.type === "mcq") {
    const idx = Number.parseInt(given, 10);
    return {
      id: q.id,
      correct: idx === q.answerIndex,
      given: Number.isInteger(idx) && q.options[idx] !== undefined ? q.options[idx] : given,
      correctAnswer: q.options[q.answerIndex],
      explanation: q.explanation,
    };
  }
  return {
    id: q.id,
    correct: shortAnswerCorrect(given, q),
    given,
    correctAnswer: q.answer,
    explanation: q.explanation,
  };
}

export interface GradedSet {
  score: number; // 0..1
  correctCount: number;
  total: number;
  perQuestion: QuestionGrade[];
}

export function gradeQuestions(
  questions: Question[],
  answers: Record<string, string>,
): GradedSet {
  const perQuestion = questions.map((q) => gradeQuestion(q, answers[q.id]));
  const correctCount = perQuestion.filter((g) => g.correct).length;
  const total = perQuestion.length;
  return {
    score: total === 0 ? 0 : correctCount / total,
    correctCount,
    total,
    perQuestion,
  };
}
