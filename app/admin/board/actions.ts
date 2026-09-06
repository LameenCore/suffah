"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { moderatePost } from "@/lib/db/board-queries";

export async function moderateAction(form: FormData): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") throw new Error("admin role required");
    const action = String(form.get("action") ?? "");
    if (action !== "release" && action !== "hide") throw new Error("bad action");
    await moderatePost(String(form.get("postId") ?? ""), user, action);
    revalidatePath("/admin/board");
    revalidatePath("/admin", "layout");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not moderate." };
  }
}
