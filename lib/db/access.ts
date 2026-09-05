// Shared relationship-level access checks (beyond role + masjid).

import { getServiceClient } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

/**
 * True if `user` may see records for `studentUserId`:
 * - an admin in the same masjid, or
 * - a parent linked to that student (parent_children), same masjid.
 */
export async function canViewStudent(
  user: Pick<SessionUser, "id" | "role" | "masjidId">,
  studentUserId: string,
): Promise<boolean> {
  const db = getServiceClient();

  const { data: student, error } = await db
    .from("users")
    .select("id, role, masjid_id")
    .eq("id", studentUserId)
    .maybeSingle();
  if (error) throw new Error(`canViewStudent: ${error.message}`);
  if (!student || student.role !== "student" || student.masjid_id !== user.masjidId) {
    return false;
  }

  if (user.role === "admin") return true;

  if (user.role === "parent") {
    const { data: link, error: lErr } = await db
      .from("parent_children")
      .select("parent_user_id")
      .eq("parent_user_id", user.id)
      .eq("student_user_id", studentUserId)
      .maybeSingle();
    if (lErr) throw new Error(`canViewStudent: ${lErr.message}`);
    return !!link;
  }

  return false;
}

/** Throwing variant for route handlers / pages. */
export async function assertCanViewStudent(
  user: Pick<SessionUser, "id" | "role" | "masjidId">,
  studentUserId: string,
): Promise<void> {
  if (!(await canViewStudent(user, studentUserId))) {
    const err = new Error("not permitted to view this student");
    err.name = "ForbiddenError";
    throw err;
  }
}
