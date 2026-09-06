"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  setQuestionOverride,
  type QuestionSourceKind,
} from "@/lib/db/question-bank-queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function setQuestionDisabledAction(
  sourceKind: QuestionSourceKind,
  sourceId: string,
  questionId: string,
  disabled: boolean,
  note: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not signed in" };
  if (user.role !== "admin") return { ok: false, error: "admin role required" };

  try {
    await setQuestionOverride(user.masjidId, sourceKind, sourceId, questionId, {
      disabled,
      note: note.trim() || null,
    });
    await recordAudit({
      actor: user,
      action: disabled ? "question.disabled" : "question.enabled",
      targetType: sourceKind,
      targetId: sourceId,
      metadata: { questionId },
    });
    revalidatePath("/admin/question-bank");
    revalidatePath("/student", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "could not save" };
  }
}
