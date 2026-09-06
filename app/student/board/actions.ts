"use server";

import { getCurrentUser } from "@/lib/auth";
import { getPodForStudent } from "@/lib/db/queries";
import { createPost, reportPost, getThread } from "@/lib/db/board-queries";

async function studentPod() {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") throw new Error("student role required");
  const pod = await getPodForStudent(user.id, user.masjidId);
  if (!pod) throw new Error("You're not in a pod yet.");
  return { user, pod };
}

export async function postAction(form: FormData): Promise<{ error?: string; held?: boolean }> {
  try {
    const { user, pod } = await studentPod();
    const podId = String(form.get("podId") ?? "");
    if (podId !== pod.id) return { error: "wrong pod" };
    const threadId = String(form.get("threadId") ?? "") || null;
    const r = await createPost({ user, podId: pod.id, threadId, body: String(form.get("body") ?? "") });
    return { held: r.held };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not post." };
  }
}

export async function reportAction(form: FormData): Promise<{ error?: string }> {
  try {
    const { user } = await studentPod();
    await reportPost(String(form.get("postId") ?? ""), user, String(form.get("reason") ?? ""));
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not report." };
  }
}

export async function loadThreadAction(threadId: string) {
  const { user, pod } = await studentPod();
  return getThread(threadId, pod.id, user);
}
