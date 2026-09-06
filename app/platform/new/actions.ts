"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { provisionMasjid } from "@/lib/platform/provision";

export async function provisionMasjidAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin();

  const input = {
    name: String(formData.get("name") ?? ""),
    defaultLocale: String(formData.get("defaultLocale") ?? "en"),
    adminName: String(formData.get("adminName") ?? ""),
    adminEmail: String(formData.get("adminEmail") ?? ""),
    adminPassword: String(formData.get("adminPassword") ?? ""),
  };

  let masjidId: string;
  try {
    ({ masjidId } = await provisionMasjid(input));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "provisioning failed";
    redirect(`/platform/new?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/platform");
  redirect(`/platform/${masjidId}?provisioned=1`);
}
