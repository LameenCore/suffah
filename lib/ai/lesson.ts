// Lesson generation — the first of the three AI call types (see docs/ARCHITECTURE.md).
//
// Given a pathway node, generate the lesson a student reads before the checkpoint,
// then PERSIST it onto pathway_nodes.lesson_content. Content is generated once and
// never regenerated on view: a pod's continuity depends on stable, referenceable
// lessons (PRD constraint). If the Anthropic call fails mid-demo we fall back to a
// hand-authored lesson for that node rather than letting the walkthrough break
// (see .claude/skills/api-design.md — AI calls need a graceful fallback).

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, LESSON_MODEL } from "@/lib/ai/client";
import {
  getPathwayNode,
  saveLessonContent,
  type PathwayNode,
  type CourseRef,
} from "@/lib/db/queries";
import { fallbackLesson } from "@/lib/ai/fallback-lessons";
import type { CourseName } from "@/lib/types";

// --- Persisted shape -------------------------------------------------------

const LessonBodySchema = z.object({
  summary: z
    .string()
    .describe("2-3 sentences a 12-year-old can read, framing why this node matters."),
  objectives: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("What the student should be able to do after this lesson."),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        body: z
          .string()
          .describe("1-3 short paragraphs of plain prose. No markdown headers."),
      }),
    )
    .min(2)
    .max(5),
  worked_example: z.object({
    prompt: z.string().describe("A concrete problem or scenario."),
    solution: z.string().describe("Step-by-step, showing the reasoning."),
  }),
  practice: z
    .array(
      z.object({
        prompt: z.string(),
        answer: z
          .string()
          .describe(
            "The objective answer — a number or a short phrase, gradeable without a rubric.",
          ),
        explanation: z.string(),
      }),
    )
    .min(2)
    .max(4)
    .describe("Objective self-check items. The checkpoint (T07) draws on these."),
  key_terms: z
    .array(z.object({ term: z.string(), definition: z.string() }))
    .min(2)
    .max(6),
});

export type LessonBody = z.infer<typeof LessonBodySchema>;

export type LessonSource = "model" | "fallback";

export interface LessonContent extends LessonBody {
  schemaVersion: 1;
  generatedBy: string; // model id, or "fallback"
  generatedAt: string; // ISO 8601
  /** Compliance-adjacent copy shown with a "verify with current regulation" note. */
  regulationNote?: string;
}

export interface GenerateLessonResult {
  node: PathwayNode;
  lesson: LessonContent;
  /** false when a persisted lesson already existed and was returned as-is. */
  regenerated: boolean;
  source: LessonSource | "existing";
}

// --- Prompting ------------------------------------------------------------

/** Per-course framing. Math is the compliance-credibility subject; flag its regulation copy. */
function courseBrief(course: CourseRef): { guidance: string; regulationNote?: string } {
  const name = course.name as CourseName;
  switch (name) {
    case "Math":
      return {
        guidance:
          "This course maps to the Québec Secondary 1 (Cycle 1) mathematics program. " +
          "Keep notation and vocabulary consistent with that curriculum. Use real, " +
          "checkable arithmetic in the worked example and practice.",
        regulationNote:
          "This lesson is aligned to the Québec Secondary 1 mathematics program as a demo " +
          "mapping. Confirm scope and sequence against the current Progression of Learning " +
          "before relying on it for a home-instruction portfolio.",
      };
    case "Seerah":
      return {
        guidance:
          "This is a community-designed Seerah course — there is no external curriculum " +
          "body. Teach from the mainstream Sunni historical tradition, name events plainly, " +
          "and stay age-appropriate. Say 'the Prophet Muhammad ﷺ' on first mention.",
      };
    case "AI Literacy":
      return {
        guidance:
          "Teach how language models actually work at a 12-year-old's level — prediction " +
          "over next tokens, training data, confident mistakes. Concrete examples over jargon.",
      };
    default:
      return { guidance: "Teach the node's topic clearly and concretely." };
  }
}

function buildPrompt(node: PathwayNode): { system: string; user: string } {
  const { guidance } = courseBrief(node.course);
  const system =
    "You write short, warm, precise lessons for a self-paced homeschool playground. " +
    "The reader is about 12 years old (Québec Secondary 1). Every lesson is followed by " +
    "an objective checkpoint, so your practice items must have a single checkable answer " +
    "(a number or a short phrase) — never an essay prompt. Plain prose, no markdown " +
    "headers inside section bodies. Be accurate; do not invent facts.";
  const user = [
    `Course: ${node.course.name} (${node.course.grade_band})`,
    `Unit node ${node.sequence_order}: "${node.title}"`,
    "",
    guidance,
    "",
    "Write the lesson for this node.",
  ].join("\n");
  return { system, user };
}

// --- Generation ----------------------------------------------------------

async function generateWithModel(node: PathwayNode): Promise<LessonContent> {
  const { system, user } = buildPrompt(node);
  const response = await getAnthropic().messages.parse({
    model: LESSON_MODEL,
    max_tokens: 8000,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: zodOutputFormat(LessonBodySchema) },
  });

  const body = response.parsed_output;
  if (!body) {
    throw new Error(
      `lesson generation: model returned unparseable output (stop_reason=${response.stop_reason})`,
    );
  }

  return {
    ...body,
    schemaVersion: 1,
    generatedBy: LESSON_MODEL,
    generatedAt: new Date().toISOString(),
    regulationNote: courseBrief(node.course).regulationNote,
  };
}

/**
 * Generate and persist the lesson for one pathway node.
 *
 * - If a lesson already exists on the node, it is returned unchanged unless
 *   `force` is set (continuity guarantee).
 * - If the Anthropic call fails or isn't configured, falls back to a
 *   hand-authored lesson for that node when one exists; otherwise rethrows.
 */
export async function generateLessonForNode(
  nodeId: string,
  masjidId: string,
  opts: { force?: boolean } = {},
): Promise<GenerateLessonResult> {
  const node = await getPathwayNode(nodeId, masjidId);
  if (!node) {
    const err = new Error(`pathway node ${nodeId} not found in masjid ${masjidId}`);
    err.name = "NodeNotFoundError";
    throw err;
  }

  if (node.lesson_content && !opts.force) {
    return { node, lesson: node.lesson_content, regenerated: false, source: "existing" };
  }

  let lesson: LessonContent;
  let source: LessonSource;
  try {
    lesson = await generateWithModel(node);
    source = "model";
  } catch (modelError) {
    const fb = fallbackLesson(node);
    if (!fb) throw modelError;
    console.warn(
      `[lib/ai/lesson] model generation failed for node ${nodeId}; using fallback lesson.`,
      modelError instanceof Error ? modelError.message : modelError,
    );
    lesson = fb;
    source = "fallback";
  }

  const persisted = await saveLessonContent(nodeId, masjidId, lesson);
  return { node: persisted, lesson, regenerated: true, source };
}
