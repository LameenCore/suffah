"use server";

// Server actions for volunteer onboarding + churn (T15). Reachable by direct
// POST — every action re-checks the admin session and re-scopes to the caller's
// masjid.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  addVolunteer,
  recordDeparture,
  reinstateVolunteer,
  setVolunteerStatus,
} from "@/lib/db/volunteer-queries";
import type { VolunteerStatus } from "@/lib/types";

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

async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    revalidatePath("/admin/volunteers");
    revalidatePath("/admin/pods");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "action failed" };
  }
}

export async function addVolunteerAction(formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const name = String(formData.get("name") ?? "");
  const certificationNote = String(formData.get("certificationNote") ?? "");
  return run(() => addVolunteer(user.masjidId, { name, certificationNote }));
}

const VALID_STATUS: VolunteerStatus[] = ["active", "inactive", "pending_vetting"];

export async function setVolunteerStatusAction(
  id: string,
  status: VolunteerStatus,
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!VALID_STATUS.includes(status)) return { ok: false, error: "invalid status" };
  return run(() => setVolunteerStatus(user.masjidId, id, status));
}

export async function recordDepartureAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => recordDeparture(user.masjidId, id));
}

export async function reinstateVolunteerAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  return run(() => reinstateVolunteer(user.masjidId, id));
}
