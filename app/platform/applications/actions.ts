"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import {
  approveApplication,
  rejectApplication,
  type ApprovalResult,
} from "@/lib/platform/applications";

export async function approveApplicationAction(
  formData: FormData,
): Promise<{ ok: true; result: ApprovalResult } | { ok: false; error: string }> {
  const user = await requirePlatformAdmin();
  const id = String(formData.get("id") ?? "");
  const defaultLocale = String(formData.get("defaultLocale") ?? "fr");
  const reviewNote = String(formData.get("reviewNote") ?? "");
  try {
    const result = await approveApplication(id, user.id, { defaultLocale, reviewNote });
    revalidatePath("/platform/applications");
    revalidatePath("/platform");
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Approval failed." };
  }
}

export async function rejectApplicationAction(formData: FormData): Promise<void> {
  const user = await requirePlatformAdmin();
  const id = String(formData.get("id") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "");
  await rejectApplication(id, user.id, reviewNote);
  revalidatePath("/platform/applications");
  revalidatePath("/platform");
}
