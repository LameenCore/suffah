"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSupportRequest, type SupportCategory } from "@/lib/db/support-queries";

export async function submitSupportAction(input: {
  category: string;
  subject: string;
  body: string;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  const category: SupportCategory =
    input.category === "bug" || input.category === "idea" ? input.category : "question";
  await createSupportRequest(user, { category, subject: input.subject, body: input.body });
  revalidatePath("/help");
}
