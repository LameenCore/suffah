// Question bank (T51): flatten the questions buried in checkpoint/assessment/exam
// JSON, attach per-question admin overrides + item analytics.

import { getServiceClient } from "@/lib/db";
import { computeItemStats, type GradedAttempt, type ItemStats } from "@/lib/analytics/item-analytics";
import type { CheckpointContent } from "@/lib/ai/checkpoint";

export type QuestionSourceKind = "checkpoint" | "unit" | "term";

export interface BankQuestion {
  sourceKind: QuestionSourceKind;
  sourceId: string;
  sourceTitle: string;
  courseName: string;
  questionId: string;
  type: "mcq" | "short";
  prompt: string;
  /** Admin sees the key. */
  answer: string;
  disabled: boolean;
  note: string | null;
  stats: ItemStats | null;
}

function rel<T>(v: T | T[] | null | undefined): T | null {
  return v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v;
}

interface OverrideRow {
  source_kind: string;
  source_id: string;
  question_id: string;
  disabled: boolean;
  note: string | null;
}

async function loadOverrides(masjidId: string): Promise<Map<string, OverrideRow>> {
  const { data, error } = await getServiceClient()
    .from("question_overrides")
    .select("source_kind, source_id, question_id, disabled, note")
    .eq("masjid_id", masjidId);
  if (error) throw new Error(`loadOverrides: ${error.message}`);
  const m = new Map<string, OverrideRow>();
  for (const r of (data ?? []) as OverrideRow[]) {
    m.set(`${r.source_kind}:${r.source_id}:${r.question_id}`, r);
  }
  return m;
}

/** Attempts per checkpoint node, from checkpoint_results.answer_data. */
async function loadCheckpointAttempts(
  nodeIds: string[],
): Promise<Map<string, GradedAttempt[]>> {
  if (nodeIds.length === 0) return new Map();
  const { data, error } = await getServiceClient()
    .from("checkpoint_results")
    .select("pathway_node_id, answer_data")
    .in("pathway_node_id", nodeIds);
  if (error) throw new Error(`loadCheckpointAttempts: ${error.message}`);

  const byNode = new Map<string, GradedAttempt[]>();
  for (const r of data ?? []) {
    const nid = r.pathway_node_id as string;
    const ad = (r.answer_data ?? {}) as {
      score?: number;
      perQuestion?: { id: string; correct: boolean }[];
    };
    if (!ad.perQuestion?.length) continue;
    const list = byNode.get(nid) ?? [];
    list.push({
      score: typeof ad.score === "number" ? ad.score : 0,
      perQuestion: ad.perQuestion.map((q) => ({ id: q.id, correct: q.correct === true })),
    });
    byNode.set(nid, list);
  }
  return byNode;
}

export interface QuestionBankCourse {
  courseId: string;
  courseName: string;
  questions: BankQuestion[];
}

/** The whole bank, grouped by course. Currently covers checkpoint questions. */
export async function listQuestionBank(masjidId: string): Promise<QuestionBankCourse[]> {
  const db = getServiceClient();
  const { data: nodeRows, error } = await db
    .from("pathway_nodes")
    .select("id, title, sequence_order, checkpoint_content, course:courses!inner ( id, name, masjid_id )")
    .order("sequence_order", { ascending: true });
  if (error) throw new Error(`listQuestionBank: ${error.message}`);

  const overrides = await loadOverrides(masjidId);

  const nodes = ((nodeRows ?? []) as unknown as Record<string, unknown>[])
    .map((raw) => {
      const course = rel(raw.course as unknown) as
        | { id: string; name: string; masjid_id: string }
        | null;
      return { raw, course };
    })
    .filter((x) => x.course && x.course.masjid_id === masjidId);

  const attemptsByNode = await loadCheckpointAttempts(nodes.map((n) => n.raw.id as string));
  const statsByNode = new Map<string, Map<string, ItemStats>>();
  for (const [nid, attempts] of attemptsByNode) {
    statsByNode.set(nid, new Map(computeItemStats(attempts).map((s) => [s.questionId, s])));
  }

  const byCourse = new Map<string, QuestionBankCourse>();
  for (const { raw, course } of nodes) {
    const content = (raw.checkpoint_content as CheckpointContent | null) ?? null;
    if (!content?.questions?.length) continue;
    const nodeId = raw.id as string;
    const nodeTitle = raw.title as string;
    const c =
      byCourse.get(course!.id) ??
      ({ courseId: course!.id, courseName: course!.name, questions: [] } as QuestionBankCourse);

    for (const q of content.questions) {
      const ov = overrides.get(`checkpoint:${nodeId}:${q.id}`);
      c.questions.push({
        sourceKind: "checkpoint",
        sourceId: nodeId,
        sourceTitle: nodeTitle,
        courseName: course!.name,
        questionId: q.id,
        type: q.type,
        prompt: q.prompt,
        answer: q.type === "mcq" ? q.options[q.answerIndex] : q.answer,
        disabled: ov?.disabled ?? false,
        note: ov?.note ?? null,
        stats: statsByNode.get(nodeId)?.get(q.id) ?? null,
      });
    }
    byCourse.set(course!.id, c);
  }
  return [...byCourse.values()];
}

/** Set / clear the override for one question. */
export async function setQuestionOverride(
  masjidId: string,
  sourceKind: QuestionSourceKind,
  sourceId: string,
  questionId: string,
  patch: { disabled?: boolean; note?: string | null },
): Promise<void> {
  const db = getServiceClient();

  // Tenancy: the source must belong to this masjid (checkpoint = a pathway node).
  if (sourceKind === "checkpoint") {
    const { data } = await db
      .from("pathway_nodes")
      .select("id, course:courses!inner ( masjid_id )")
      .eq("id", sourceId)
      .maybeSingle();
    const course = rel(data?.course as unknown) as { masjid_id: string } | null;
    if (!course || course.masjid_id !== masjidId) {
      throw new Error("question source not found in this masjid");
    }
  }

  const { error } = await db.from("question_overrides").upsert(
    {
      masjid_id: masjidId,
      source_kind: sourceKind,
      source_id: sourceId,
      question_id: questionId,
      disabled: patch.disabled ?? false,
      note: patch.note ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "masjid_id,source_kind,source_id,question_id" },
  );
  if (error) throw new Error(`setQuestionOverride: ${error.message}`);
}

/** Disabled checkpoint question ids for one node - the grader + student view skip these. */
export async function getDisabledCheckpointQuestionIds(
  nodeId: string,
  masjidId: string,
): Promise<Set<string>> {
  const { data, error } = await getServiceClient()
    .from("question_overrides")
    .select("question_id")
    .eq("masjid_id", masjidId)
    .eq("source_kind", "checkpoint")
    .eq("source_id", nodeId)
    .eq("disabled", true);
  if (error) throw new Error(`getDisabledCheckpointQuestionIds: ${error.message}`);
  return new Set((data ?? []).map((r) => r.question_id as string));
}
