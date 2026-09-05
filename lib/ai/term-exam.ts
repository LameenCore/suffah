// Term exam - the unit-assessment machinery (lib/ai/assessment.ts) behind a flag:
// cumulative across a whole course, timed, no remedial branch (T09 / PRD §5.3).
//
// Reuses buildAssessmentPrompt(..., "term") and the shared objective grading in
// lib/ai/questions.ts. The exam is the primary compliance-report artifact, so the
// generated questions are persisted (term_exams) and every attempt recorded
// (term_exam_results).

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, LESSON_MODEL } from "@/lib/ai/client";
import { logModelCall, type TokenUsage } from "@/lib/ai/usage";
import { assertWithinAiBudget } from "@/lib/ai/budget";
import { QuestionSchema, stripQuestionAnswers, gradeQuestions } from "@/lib/ai/questions";
import type { Question, QuestionForStudent, QuestionGrade } from "@/lib/ai/questions";
import { buildAssessmentPrompt } from "@/lib/ai/assessment";
import {
  getCourseForMasjid,
  getCourseNodes,
  getTermExam,
  saveTermExamContent,
  saveTermExamResult,
  getLatestTermExamResult,
} from "@/lib/db/exam-queries";
import { PASS_THRESHOLD } from "@/lib/types";

const DEFAULT_DURATION_SECONDS = 20 * 60;

const TermExamBodySchema = z.object({
  questions: z
    .array(QuestionSchema)
    .min(6)
    .max(14)
    .describe("Cumulative across the whole course. Spread coverage; mix mcq and short."),
});

export type TermExamBody = z.infer<typeof TermExamBodySchema>;

export interface TermExamContent extends TermExamBody {
  schemaVersion: 1;
  kind: "term";
  termLabel: string;
  durationSeconds: number;
  generatedBy: string;
  generatedAt: string;
  coversTitles: string[];
}

export interface TermExamForStudent {
  termLabel: string;
  durationSeconds: number;
  coversTitles: string[];
  questions: QuestionForStudent[];
}

export function stripExamAnswers(content: TermExamContent): TermExamForStudent {
  return {
    termLabel: content.termLabel,
    durationSeconds: content.durationSeconds,
    coversTitles: content.coversTitles,
    questions: stripQuestionAnswers(content.questions),
  };
}

export type TermExamSource = "model" | "existing";

export interface GenerateTermExamResult {
  content: TermExamContent;
  source: TermExamSource;
}

/**
 * Generate + persist the term exam for a course. Returns the existing one
 * unchanged unless `force`. No offline fallback - a term exam is not on the
 * live demo's critical path (checkpoints + unit assessment are).
 */
export async function generateTermExam(
  courseId: string,
  termLabel: string,
  masjidId: string,
  opts: { force?: boolean; durationSeconds?: number; actorUserId?: string | null } = {},
): Promise<GenerateTermExamResult> {
  const course = await getCourseForMasjid(courseId, masjidId);
  if (!course) {
    const err = new Error(`course ${courseId} not found in masjid ${masjidId}`);
    err.name = "CourseNotFoundError";
    throw err;
  }

  if (!opts.force) {
    const existing = await getTermExam(courseId, termLabel, masjidId);
    if (existing) return { content: existing.content, source: "existing" };
  }

  const nodes = (await getCourseNodes(courseId, masjidId)).filter((n) => n.lesson_content);
  if (nodes.length === 0) {
    throw new Error("cannot generate a term exam before any lesson in the course exists");
  }

  // No offline fallback for a term exam - over budget, this surfaces as an error
  // the admin sees rather than silently degrading.
  await assertWithinAiBudget("term_exam", masjidId);

  const { system, user } = buildAssessmentPrompt(
    course.name,
    course.grade_band,
    `${course.name} - ${termLabel}`,
    nodes,
    "term",
  );

  // messages.parse() throws if the model output doesn't validate. That happens
  // occasionally and non-deterministically, so retry before giving up.
  let body: TermExamBody | null = null;
  let usage: TokenUsage | null = null;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3 && !body; attempt += 1) {
    try {
      const response = await getAnthropic().messages.parse({
        model: LESSON_MODEL,
        max_tokens: 8000,
        system:
          system +
          " This is a timed end-of-term exam with no help available mid-exam - make it " +
          "fair but comprehensive. Return 8-12 questions.",
        messages: [{ role: "user", content: user }],
        output_config: { format: zodOutputFormat(TermExamBodySchema) },
      });
      body = response.parsed_output;
      usage = response.usage ?? null;
    } catch (err) {
      lastErr = err;
      console.warn(
        `[lib/ai/term-exam] parse attempt ${attempt}/3 failed for ${course.name}: ` +
          (err instanceof Error ? err.message.split("\n")[0] : String(err)),
      );
    }
  }
  if (!body) {
    await logModelCall({
      feature: "term_exam",
      masjidId,
      actorUserId: opts.actorUserId ?? null,
      model: LESSON_MODEL,
      source: "model",
      ok: false,
    });
    throw new Error(
      `term exam generation for ${course.name}: model output failed to validate after 3 tries` +
        (lastErr instanceof Error ? ` (${lastErr.message.split("\n")[0]})` : ""),
    );
  }

  await logModelCall({
    feature: "term_exam",
    masjidId,
    actorUserId: opts.actorUserId ?? null,
    model: LESSON_MODEL,
    source: "model",
    usage,
  });

  const content: TermExamContent = {
    ...body,
    schemaVersion: 1,
    kind: "term",
    termLabel,
    durationSeconds: opts.durationSeconds ?? DEFAULT_DURATION_SECONDS,
    generatedBy: LESSON_MODEL,
    generatedAt: new Date().toISOString(),
    coversTitles: nodes.map((n) => n.title),
  };

  await saveTermExamContent(courseId, termLabel, masjidId, content, LESSON_MODEL);
  return { content, source: "model" };
}

// --- Grading ---------------------------------------------------------

export interface TermExamGrade {
  score: number; // 0..1
  correctCount: number;
  total: number;
  passed: boolean; // informational - a term exam has no remedial branch
  perQuestion: QuestionGrade[];
  termLabel: string;
}

/**
 * Grade a submitted term exam and persist the attempt. No remedial branch, no
 * pod advancement - the result is a compliance record, full stop.
 */
export async function gradeTermExam(
  courseId: string,
  termLabel: string,
  studentUserId: string,
  masjidId: string,
  answers: Record<string, string>,
): Promise<TermExamGrade> {
  const exam = await getTermExam(courseId, termLabel, masjidId);
  if (!exam) {
    const err = new Error("term exam has not been generated for this course/term");
    err.name = "TermExamMissingError";
    throw err;
  }

  const { score, correctCount, total, perQuestion } = gradeQuestions(
    exam.content.questions as Question[],
    answers,
  );
  const passed = score >= PASS_THRESHOLD;

  await saveTermExamResult(studentUserId, courseId, termLabel, score, {
    score,
    correctCount,
    total,
    passed,
    answers,
    perQuestion,
  });

  return { score, correctCount, total, passed, perQuestion, termLabel };
}

export async function latestTermExamGrade(
  studentUserId: string,
  courseId: string,
  termLabel: string,
): Promise<{ score: number; passed: boolean } | null> {
  const row = await getLatestTermExamResult(studentUserId, courseId, termLabel);
  if (!row) return null;
  const score = Number(row.score);
  return { score, passed: score >= PASS_THRESHOLD };
}
