// Adaptive path - remediation branch (T42).
//
// After two misses on a checkpoint, the student gets a short AI re-teach focused
// on exactly the questions they got wrong (objective grading tells us which),
// then tries again. The re-teach is cached per (student, node).

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getServiceClient } from "@/lib/db";
import { getAnthropic, LESSON_MODEL } from "@/lib/ai/client";
import { logModelCall } from "@/lib/ai/usage";
import { assertWithinAiBudget } from "@/lib/ai/budget";
import { getPathwayNode, getLatestCheckpointResult } from "@/lib/db/queries";
import type { QuestionGrade } from "@/lib/ai/questions";

const RemediationSchema = z.object({
  summary: z.string().describe("2-3 sentences naming what to focus on, warm and specific."),
  points: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("The key ideas behind the missed questions, re-explained plainly."),
  examples: z
    .array(z.object({ prompt: z.string(), solution: z.string() }))
    .min(1)
    .max(3)
    .describe("Fresh worked examples for those ideas - step by step, not just answers."),
});

export type RemediationContent = z.infer<typeof RemediationSchema>;

export interface Remediation {
  content: RemediationContent;
  missedConcepts: string[];
  source: "model" | "fallback";
}

function missedPromptsFrom(
  perQuestion: QuestionGrade[] | undefined,
  questionPromptById: Map<string, string>,
): string[] {
  if (!perQuestion) return [];
  return perQuestion
    .filter((q) => !q.correct)
    .map((q) => questionPromptById.get(q.id) ?? q.id);
}

function fallbackRemediation(missed: string[]): RemediationContent {
  return {
    summary:
      "Let's slow down on the parts that tripped you up. Re-read the matching section of the " +
      "lesson and the worked example, then try these.",
    points:
      missed.length > 0
        ? missed.map((m) => `Focus on: ${m}`)
        : ["Re-read the lesson's worked example and walk through each step out loud."],
    examples: [
      {
        prompt: "Redo the lesson's worked example without looking at the solution.",
        solution: "Check each step against the lesson once you're done.",
      },
    ],
  };
}

/**
 * The re-teach for a student who has missed this checkpoint twice. Cached in
 * node_remediations; regenerated only with `force`.
 */
export async function getOrCreateRemediation(
  nodeId: string,
  studentUserId: string,
  masjidId: string,
  opts: { force?: boolean } = {},
): Promise<Remediation> {
  const db = getServiceClient();

  if (!opts.force) {
    const { data: existing } = await db
      .from("node_remediations")
      .select("content, missed_concepts, source")
      .eq("student_user_id", studentUserId)
      .eq("pathway_node_id", nodeId)
      .maybeSingle();
    if (existing) {
      return {
        content: existing.content as RemediationContent,
        missedConcepts: (existing.missed_concepts as string[]) ?? [],
        source: (existing.source as "model" | "fallback") ?? "model",
      };
    }
  }

  const node = await getPathwayNode(nodeId, masjidId);
  if (!node) {
    const err = new Error(`pathway node ${nodeId} not found in masjid ${masjidId}`);
    err.name = "NodeNotFoundError";
    throw err;
  }

  const promptById = new Map<string, string>(
    (node.checkpoint_content?.questions ?? []).map((q) => [q.id, q.prompt]),
  );
  const last = await getLatestCheckpointResult(studentUserId, nodeId);
  const answerData = (last?.answer_data ?? {}) as { perQuestion?: QuestionGrade[] };
  const missed = missedPromptsFrom(answerData.perQuestion, promptById);

  const lesson = node.lesson_content;
  let content: RemediationContent;
  let source: "model" | "fallback";
  try {
    await assertWithinAiBudget("remediation", masjidId);
    if (!lesson) throw new Error("no lesson to re-teach from");

    const system =
      "You are re-teaching one 12-year-old the specific ideas they just missed on a " +
      "checkpoint. Short, warm, concrete, using the lesson's own vocabulary. Do NOT give " +
      "the checkpoint answers - re-explain the concepts and show fresh worked examples.";
    const user = [
      `Course: ${node.course.name}. Lesson: "${node.title}".`,
      "",
      `Lesson summary: ${lesson.summary}`,
      "Key terms: " + lesson.key_terms.map((t) => `${t.term} = ${t.definition}`).join("; "),
      "",
      missed.length
        ? `They got these checkpoint questions wrong:\n${missed.map((m) => `- ${m}`).join("\n")}`
        : "They have missed this checkpoint twice; re-teach the whole lesson's core idea.",
      "",
      "Write the focused re-teach.",
    ].join("\n");

    const res = await getAnthropic().messages.parse({
      model: LESSON_MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: zodOutputFormat(RemediationSchema) },
    });
    const body = res.parsed_output;
    if (!body) throw new Error("unparseable remediation output");
    content = body;
    source = "model";
    await logModelCall({
      feature: "remediation",
      masjidId,
      actorUserId: studentUserId,
      model: LESSON_MODEL,
      source: "model",
      usage: res.usage ?? null,
    });
  } catch (err) {
    console.warn("[remediation] falling back:", err instanceof Error ? err.message : err);
    content = fallbackRemediation(missed);
    source = "fallback";
    await logModelCall({
      feature: "remediation",
      masjidId,
      actorUserId: studentUserId,
      model: LESSON_MODEL,
      source: "fallback",
      ok: false,
    });
  }

  await db
    .from("node_remediations")
    .upsert(
      {
        student_user_id: studentUserId,
        pathway_node_id: nodeId,
        missed_concepts: missed,
        content,
        source,
      },
      { onConflict: "student_user_id,pathway_node_id" },
    );
  await db.from("path_events").insert({
    student_user_id: studentUserId,
    pathway_node_id: nodeId,
    kind: "remediation_shown",
    detail: { missedCount: missed.length, source },
  });

  return { content, missedConcepts: missed, source };
}
