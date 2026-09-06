"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { setMasjidStatus } from "@/lib/platform/queries";

export async function setMasjidStatusAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin();
  const masjidId = String(formData.get("masjidId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!masjidId || (status !== "active" && status !== "suspended")) {
    throw new Error("bad status request");
  }
  await setMasjidStatus(masjidId, status);
  revalidatePath("/platform");
  revalidatePath(`/platform/${masjidId}`);
}
