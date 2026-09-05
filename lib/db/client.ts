"use client";

// Supabase client for Client Components (browser). Uses the anon key + RLS.

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  browserClient ??= createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  return browserClient;
}
