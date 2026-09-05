"use server";

// Server actions for admin pod management. Reachable by direct POST, so each one
// re-checks the session + admin role and re-scopes to the caller's masjid (see
// Next data-security guidance + .claude/skills/api-design.md).

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/types";
import {
  addStudentToPod,
  removeStudentFromPod,
  setPodVolunteer,
} from "@/lib/db/admin-queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

async function run(
  fn: () => Promise<void>,
  audit?: { user: SessionUser; action: string; targetId: string; metadata?: Record<string, unknown> },
): Promise<ActionResult> {
  try {
    await fn();
    revalidatePath("/admin/pods");
    if (audit) {
      await recordAudit({
        actor: audit.user,
        action: audit.action,
        targetType: "pod",
        targetId: audit.targetId,
        metadata: audit.metadata,
      });
    }
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "action failed";
    return { ok: false, error };
  }
}

export async function assignStudentAction(
  podId: string,
  studentUserId: string,
): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => addStudentToPod(user.masjidId, podId, studentUserId), {
    user,
    action: "pod.student_added",
    targetId: podId,
    metadata: { studentUserId },
  });
}

export async function unassignStudentAction(
  podId: string,
  studentUserId: string,
): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => removeStudentFromPod(user.masjidId, podId, studentUserId), {
    user,
    action: "pod.student_removed",
    targetId: podId,
    metadata: { studentUserId },
  });
}

export async function setVolunteerAction(
  podId: string,
  volunteerId: string | null,
): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => setPodVolunteer(user.masjidId, podId, volunteerId || null), {
    user,
    action: "pod.volunteer_set",
    targetId: podId,
    metadata: { volunteerId: volunteerId || null },
  });
}
