// Checkpoint generation + grading — the second AI call type (see docs/ARCHITECTURE.md).
//
// A checkpoint is a short, low-stakes check tied to one lesson node. It is
// generated from that node's persisted lesson, persisted onto the node
// (checkpoint_content), graded objectively (MCQ index match / normalized string
// + numeric match — NO rubric grading, see PRD Non-Goals), and the attempt is
// written to checkpoint_results. Passing advances the pod to the next node.

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, LESSON_MODEL } from "@/lib/ai/client";
import {
  getPathwayNode,
  saveCheckpointContent,
  saveCheckpointResult,
  getLatestCheckpointResult,
  getNextNode,
  advancePodProgress,
  getPodForStudent,
  type PathwayNode,
} from "@/lib/db/queries";
import { fallbackCheckpoint } from "@/lib/ai/fallback-checkpoints";
import { PASS_THRESHOLD } from "@/lib/types";

// --- Persisted shape -----------------------------------------------------

const McqQuestionSchema = z.object({
  id: z.string().describe("Stable id like 'q1'."),
  type: z.literal("mcq"),
  prompt: z.string(),
  options: z.array(z.string()).min(3).max(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

const ShortQuestionSchema = z.object({
  id: z.string(),
  type: z.literal("short"),
  prompt: z.string(),
  answer: z.string().describe("The canonical short answer — a number or a few words."),
  acceptable: z
    .array(z.string())
    .describe("Other answers that should be marked correct (spellings, phrasings, units)."),
  explanation: z.string(),
});

const CheckpointBodySchema = z.object({
  questions: z
    .array(z.discriminatedUnion("type", [McqQuestionSchema, ShortQuestionSchema]))
    .min(3)
    .max(4)
    .describe("Mix of mcq and short. Every question has one objective, checkable answer."),
});

export type CheckpointBody = z.infer<typeof CheckpointBodySchema>;
export type CheckpointQuestion = CheckpointBody["questions"][number];
export type CheckpointSource = "model" | "fallback";

export interface CheckpointContent extends CheckpointBody {
  schemaVersion: 1;
  generatedBy: string;
  generatedAt: string;
}

/** A checkpoint as shown to a student — no answers. */
export interface CheckpointForStudent {
  questions: Array<
    | { id: string; type: "mcq"; prompt: string; options: string[] }
    | { id: string; type: "short"; prompt: string }
  >;
}

export function stripAnswers(content: CheckpointContent): CheckpointForStudent {
  return {
    questions: content.questions.map((q) =>
      q.type === "mcq"
        ? { id: q.id, type: "mcq", prompt: q.prompt, options: q.options }
        : { id: q.id, type: "short", prompt: q.prompt },
    ),
  };
}

// --- Generation --------------------------------------------------------

export interface GenerateCheckpointResult {
  node: PathwayNode;
  checkpoint: CheckpointContent;
  regenerated: boolean;
  source: CheckpointSource | "existing";
}

async function generateWithModel(node: PathwayNode): Promise<CheckpointContent> {
  const lesson = node.lesson_content;
  if (!lesson) throw new Error("cannot generate a checkpoint before the lesson exists");

  const system =
    "You write short objective checkpoints for a self-paced homeschool playground. " +
    "The student just finished one lesson. Write 3-4 questions that check the lesson's " +
    "core ideas — a mix of multiple-choice and short-answer. Every question must have a " +
    "single objective answer that can be graded by exact/numeric match, never a rubric. " +
    "Short answers should be one number or a few words. Keep it at a 12-year-old's level.";
  const user = [
    `Course: ${node.course.name} — node ${node.sequence_order}: "${node.title}"`,
    "",
    "Lesson summary:",
    lesson.summary,
    "",
    "Objectives:",
    ...lesson.objectives.map((o) => `- ${o}`),
    "",
    "Key terms:",
    ...lesson.key_terms.map((t) => `- ${t.term}: ${t.definition}`),
    "",
    "Write the checkpoint for this node.",
  ].join("\n");

  const response = await getAnthropic().messages.parse({
    model: LESSON_MODEL,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: zodOutputFormat(CheckpointBodySchema) },
  });

  const body = response.parsed_output;
  if (!body) {
    throw new Error(
      `checkpoint generation: unparseable model output (stop_reason=${response.stop_reason})`,
    );
  }
  return {
    ...body,
    schemaVersion: 1,
    generatedBy: LESSON_MODEL,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate + persist the checkpoint for a node. Returns the existing one
 * unchanged unless `force`. Falls back to a hand-authored checkpoint if the
 * model call fails and one exists for the node.
 */
export async function generateCheckpointForNode(
  nodeId: string,
  masjidId: string,
  opts: { force?: boolean } = {},
): Promise<GenerateCheckpointResult> {
  const node = await getPathwayNode(nodeId, masjidId);
  if (!node) {
    const err = new Error(`pathway node ${nodeId} not found in masjid ${masjidId}`);
    err.name = "NodeNotFoundError";
    throw err;
  }
  if (!node.lesson_content) {
    const err = new Error("lesson must be generated before the checkpoint");
    err.name = "LessonMissingError";
    throw err;
  }

  if (node.checkpoint_content && !opts.force) {
    return { node, checkpoint: node.checkpoint_content, regenerated: false, source: "existing" };
  }

  let checkpoint: CheckpointContent;
  let source: CheckpointSource;
  try {
    checkpoint = await generateWithModel(node);
    source = "model";
  } catch (modelError) {
    const fb = fallbackCheckpoint(node);
    if (!fb) throw modelError;
    console.warn(
      `[lib/ai/checkpoint] model generation failed for node ${nodeId}; using fallback.`,
      modelError instanceof Error ? modelError.message : modelError,
    );
    checkpoint = fb;
    source = "fallback";
  }

  const persisted = await saveCheckpointContent(nodeId, masjidId, checkpoint);
  return { node: persisted, checkpoint, regenerated: true, source };
}

// --- Grading ----------------------------------------------------------

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
  if (gn !== null && candidates.some((c) => {
    const cn = asNumber(c);
    return cn !== null && Math.abs(cn - gn) < 1e-9;
  })) {
    return true;
  }
  return false;
}

export interface QuestionGrade {
  id: string;
  correct: boolean;
  given: string;
  correctAnswer: string;
  explanation: string;
}

export interface CheckpointGrade {
  score: number; // 0..1
  correctCount: number;
  total: number;
  passed: boolean;
  perQuestion: QuestionGrade[];
  /** The node the pod advanced to, if this attempt passed and a next node exists. */
  advancedToNodeId: string | null;
  alreadyPassed: boolean;
}

function gradeOne(q: CheckpointQuestion, raw: string | undefined): QuestionGrade {
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

/**
 * Grade a submitted checkpoint, persist the attempt, and advance the pod on a
 * pass. `answers` maps question id -> the student's answer (MCQ: the option
 * index as a string; short: the text).
 */
export async function gradeCheckpoint(
  nodeId: string,
  studentUserId: string,
  masjidId: string,
  answers: Record<string, string>,
): Promise<CheckpointGrade> {
  const node = await getPathwayNode(nodeId, masjidId);
  if (!node) {
    const err = new Error(`pathway node ${nodeId} not found in masjid ${masjidId}`);
    err.name = "NodeNotFoundError";
    throw err;
  }
  const checkpoint = node.checkpoint_content;
  if (!checkpoint) {
    const err = new Error("checkpoint has not been generated for this node");
    err.name = "CheckpointMissingError";
    throw err;
  }

  const perQuestion = checkpoint.questions.map((q) => gradeOne(q, answers[q.id]));
  const correctCount = perQuestion.filter((g) => g.correct).length;
  const total = perQuestion.length;
  const score = total === 0 ? 0 : correctCount / total;
  const passed = score >= PASS_THRESHOLD;

  const priorPass = (await getLatestCheckpointResult(studentUserId, nodeId))?.passed === true;

  await saveCheckpointResult(studentUserId, nodeId, passed, {
    score,
    correctCount,
    total,
    answers,
    perQuestion,
  });

  let advancedToNodeId: string | null = null;
  if (passed) {
    const pod = await getPodForStudent(studentUserId, masjidId);
    const nextNode = await getNextNode(node.course_id, node.sequence_order, masjidId);
    if (pod && nextNode) {
      await advancePodProgress(pod.id, node.course_id, nextNode);
      advancedToNodeId = nextNode.id;
    }
  }

  return {
    score,
    correctCount,
    total,
    passed,
    perQuestion,
    advancedToNodeId,
    alreadyPassed: priorPass,
  };
}
