"use server";

// Server actions for the student playground. Reachable by direct POST, so each
// one re-checks the session and role (see Next's data-security guidance).

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { markLessonComplete } from "@/lib/db/queries";
import { generateLessonForNode } from "@/lib/ai/lesson";

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
  const result = await generateLessonForNode(nodeId, user.masjidId);
  revalidatePath("/student", "layout");
  return { source: result.source };
}
