// Platform super-admin gate (T33). Deliberately separate from the per-masjid
// `Role` model: a platform admin provisions masjids and sees cross-masjid
// operational health, and holds NO student-data access.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServiceClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

/** Demo shortcut, mirrors the `suffa-dev-role` pattern. Set to "1" to pass. */
export const PLATFORM_ADMIN_COOKIE = "suffa-platform-admin";

/** True when this user id is in `platform_admins`. */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await getServiceClient()
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * Guard the /platform route group. Redirects to /login with no session, or to
 * "/" for a signed-in user who is not a platform admin. Returns the user.
 */
export async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/platform");

  const devPass = (await cookies()).get(PLATFORM_ADMIN_COOKIE)?.value === "1";
  if (devPass) return user;

  if (!(await isPlatformAdmin(user.id))) redirect("/");
  return user;
}
