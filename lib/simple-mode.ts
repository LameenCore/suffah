// "Simple mode" resolution (T66). Mirrors lib/i18n: a cookie wins for the
// session; users.simple_mode is the persisted per-student default.

import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export const SIMPLE_COOKIE = "suffa-simple";

/** Is simple mode on for this request? */
export async function resolveSimpleMode(
  user?: Pick<SessionUser, "id"> | null,
): Promise<boolean> {
  const cookieValue = (await cookies()).get(SIMPLE_COOKIE)?.value;
  if (cookieValue === "1") return true;
  if (cookieValue === "0") return false;

  if (user) {
    try {
      const { data } = await getServiceClient()
        .from("users")
        .select("simple_mode")
        .eq("id", user.id)
        .maybeSingle();
      return Boolean(data?.simple_mode);
    } catch {
      // fall through
    }
  }
  return false;
}

/** Set the persisted default for a student (parent/volunteer action). */
export async function setSimpleModeDefault(
  studentUserId: string,
  masjidId: string,
  on: boolean,
): Promise<void> {
  const db = getServiceClient();
  const { data: student } = await db
    .from("users")
    .select("id, masjid_id, role")
    .eq("id", studentUserId)
    .maybeSingle();
  if (!student || student.masjid_id !== masjidId || student.role !== "student") {
    throw new Error("student not found in this masjid");
  }
  const { error } = await db
    .from("users")
    .update({ simple_mode: on })
    .eq("id", studentUserId);
  if (error) throw new Error(`setSimpleModeDefault: ${error.message}`);
}
