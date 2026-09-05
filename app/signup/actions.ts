"use server";

import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/db/server";
import { getServiceClient } from "@/lib/db";
import { DEMO_MASJID_ID, isRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function signUpAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  const back = (msg: string) => redirect("/signup?error=" + encodeURIComponent(msg));
  if (!name || !email || !password) back("Fill in your name, email and a password.");
  if (password.length < 8) back("Password must be at least 8 characters.");
  if (!isRole(role)) back("Choose a role.");

  const anon = await getServerClient();
  const { data: signUp, error: signUpErr } = await anon.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (signUpErr || !signUp.user) back(signUpErr?.message ?? "Could not create the account.");

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
    back(rowErr.message.includes("duplicate") ? "That email is already registered." : rowErr.message);
  }

  const { error: signInErr } = await anon.auth.signInWithPassword({ email, password });
  if (signInErr) redirect("/login?error=" + encodeURIComponent("Account created - please sign in."));

  redirect(`/${role as Role}`);
}
