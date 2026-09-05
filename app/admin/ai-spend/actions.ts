"use server";

// Server action for the AI-spend budget form (T56). Admin only, masjid-scoped.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { setAiBudget } from "@/lib/ai/budget";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function setBudgetAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not signed in" };
  if (user.role !== "admin") return { ok: false, error: "admin role required" };

  const limit = Number(formData.get("monthlyLimitUsd"));
  const alertPct = Number(formData.get("softAlertPercent"));
  const hardCap = formData.get("hardCapEnabled") === "on";

  if (!Number.isFinite(limit) || limit <= 0) {
    return { ok: false, error: "monthly limit must be a positive number" };
  }
  if (!Number.isFinite(alertPct) || alertPct < 1 || alertPct > 100) {
    return { ok: false, error: "alert threshold must be 1-100%" };
  }

  try {
    await setAiBudget(user.masjidId, {
      monthlyLimitUsd: Math.round(limit * 100) / 100,
      softAlertRatio: alertPct / 100,
      hardCapEnabled: hardCap,
    });
    await recordAudit({
      actor: user,
      action: "ai_budget.updated",
      targetType: "masjid",
      targetId: user.masjidId,
      metadata: { monthlyLimitUsd: limit, softAlertPercent: alertPct, hardCap },
    });
    revalidatePath("/admin/ai-spend");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "could not save" };
  }
}
