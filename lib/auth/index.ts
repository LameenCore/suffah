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

/** The single demo masjid - matches supabase/seed.sql. */
export const DEMO_MASJID_ID = "00000000-0000-0000-0000-000000000001";

// IDs match supabase/seed.sql so dashboard queries hit real seeded rows.
const DEMO_USERS: Record<Role, SessionUser> = {
  admin: {
    id: "00000000-0000-0000-0000-0000000000a1",
    masjidId: DEMO_MASJID_ID,
    role: "admin",
    name: "Masjid Admin",
    email: "admin@suffa.demo",
  },
  parent: {
    id: "00000000-0000-0000-0000-0000000000b1",
    masjidId: DEMO_MASJID_ID,
    role: "parent",
    name: "Parent (Demo Family)",
    email: "parent@suffa.demo",
  },
  student: {
    id: "00000000-0000-0000-0000-0000000000c1",
    masjidId: DEMO_MASJID_ID,
    role: "student",
    name: "Yusuf (Secondary 1)",
    email: "yusuf@suffa.demo",
  },
};

function isRole(value: string | undefined): value is Role {
  return !!value && (ROLES as string[]).includes(value);
}

/** Resolve the current session user, or null if no role is selected. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // Demo scope (see PRD non-goals): auth is a dev role cookie, not a real login.
  // The production swap is a Supabase Auth session lookup + a users.role read;
  // every call site already uses SessionUser, so it is a one-file change here.
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
