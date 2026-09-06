// Spaced-repetition review deck (T44).
//
// Items are individual checkpoint questions from nodes the student has already
// passed. Scheduling is a trimmed SM-2: correct answers push the next review
// out geometrically; a miss resets the interval to 1 day and nudges ease down.
// Grading is the same objective grader as checkpoints (no rubric).

import { getServiceClient } from "@/lib/db";
import { unwrapRelation as rel } from "@/lib/db/rel";
import { gradeQuestion, type Question, type QuestionForStudent } from "@/lib/ai/questions";
import type { CheckpointContent } from "@/lib/ai/checkpoint";

const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;
const NEW_ITEMS_PER_SEED_RUN = 12; // cap so a big backlog doesn't flood day one

export interface ReviewSchedule {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: string;
}

/** Pure SM-2 step. `correct` = the objective grade for this attempt. */
export function scheduleNext(
  prev: { ease: number; intervalDays: number; reps: number; lapses: number },
  correct: boolean,
  now = Date.now(),
): ReviewSchedule {
  let { ease, reps, lapses } = prev;
  let intervalDays: number;

  if (correct) {
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 3;
    else intervalDays = Math.round(prev.intervalDays * ease);
    ease = Math.min(2.8, ease + 0.05);
  } else {
    reps = 0;
    lapses += 1;
    intervalDays = 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
  }

  return {
    ease: Math.round(ease * 100) / 100,
    intervalDays,
    reps,
    lapses,
    dueAt: new Date(now + intervalDays * DAY_MS).toISOString(),
  };
}

interface NodeRow {
  id: string;
  title: string;
  checkpoint_content: CheckpointContent | null;
  course: { id: string; name: string; masjid_id: string } | null;
}

async function passedNodesWithCheckpoints(
  studentUserId: string,
  masjidId: string,
): Promise<Array<{ node: NodeRow; questions: Question[] }>> {
  const db = getServiceClient();
  const { data: results, error } = await db
    .from("checkpoint_results")
    .select("pathway_node_id, passed")
    .eq("student_user_id", studentUserId);
  if (error) throw new Error(`review: ${error.message}`);

  const passedIds = [
    ...new Set(
      (results ?? [])
        .filter((r) => r.passed === true)
        .map((r) => r.pathway_node_id as string),
    ),
  ];
  if (passedIds.length === 0) return [];

  const { data: nodes, error: nErr } = await db
    .from("pathway_nodes")
    .select("id, title, checkpoint_content, course:courses!inner ( id, name, masjid_id )")
    .in("id", passedIds);
  if (nErr) throw new Error(`review: ${nErr.message}`);

  const out: Array<{ node: NodeRow; questions: Question[] }> = [];
  for (const raw of (nodes ?? []) as unknown as Record<string, unknown>[]) {
    const course = rel(raw.course as unknown) as NodeRow["course"];
    if (!course || course.masjid_id !== masjidId) continue;
    const content = (raw.checkpoint_content as CheckpointContent | null) ?? null;
    if (!content?.questions?.length) continue;
    out.push({
      node: {
        id: raw.id as string,
        title: raw.title as string,
        checkpoint_content: content,
        course,
      },
      questions: content.questions,
    });
  }
  return out;
}

/**
 * Ensure a review_item exists for every question in every passed checkpoint.
 * New items are spread over the next few days so the first session is small.
 * Returns how many were created.
 */
export async function seedReviewItems(
  studentUserId: string,
  masjidId: string,
): Promise<number> {
  const db = getServiceClient();
  const passed = await passedNodesWithCheckpoints(studentUserId, masjidId);
  if (passed.length === 0) return 0;

  const { data: existing, error } = await db
    .from("review_items")
    .select("pathway_node_id, question_id")
    .eq("student_user_id", studentUserId);
  if (error) throw new Error(`seedReviewItems: ${error.message}`);
  const have = new Set(
    (existing ?? []).map((r) => `${r.pathway_node_id as string}:${r.question_id as string}`),
  );

  const toInsert: Record<string, unknown>[] = [];
  for (const { node, questions } of passed) {
    for (const q of questions) {
      const key = `${node.id}:${q.id}`;
      if (have.has(key)) continue;
      toInsert.push({
        student_user_id: studentUserId,
        pathway_node_id: node.id,
        question_id: q.id,
      });
    }
  }
  if (toInsert.length === 0) return 0;

  const batch = toInsert.slice(0, NEW_ITEMS_PER_SEED_RUN).map((row, i) => ({
    ...row,
    // stagger: item i due in floor(i/3) days
    due_at: new Date(Date.now() + Math.floor(i / 3) * DAY_MS).toISOString(),
  }));
  const { error: insErr } = await db.from("review_items").insert(batch);
  if (insErr) throw new Error(`seedReviewItems: ${insErr.message}`);
  return batch.length;
}

export interface ReviewCard {
  itemId: string;
  nodeId: string;
  nodeTitle: string;
  courseName: string;
  question: QuestionForStudent;
}

/** Due cards for the student, oldest-due first. Seeds new items first. */
export async function getReviewDeck(
  studentUserId: string,
  masjidId: string,
  limit = 8,
): Promise<ReviewCard[]> {
  await seedReviewItems(studentUserId, masjidId);
  const db = getServiceClient();

  const { data: due, error } = await db
    .from("review_items")
    .select("id, pathway_node_id, question_id, due_at")
    .eq("student_user_id", studentUserId)
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`getReviewDeck: ${error.message}`);
  if (!due || due.length === 0) return [];

  const passed = await passedNodesWithCheckpoints(studentUserId, masjidId);
  const byNode = new Map(passed.map((p) => [p.node.id, p]));

  const cards: ReviewCard[] = [];
  for (const item of due) {
    const nodeId = item.pathway_node_id as string;
    const p = byNode.get(nodeId);
    if (!p) continue;
    const q = p.questions.find((x) => x.id === (item.question_id as string));
    if (!q) continue;
    cards.push({
      itemId: item.id as string,
      nodeId,
      nodeTitle: p.node.title,
      courseName: p.node.course?.name ?? "",
      question:
        q.type === "mcq"
          ? { id: q.id, type: "mcq", prompt: q.prompt, options: q.options }
          : { id: q.id, type: "short", prompt: q.prompt },
    });
  }
  return cards;
}

export interface ReviewResult {
  reviewed: number;
  correct: number;
  perItem: Array<{ itemId: string; correct: boolean; correctAnswer: string; explanation: string }>;
}

/** Grade a submitted review and reschedule each item. answers keyed by itemId. */
export async function submitReview(
  studentUserId: string,
  masjidId: string,
  answers: Record<string, string>,
): Promise<ReviewResult> {
  const db = getServiceClient();
  const itemIds = Object.keys(answers);
  if (itemIds.length === 0) return { reviewed: 0, correct: 0, perItem: [] };

  const { data: items, error } = await db
    .from("review_items")
    .select("id, pathway_node_id, question_id, ease, interval_days, reps, lapses")
    .eq("student_user_id", studentUserId)
    .in("id", itemIds);
  if (error) throw new Error(`submitReview: ${error.message}`);

  const passed = await passedNodesWithCheckpoints(studentUserId, masjidId);
  const byNode = new Map(passed.map((p) => [p.node.id, p]));

  const perItem: ReviewResult["perItem"] = [];
  let correct = 0;
  const now = Date.now();

  for (const item of items ?? []) {
    const p = byNode.get(item.pathway_node_id as string);
    const q = p?.questions.find((x) => x.id === (item.question_id as string));
    if (!q) continue;

    const grade = gradeQuestion(q, answers[item.id as string]);
    if (grade.correct) correct += 1;

    const next = scheduleNext(
      {
        ease: Number(item.ease),
        intervalDays: Number(item.interval_days),
        reps: Number(item.reps),
        lapses: Number(item.lapses),
      },
      grade.correct,
      now,
    );
    await db
      .from("review_items")
      .update({
        ease: next.ease,
        interval_days: next.intervalDays,
        reps: next.reps,
        lapses: next.lapses,
        due_at: next.dueAt,
        last_reviewed_at: new Date(now).toISOString(),
        last_correct: grade.correct,
      })
      .eq("id", item.id as string)
      .eq("student_user_id", studentUserId);

    perItem.push({
      itemId: item.id as string,
      correct: grade.correct,
      correctAnswer: grade.correctAnswer,
      explanation: grade.explanation,
    });
  }

  return { reviewed: perItem.length, correct, perItem };
}

export interface RetentionSignal {
  totalItems: number;
  dueNow: number;
  reviewedLast7: number;
  accuracyLast7: number | null; // 0..1 over items last reviewed in the last 7 days
}

/** Retention snapshot for the continuity briefing + compliance status. */
export async function getRetentionSignal(
  studentUserId: string,
  masjidId: string,
): Promise<RetentionSignal> {
  const db = getServiceClient();

  const { data: student } = await db
    .from("users")
    .select("masjid_id")
    .eq("id", studentUserId)
    .maybeSingle();
  if (!student || student.masjid_id !== masjidId) {
    return { totalItems: 0, dueNow: 0, reviewedLast7: 0, accuracyLast7: null };
  }

  const { data, error } = await db
    .from("review_items")
    .select("due_at, last_reviewed_at, last_correct")
    .eq("student_user_id", studentUserId);
  if (error) throw new Error(`getRetentionSignal: ${error.message}`);

  const rows = (data ?? []) as {
    due_at: string;
    last_reviewed_at: string | null;
    last_correct: boolean | null;
  }[];
  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;

  let dueNow = 0;
  const recent: boolean[] = [];
  for (const r of rows) {
    if (new Date(r.due_at).getTime() <= now) dueNow += 1;
    if (r.last_reviewed_at && new Date(r.last_reviewed_at).getTime() >= weekAgo) {
      recent.push(r.last_correct === true);
    }
  }
  return {
    totalItems: rows.length,
    dueNow,
    reviewedLast7: recent.length,
    accuracyLast7: recent.length ? recent.filter(Boolean).length / recent.length : null,
  };
}
