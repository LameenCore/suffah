"use server";

// Server actions for the volunteer portal (T32). Reachable by direct POST, so
// each re-checks the volunteer session AND that the target pod is one this
// volunteer actually covers (delegated access).

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { addPodSessionNote } from "@/lib/db/continuity-queries";
import { addBarakahNote } from "@/lib/db/barakah-queries";
import {
  getVolunteerContext,
  assertPodCoveredByVolunteer,
} from "@/lib/db/volunteer-portal-queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function requireLinkedVolunteer(podId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "volunteer") throw new Error("volunteer role required");
  const ctx = await getVolunteerContext(user.id, user.masjidId);
  if (!ctx) throw new Error("your account is not linked to a volunteer record yet");
  await assertPodCoveredByVolunteer(podId, ctx.volunteerId, user.masjidId);
  return { user, ctx };
}

export async function addVolunteerSessionNoteAction(
  podId: string,
  note: string,
  courseId: string | null,
): Promise<ActionResult> {
  try {
    const { user } = await requireLinkedVolunteer(podId);
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
      metadata: { by: "volunteer" },
    });
    revalidatePath("/volunteer");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "action failed" };
  }
}

export async function addVolunteerBarakahNoteAction(
  formData: FormData,
): Promise<ActionResult> {
  const podId = String(formData.get("podId") ?? "");
  try {
    const { user } = await requireLinkedVolunteer(podId);
    await addBarakahNote(user.masjidId, {
      podId,
      studentUserId: String(formData.get("studentUserId") ?? "") || null,
      indicator: String(formData.get("indicator") ?? ""),
      note: String(formData.get("note") ?? ""),
      recordedBy: user.name,
    });
    await recordAudit({
      actor: user,
      action: "barakah.note_added",
      targetType: "pod",
      targetId: podId,
      metadata: { by: "volunteer" },
    });
    revalidatePath("/volunteer");
    revalidatePath("/parent");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "action failed" };
  }
}
