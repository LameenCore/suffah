"use server";

// Server actions for the student playground. Reachable by direct POST, so each
// one re-checks the session and role (see Next's data-security guidance).

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { assertAiRateLimit } from "@/lib/ratelimit";
import { markLessonComplete, isLessonComplete } from "@/lib/db/queries";
import { generateLessonForNode } from "@/lib/ai/lesson";
import {
  generateCheckpointForNode,
  gradeCheckpoint,
  type CheckpointGrade,
} from "@/lib/ai/checkpoint";
import { generateTermExam, gradeTermExam, type TermExamGrade } from "@/lib/ai/term-exam";
import { DEMO_TERM_LABEL } from "@/lib/types";

async function requireStudent() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "student") throw new Error("student role required");
  return user;
}

/** Mark the current lesson node complete for the signed-in student. */
export async function completeLessonAction(nodeId: string): Promise<void> {
  const user = await requireStudent();
  await markLessonComplete(user.id, nodeId, user.masjidId);
  revalidatePath("/student", "layout");
}

/**
 * Ensure a lesson exists for a node (generate + persist if missing). Used by the
 * playground when a pod reaches a node whose lesson wasn't pre-generated.
 */
export async function ensureLessonAction(
  nodeId: string,
): Promise<{ source: "existing" | "model" | "fallback" }> {
  const user = await requireStudent();
  assertAiRateLimit("lesson", user);
  const result = await generateLessonForNode(nodeId, user.masjidId, { actorUserId: user.id });
  revalidatePath("/student", "layout");
  return { source: result.source };
}

/** Prepare the checkpoint for a node - only after its lesson is marked complete. */
export async function startCheckpointAction(
  nodeId: string,
): Promise<{ source: "existing" | "model" | "fallback" }> {
  const user = await requireStudent();
  if (!(await isLessonComplete(user.id, nodeId))) {
    throw new Error("finish the lesson before starting the checkpoint");
  }
  assertAiRateLimit("checkpoint", user);
  const result = await generateCheckpointForNode(nodeId, user.masjidId, { actorUserId: user.id });
  revalidatePath("/student", "layout");
  return { source: result.source };
}

/**
 * Grade a submitted checkpoint. Persists the attempt and advances the pod on a
 * pass. Deliberately does NOT revalidate — the Checkpoint component shows the
 * result (and, on a pass, a "go to next lesson" button that refreshes). Forcing
 * a re-render here would replace that result before the student sees it.
 */
export async function submitCheckpointAction(
  nodeId: string,
  answers: Record<string, string>,
): Promise<CheckpointGrade> {
  const user = await requireStudent();
  if (!(await isLessonComplete(user.id, nodeId))) {
    throw new Error("finish the lesson before submitting the checkpoint");
  }
  return gradeCheckpoint(nodeId, user.id, user.masjidId, answers);
}

/** Prepare the term exam for a course (generate + persist if missing). */
export async function startTermExamAction(courseId: string): Promise<{ source: string }> {
  const user = await requireStudent();
  assertAiRateLimit("term_exam", user);
  const r = await generateTermExam(courseId, DEMO_TERM_LABEL, user.masjidId, {
    actorUserId: user.id,
  });
  revalidatePath("/student", "layout");
  return { source: r.source };
}

/**
 * Grade a submitted term exam. Records the attempt to term_exam_results. Like the
 * checkpoint, no revalidate — the TermExam component renders the result itself.
 */
export async function submitTermExamAction(
  courseId: string,
  answers: Record<string, string>,
): Promise<TermExamGrade> {
  const user = await requireStudent();
  return gradeTermExam(courseId, DEMO_TERM_LABEL, user.id, user.masjidId, answers);
}
