// Role-based auth helpers (admin / parent / student), scoped per masjid/tenant.
//
// SCOPE NOTE (Phase 1): real auth is Supabase Auth with a `role` column on the
// user record (see docs/ARCHITECTURE.md). Until the Supabase project exists, this
// module resolves the current user from a dev cookie / env var so the three
// dashboards can be built and demoed. Every call site is already written against
// the real shape (`SessionUser`), so swapping the internals is a one-file change.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import type { Role, SessionUser } from "@/lib/types";
import { ROLES } from "@/lib/types";

export const DEV_ROLE_COOKIE = "suffa-dev-role";

/** The single demo masjid. Real builds derive this from the authenticated user. */
export const DEMO_MASJID_ID = "masjid-demo";

const DEMO_USERS: Record<Role, SessionUser> = {
  admin: {
    id: "user-admin-demo",
    masjidId: DEMO_MASJID_ID,
    role: "admin",
    name: "Masjid Admin",
    email: "admin@suffa.demo",
  },
  parent: {
    id: "user-parent-demo",
    masjidId: DEMO_MASJID_ID,
    role: "parent",
    name: "Parent (Demo Family)",
    email: "parent@suffa.demo",
  },
  student: {
    id: "user-student-demo",
    masjidId: DEMO_MASJID_ID,
    role: "student",
    name: "Student (Secondary 1)",
    email: "student@suffa.demo",
  },
};

function isRole(value: string | undefined): value is Role {
  return !!value && (ROLES as string[]).includes(value);
}

/** Resolve the current session user, or null if no role is selected. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // TODO(Phase 1): replace with Supabase Auth session lookup + users.role.
  const cookieRole = (await cookies()).get(DEV_ROLE_COOKIE)?.value;
  const role = isRole(cookieRole)
    ? cookieRole
    : isRole(env.devRole)
      ? (env.devRole as Role)
      : null;
  return role ? DEMO_USERS[role] : null;
}

/**
 * Guard a dashboard route group. Redirects to the role picker if the current
 * user is missing or holds the wrong role. Returns the user on success.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/?next=${role}`);
  if (user.role !== role) redirect(`/?denied=${role}`);
  return user;
}
