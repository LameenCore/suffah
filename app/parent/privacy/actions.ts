"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { requestDataErasure } from "@/lib/db/privacy-queries";

export async function requestErasureAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "parent") throw new Error("parent role required");

  const reason = String(formData.get("reason") ?? "");
  await requestDataErasure(user, reason);
  revalidatePath("/parent/privacy");
}
