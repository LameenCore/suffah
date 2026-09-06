"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/db";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Set the whole-app locale: cookie now + persisted to the user for next time. */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR,
    sameSite: "lax",
    path: "/",
  });

  try {
    const user = await getCurrentUser();
    if (user) {
      await getServiceClient().from("users").update({ locale }).eq("id", user.id);
    }
  } catch {
    // cookie is enough for the session; persistence is best-effort
  }

  revalidatePath("/", "layout");
}
