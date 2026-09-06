"use server";

// Server actions for volunteer onboarding + churn (T15). Reachable by direct
// POST - every action re-checks the admin session and re-scopes to the caller's
// masjid.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  addVolunteer,
  linkVolunteerLogin,
  recordDeparture,
  reinstateVolunteer,
  setVolunteerStatus,
  unlinkVolunteerLogin,
} from "@/lib/db/volunteer-queries";
import type { SessionUser, VolunteerStatus } from "@/lib/types";

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
  audit?: { user: SessionUser; action: string; targetId?: string; metadata?: Record<string, unknown> },
): Promise<ActionResult> {
  try {
    await fn();
    revalidatePath("/admin/volunteers");
    revalidatePath("/admin/pods");
    if (audit) {
      await recordAudit({
        actor: audit.user,
        action: audit.action,
        targetType: "volunteer",
        targetId: audit.targetId,
        metadata: audit.metadata,
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "action failed" };
  }
}

export async function addVolunteerAction(formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const name = String(formData.get("name") ?? "");
  const certificationNote = String(formData.get("certificationNote") ?? "");
  return run(() => addVolunteer(user.masjidId, { name, certificationNote }), {
    user,
    action: "volunteer.added",
  });
}

const VALID_STATUS: VolunteerStatus[] = ["active", "inactive", "pending_vetting"];

export async function setVolunteerStatusAction(
  id: string,
  status: VolunteerStatus,
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!VALID_STATUS.includes(status)) return { ok: false, error: "invalid status" };
  return run(() => setVolunteerStatus(user.masjidId, id, status), {
    user,
    action: "volunteer.status_changed",
    targetId: id,
    metadata: { status },
  });
}

export async function recordDepartureAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => recordDeparture(user.masjidId, id), {
    user,
    action: "volunteer.departure",
    targetId: id,
  });
}

export async function reinstateVolunteerAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => reinstateVolunteer(user.masjidId, id), {
    user,
    action: "volunteer.reinstated",
    targetId: id,
  });
}

export async function linkVolunteerLoginAction(
  id: string,
  email: string,
): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => linkVolunteerLogin(user.masjidId, id, email), {
    user,
    action: "volunteer.login_linked",
    targetId: id,
  });
}

export async function unlinkVolunteerLoginAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => unlinkVolunteerLogin(user.masjidId, id), {
    user,
    action: "volunteer.login_unlinked",
    targetId: id,
  });
}
