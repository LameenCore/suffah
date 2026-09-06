"use server";

import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/db/server";
import { getServiceClient } from "@/lib/db";
import { DEMO_MASJID_ID, isRole } from "@/lib/auth";
import { env } from "@/lib/env";
import type { Role } from "@/lib/types";

export async function signUpAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  const back = (msg: string) => redirect("/signup?error=" + encodeURIComponent(msg));
  if (!name || !email || !password) back("fillNameEmailPassword");
  if (password.length < 8) back("passwordMin");
  if (!isRole(role)) back("chooseRole");

  // Multi-masjid (T63): a bare public signup only makes sense for the single demo
  // tenant. A real deployment routes a masjid through /for-masjids (provisioned
  // by a platform admin) and its families through a per-masjid invite.
  if (!env.demoMode) {
    if (role === "admin") redirect("/for-masjids");
    back("inviteOnly");
  }

  const anon = await getServerClient();
  const { data: signUp, error: signUpErr } = await anon.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (signUpErr || !signUp.user) back(signUpErr?.message ?? "createFailed");

  const authId = signUp!.user!.id;
  const svc = getServiceClient();

  // Works whether or not the project requires email confirmation.
  await svc.auth.admin.updateUserById(authId, { email_confirm: true });

  // Create the app-level profile row (demo: everyone joins the demo masjid).
  const { error: rowErr } = await svc.from("users").insert({
    masjid_id: DEMO_MASJID_ID,
    role,
    name,
    email,
    auth_id: authId,
  });
  if (rowErr) {
    // Roll back the auth user so a retry is clean.
    await svc.auth.admin.deleteUser(authId).catch(() => {});
    back(rowErr.message.includes("duplicate") ? "emailTaken" : rowErr.message);
  }

  const { error: signInErr } = await anon.auth.signInWithPassword({ email, password });
  if (signInErr) redirect("/login?error=accountCreatedSignIn");

  redirect(`/${role as Role}`);
}
