"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getChildrenForParent } from "@/lib/db/parent-queries";
import {
  recordConsentDecision,
  ALL_CONSENT_PURPOSE_KEYS,
} from "@/lib/consent";
import { recordAudit } from "@/lib/audit";

/** The child must be linked to this guardian, in this masjid. */
async function assertGuardianOf(childId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "parent") throw new Error("parent role required");
  const children = await getChildrenForParent(user.id, user.masjidId);
  if (!children.some((c) => c.id === childId)) {
    throw new Error("that child is not linked to your account");
  }
  return user;
}

export async function grantConsentAction(formData: FormData): Promise<void> {
  const childId = String(formData.get("childId") ?? "");
  const agreed = formData.get("agree") === "on";
  const user = await assertGuardianOf(childId);
  if (!agreed) throw new Error("Tick the box to give consent.");

  await recordConsentDecision({
    masjidId: user.masjidId,
    studentUserId: childId,
    guardianUserId: user.id,
    granted: true,
    purposes: ALL_CONSENT_PURPOSE_KEYS,
  });
  await recordAudit({
    actor: user,
    action: "consent.granted",
    targetType: "student",
    targetId: childId,
  });
  revalidatePath("/parent/consent");
  revalidatePath("/parent");
}

export async function withdrawConsentAction(formData: FormData): Promise<void> {
  const childId = String(formData.get("childId") ?? "");
  const user = await assertGuardianOf(childId);

  await recordConsentDecision({
    masjidId: user.masjidId,
    studentUserId: childId,
    guardianUserId: user.id,
    granted: false,
    purposes: [],
  });
  await recordAudit({
    actor: user,
    action: "consent.withdrawn",
    targetType: "student",
    targetId: childId,
  });
  revalidatePath("/parent/consent");
  revalidatePath("/parent");
}

export async function setSimpleModeAction(formData: FormData): Promise<void> {
  const childId = String(formData.get("childId") ?? "");
  const on = formData.get("on") === "1";
  const user = await assertGuardianOf(childId);
  const { setSimpleModeDefault } = await import("@/lib/simple-mode");
  await setSimpleModeDefault(childId, user.masjidId, on);
  await recordAudit({
    actor: user,
    action: on ? "student.simple_mode_on" : "student.simple_mode_off",
    targetType: "student",
    targetId: childId,
  });
  revalidatePath("/parent/consent");
}
