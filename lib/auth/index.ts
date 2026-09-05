// Role-based auth (admin / parent / student), scoped per masjid/tenant.
//
// Real auth is Supabase Auth: a session -> an `auth.users` row -> the app `users`
// row (linked by `users.auth_id`, migration 0009) that carries `role` +
// `masjid_id`. Every call site uses `SessionUser`, so nothing downstream changed.
//
// Kept for local dev + the "try the demo" buttons on /login: a signed
// `suffa-dev-role` cookie (or NEXT_PUBLIC_SUFFA_DEV_ROLE) short-circuits to one
// of the three seeded demo identities. That path is off unless a dev role is
// explicitly set.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { getServerClient } from "@/lib/db/server";
import type { Role, SessionUser } from "@/lib/types";
import { ROLES } from "@/lib/types";

export const DEV_ROLE_COOKIE = "suffa-dev-role";

/** The single demo masjid - matches supabase/seed.sql. */
export const DEMO_MASJID_ID = "00000000-0000-0000-0000-000000000001";

// IDs + emails match supabase/seed.sql and scripts/seed-auth.ts so the dev-cookie
// path and the real-auth path resolve to the same rows.
export const DEMO_USERS: Record<Role, SessionUser> = {
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
    email: "student@suffa.demo",
  },
};

export function isRole(value: string | undefined | null): value is Role {
  return !!value && (ROLES as string[]).includes(value);
}

async function devRole(): Promise<Role | null> {
  const cookieRole = (await cookies()).get(DEV_ROLE_COOKIE)?.value;
  if (isRole(cookieRole)) return cookieRole;
  if (isRole(env.devRole)) return env.devRole as Role;
  return null;
}

/** Resolve the current session user, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const dev = await devRole();
  if (dev) return DEMO_USERS[dev];

  // Real auth: Supabase session -> users row via auth_id.
  let supabase;
  try {
    supabase = await getServerClient();
  } catch {
    return null; // Supabase not configured (e.g. `next build`)
  }
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, masjid_id, role, name, email")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (error || !data || !isRole(data.role as string)) return null;

  return {
    id: data.id as string,
    masjidId: data.masjid_id as string,
    role: data.role as Role,
    name: (data.name as string) ?? authUser.email ?? "",
    email: (data.email as string) ?? authUser.email ?? "",
  };
}

/**
 * Guard a dashboard route group. Redirects to /login if there is no session, or
 * to the caller's own dashboard if they hold a different role. Returns the user.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${role}`);
  if (user.role !== role) redirect(`/${user.role}`);
  return user;
}

/** Sign out (Supabase session + dev cookie) and go to /login. */
export async function signOut(): Promise<void> {
  (await cookies()).delete(DEV_ROLE_COOKIE);
  try {
    const supabase = await getServerClient();
    await supabase.auth.signOut();
  } catch {
    // not configured - the cookie delete above is enough
  }
  redirect("/login");
}
