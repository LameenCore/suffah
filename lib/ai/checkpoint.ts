// Checkpoint generation + grading — the second AI call type (see docs/ARCHITECTURE.md).
//
// A checkpoint is a short, low-stakes check tied to one lesson node. It is
// generated from that node's persisted lesson, persisted onto the node
// (checkpoint_content), graded objectively (see lib/ai/questions.ts — NO rubric
// grading, PRD Non-Goal), and the attempt is written to checkpoint_results.
// Passing advances the pod to the next node.

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

export type { QuestionGrade } from "@/lib/ai/questions";

// --- Persisted shape -----------------------------------------------------

const CheckpointBodySchema = z.object({
  questions: z
    .array(QuestionSchema)
    .min(3)
    .max(4)
    .describe("Mix of mcq and short. Every question has one objective, checkable answer."),
});

export type CheckpointBody = z.infer<typeof CheckpointBodySchema>;
export type CheckpointQuestion = Question;
export type CheckpointSource = "model" | "fallback";

export interface CheckpointContent extends CheckpointBody {
  schemaVersion: 1;
  generatedBy: string;
  generatedAt: string;
}

export interface CheckpointForStudent {
  questions: QuestionForStudent[];
}

export function stripAnswers(content: CheckpointContent): CheckpointForStudent {
  return { questions: stripQuestionAnswers(content.questions) };
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

  const { score, correctCount, total, perQuestion } = gradeQuestions(
    checkpoint.questions,
    answers,
  );
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
