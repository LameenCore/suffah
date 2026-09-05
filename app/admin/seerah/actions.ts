"use server";

// Server actions for Seerah community knowledge sourcing (T22). Admin/scholar
// view. Each action re-checks the session + admin role and re-scopes to the
// caller's masjid.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { addContribution } from "@/lib/db/contribution-queries";
import { incorporateContributions } from "@/lib/ai/lesson-revision";

export interface ActionResult {
  ok: boolean;
  error?: string;
  version?: number;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

export async function addContributionAction(formData: FormData): Promise<ActionResult> {
  let user;
  try {
    user = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "not permitted" };
  }

  const nodeId = String(formData.get("nodeId") ?? "");
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!nodeId) return { ok: false, error: "missing node" };

  try {
    await addContribution(user.masjidId, nodeId, { name, role, note });
    revalidatePath("/admin/seerah");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "action failed" };
  }
}

export async function incorporateAction(nodeId: string): Promise<ActionResult> {
  let user;
  try {
    user = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "not permitted" };
  }

  try {
    const res = await incorporateContributions(nodeId, user.masjidId);
    revalidatePath("/admin/seerah");
    revalidatePath("/student", "layout");
    return { ok: true, version: res.version };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "action failed" };
  }
}
