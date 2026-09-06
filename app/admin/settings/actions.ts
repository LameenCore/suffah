"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { isLocale } from "@/lib/i18n/config";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

/** Set the masjid-wide default language (masjids.default_locale). */
export async function setMasjidDefaultLocaleAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const locale = String(formData.get("locale") ?? "");
  if (!isLocale(locale)) throw new Error("unknown locale");

  const { error } = await getServiceClient()
    .from("masjids")
    .update({ default_locale: locale })
    .eq("id", user.masjidId);
  if (error) throw new Error(`setMasjidDefaultLocale: ${error.message}`);

  await recordAudit({
    actor: user,
    action: "masjid.default_locale_changed",
    targetType: "masjid",
    targetId: user.masjidId,
    metadata: { locale },
  });

  // Signed-out pages and every member without an explicit choice re-resolve.
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
