"use server";

// Server action for recording a barakah note (T23). Admin/volunteer check-in.
// Re-checks the session + role on every call.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { addBarakahNote } from "@/lib/db/barakah-queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function addBarakahNoteAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not signed in" };
  if (user.role !== "admin") return { ok: false, error: "admin role required" };

  const podId = String(formData.get("podId") ?? "");
  const studentRaw = String(formData.get("studentUserId") ?? "");
  const indicator = String(formData.get("indicator") ?? "");
  const note = String(formData.get("note") ?? "");
  const recordedBy = String(formData.get("recordedBy") ?? "");

  if (!podId) return { ok: false, error: "choose a pod" };

  try {
    await addBarakahNote(user.masjidId, {
      podId,
      studentUserId: studentRaw || null,
      indicator,
      note,
      recordedBy,
    });
    revalidatePath("/admin/barakah");
    revalidatePath("/parent");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "action failed" };
  }
}
