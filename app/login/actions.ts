"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerClient } from "@/lib/db/server";
import { DEV_ROLE_COOKIE, DEMO_USERS, isRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

function dashboardFor(role: Role) {
  return `/${role}`;
}

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!email || !password) redirect("/login?error=Enter your email and password.");

  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    redirect("/login?error=" + encodeURIComponent(error?.message ?? "Sign in failed."));
  }

  const { data: row } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", data.user.id)
    .maybeSingle();
  const role = isRole(row?.role as string) ? (row!.role as Role) : null;
  if (!role) {
    await supabase.auth.signOut();
    redirect("/login?error=" + encodeURIComponent("This account is not linked to a Suffa profile yet."));
  }

  redirect(next && next.startsWith("/") ? next : dashboardFor(role));
}

/** Judge shortcut: drop the dev-role cookie and enter that dashboard. */
export async function demoAsAction(formData: FormData): Promise<void> {
  const role = String(formData.get("role") ?? "");
  if (!isRole(role)) redirect("/login?error=Unknown role.");
  (await cookies()).set(DEV_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(dashboardFor(DEMO_USERS[role as Role].role));
}
