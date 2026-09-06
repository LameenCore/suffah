"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  getVolunteerContext,
  listVolunteerPodRefs,
  assertPodCoveredByVolunteer,
} from "@/lib/db/volunteer-portal-queries";
import { createPost, reportPost, getThread } from "@/lib/db/board-queries";

async function ctx() {
  const user = await getCurrentUser();
  if (!user || user.role !== "volunteer") throw new Error("volunteer role required");
  const vc = await getVolunteerContext(user.id, user.masjidId);
  if (!vc) throw new Error("Your account isn't linked to a pod yet.");
  return { user, vc };
}

export async function postAction(form: FormData): Promise<{ error?: string; held?: boolean }> {
  try {
    const { user, vc } = await ctx();
    const podId = String(form.get("podId") ?? "");
    await assertPodCoveredByVolunteer(podId, vc.volunteerId, user.masjidId);
    const threadId = String(form.get("threadId") ?? "") || null;
    const r = await createPost({ user, podId, threadId, body: String(form.get("body") ?? "") });
    return { held: r.held };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not post." };
  }
}

export async function reportAction(form: FormData): Promise<{ error?: string }> {
  try {
    const { user } = await ctx();
    await reportPost(String(form.get("postId") ?? ""), user, String(form.get("reason") ?? ""));
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not report." };
  }
}

export async function loadThreadAction(threadId: string) {
  const { user, vc } = await ctx();
  const pods = await listVolunteerPodRefs(vc.volunteerId, user.masjidId);
  for (const p of pods) {
    const th = await getThread(threadId, p.id, user);
    if (th) return th;
  }
  return null;
}
