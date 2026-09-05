"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { resolveSupportRequest, reopenSupportRequest } from "@/lib/db/support-queries";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

export async function resolveRequestAction(id: string, note: string): Promise<void> {
  const user = await requireAdmin();
  await resolveSupportRequest(id, user.masjidId, note || null);
  await recordAudit({
    actor: user,
    action: "support.resolved",
    targetType: "support_request",
    targetId: id,
  });
  revalidatePath("/admin/inbox");
  revalidatePath("/admin", "layout");
}

export async function reopenRequestAction(id: string): Promise<void> {
  const user = await requireAdmin();
  await reopenSupportRequest(id, user.masjidId);
  await recordAudit({
    actor: user,
    action: "support.reopened",
    targetType: "support_request",
    targetId: id,
  });
  revalidatePath("/admin/inbox");
  revalidatePath("/admin", "layout");
}
