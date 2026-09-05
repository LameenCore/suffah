"use server";

// Server actions for the Continuity Fingerprint view. Reachable by direct POST,
// so each re-checks the admin session.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { addPodSessionNote } from "@/lib/db/continuity-queries";
import { generatePodBriefing, type PodBriefing } from "@/lib/ai/continuity";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

export async function generateBriefingAction(
  podId: string,
): Promise<{ briefing: PodBriefing; source: string; generatedAt: string }> {
  const user = await requireAdmin();
  const result = await generatePodBriefing(podId, user.masjidId, { actorUserId: user.id });
  await recordAudit({
    actor: user,
    action: "continuity.briefing_generated",
    targetType: "pod",
    targetId: podId,
    metadata: { source: result.source },
  });
  revalidatePath("/admin/continuity");
  return { briefing: result.briefing, source: result.source, generatedAt: result.generatedAt };
}

export async function addSessionNoteAction(
  podId: string,
  note: string,
  courseId: string | null,
): Promise<void> {
  const user = await requireAdmin();
  await addPodSessionNote(podId, user.masjidId, {
    note,
    authorKind: "volunteer",
    authorName: user.name,
    courseId: courseId ?? null,
  });
  await recordAudit({
    actor: user,
    action: "continuity.session_note_added",
    targetType: "pod",
    targetId: podId,
  });
  revalidatePath("/admin/continuity");
}
