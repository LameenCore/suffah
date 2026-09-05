// Assessment generation + grading - the third AI call type (see docs/ARCHITECTURE.md).
//
// A unit assessment is cumulative: it draws on every lesson node in a unit, is
// generated once from those lessons and persisted (units.assessment_content),
// graded objectively (lib/ai/questions.ts - no rubric grading), and each attempt
// is written to unit_assessment_results as a compliance-relevant record.
//
// T09 (term exam) reuses the question generation + grading here behind a flag;
// keep the generation prompt and grading pure so that stays easy.

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, LESSON_MODEL } from "@/lib/ai/client";
import {
  QuestionSchema,
  stripQuestionAnswers,
  gradeQuestions,
  type Question,
  type QuestionForStudent,
  type QuestionGrade,
} from "@/lib/ai/questions";
import {
  getUnit,
  getUnitNodes,
  saveUnitAssessmentContent,
  saveUnitAssessmentResult,
  getLatestUnitAssessmentResult,
  type UnitRef,
  type PathwayNode,
} from "@/lib/db/queries";
import { fallbackUnitAssessment } from "@/lib/ai/fallback-assessments";
import { PASS_THRESHOLD } from "@/lib/types";

// --- Persisted shape -----------------------------------------------------

const AssessmentBodySchema = z.object({
  questions: z
    .array(QuestionSchema)
    .min(5)
    .max(8)
    .describe(
      "Cumulative across the whole unit - spread coverage over every node, mix mcq and short.",
    ),
});

export type AssessmentBody = z.infer<typeof AssessmentBodySchema>;
export type AssessmentKind = "unit" | "term";
export type AssessmentSource = "model" | "fallback";

export interface AssessmentContent extends AssessmentBody {
  schemaVersion: 1;
  kind: AssessmentKind;
  generatedBy: string;
  generatedAt: string;
  /** Titles of the nodes this assessment covers - shown to the student. */
  coversTitles: string[];
}

export interface AssessmentForStudent {
  kind: AssessmentKind;
  coversTitles: string[];
  questions: QuestionForStudent[];
}

export function stripAssessmentAnswers(content: AssessmentContent): AssessmentForStudent {
  return {
    kind: content.kind,
    coversTitles: content.coversTitles,
    questions: stripQuestionAnswers(content.questions),
  };
}

// --- Generation -------------------------------------------------------

/**
 * Build the model prompt for an assessment over a set of lesson nodes.
 * `kind` shapes the framing: a unit assessment is a checkpoint of mastery; a
 * term exam (T09) is the higher-stakes end-of-term version.
 */
export function buildAssessmentPrompt(
  courseName: string,
  gradeBand: string,
  scopeTitle: string,
  nodes: PathwayNode[],
  kind: AssessmentKind,
): { system: string; user: string } {
  const label = kind === "term" ? "term exam" : "unit assessment";
  const system =
    `You write objective ${label}s for a self-paced homeschool playground. ` +
    "The reader is about 12 years old. Every question must have one objective answer that " +
    "can be graded by exact or numeric match - never an essay or a rubric. Short answers " +
    "are one number or a few words. Spread the questions across all the lessons listed, " +
    "not just the last one.";
  const lessons = nodes
    .map((n, i) => {
      const l = n.lesson_content;
      return [
        `Lesson ${i + 1}: ${n.title}`,
        l ? `  Summary: ${l.summary}` : "  (no lesson content)",
        l ? `  Objectives: ${l.objectives.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
  const user = [
    `Course: ${courseName} (${gradeBand})`,
    `${kind === "term" ? "Term" : "Unit"}: "${scopeTitle}"`,
    "",
    "Lessons this assessment covers:",
    lessons,
    "",
    `Write the ${label}.`,
  ].join("\n");
  return { system, user };
}

async function generateWithModel(
  unit: UnitRef,
  nodes: PathwayNode[],
): Promise<AssessmentContent> {
  const withLessons = nodes.filter((n) => n.lesson_content);
  if (withLessons.length === 0) {
    throw new Error("cannot generate a unit assessment before any lesson in the unit exists");
  }

  const { system, user } = buildAssessmentPrompt(
    unit.course.name,
    unit.course.grade_band,
    unit.title,
    withLessons,
    "unit",
  );

  const response = await getAnthropic().messages.parse({
    model: LESSON_MODEL,
    max_tokens: 6000,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: zodOutputFormat(AssessmentBodySchema) },
  });

  const body = response.parsed_output;
  if (!body) {
    throw new Error(
      `unit assessment generation: unparseable model output (stop_reason=${response.stop_reason})`,
    );
  }
  return {
    ...body,
    schemaVersion: 1,
    kind: "unit",
    generatedBy: LESSON_MODEL,
    generatedAt: new Date().toISOString(),
    coversTitles: withLessons.map((n) => n.title),
  };
}

export interface GenerateAssessmentResult {
  unit: UnitRef;
  assessment: AssessmentContent;
  regenerated: boolean;
  source: AssessmentSource | "existing";
}

/**
 * Generate + persist the assessment for a unit. Returns the existing one
 * unchanged unless `force`. Falls back to a hand-authored assessment when the
 * model call fails and one exists for the unit.
 */
export async function generateUnitAssessment(
  unitId: string,
  masjidId: string,
  opts: { force?: boolean } = {},
): Promise<GenerateAssessmentResult> {
  const unit = await getUnit(unitId, masjidId);
  if (!unit) {
    const err = new Error(`unit ${unitId} not found in masjid ${masjidId}`);
    err.name = "UnitNotFoundError";
    throw err;
  }

  if (unit.assessment_content && !opts.force) {
    return { unit, assessment: unit.assessment_content, regenerated: false, source: "existing" };
  }

  const nodes = await getUnitNodes(unitId, masjidId);

  let assessment: AssessmentContent;
  let source: AssessmentSource;
  try {
    assessment = await generateWithModel(unit, nodes);
    source = "model";
  } catch (modelError) {
    const fb = fallbackUnitAssessment(unit, nodes);
    if (!fb) throw modelError;
    console.warn(
      `[lib/ai/assessment] model generation failed for unit ${unitId}; using fallback.`,
      modelError instanceof Error ? modelError.message : modelError,
    );
    assessment = fb;
    source = "fallback";
  }

  const persisted = await saveUnitAssessmentContent(unitId, masjidId, assessment);
  return { unit: persisted, assessment, regenerated: true, source };
}

// --- Grading ---------------------------------------------------------

export interface AssessmentGrade {
  score: number; // 0..1
  correctCount: number;
  total: number;
  passed: boolean;
  perQuestion: QuestionGrade[];
  alreadyPassed: boolean;
}

/** Grade a submitted unit assessment and persist the attempt to unit_assessment_results. */
export async function gradeUnitAssessment(
  unitId: string,
  studentUserId: string,
  masjidId: string,
  answers: Record<string, string>,
): Promise<AssessmentGrade> {
  const unit = await getUnit(unitId, masjidId);
  if (!unit) {
    const err = new Error(`unit ${unitId} not found in masjid ${masjidId}`);
    err.name = "UnitNotFoundError";
    throw err;
  }
  const assessment = unit.assessment_content;
  if (!assessment) {
    const err = new Error("assessment has not been generated for this unit");
    err.name = "AssessmentMissingError";
    throw err;
  }

  const { score, correctCount, total, perQuestion } = gradeQuestions(
    assessment.questions as Question[],
    answers,
  );
  const passed = score >= PASS_THRESHOLD;

  const priorPass = (await getLatestUnitAssessmentResult(studentUserId, unitId))?.passed === true;

  await saveUnitAssessmentResult(studentUserId, unitId, score, passed, {
    score,
    correctCount,
    total,
    answers,
    perQuestion,
  });

  return { score, correctCount, total, passed, perQuestion, alreadyPassed: priorPass };
}
