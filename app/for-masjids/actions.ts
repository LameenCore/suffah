"use server";

import { redirect } from "next/navigation";
import { submitMasjidApplication } from "@/lib/platform/applications";

export async function submitApplicationAction(formData: FormData): Promise<void> {
  const masjidName = String(formData.get("masjidName") ?? "");
  const contactName = String(formData.get("contactName") ?? "");
  const contactEmail = String(formData.get("contactEmail") ?? "");
  const city = String(formData.get("city") ?? "");
  const note = String(formData.get("note") ?? "");

  try {
    await submitMasjidApplication({ masjidName, contactName, contactEmail, city, note });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not submit the application.";
    redirect("/for-masjids?error=" + encodeURIComponent(msg));
  }
  redirect("/for-masjids?submitted=1");
}
