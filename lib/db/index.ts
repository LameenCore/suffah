// Postgres access via Supabase. All server-side DB access goes through here so
// masjid_id scoping and query helpers stay centralized (see .claude/skills/api-design.md).
//
// SCOPE NOTE (Phase 1): the Supabase project is not created yet. These factories
// throw a clear error if called without config rather than failing cryptically.
// The schema they target lives in supabase/migrations/0001_init.sql.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

let serviceClient: SupabaseClient | null = null;

/**
 * Service-role client — bypasses RLS. Use ONLY in trusted server code (API
 * routes, server actions) and always filter by masjid_id explicitly.
 */
export function getServiceClient(): SupabaseClient {
  if (!isSupabaseConfigured || !env.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local. " +
        "Run the migration in supabase/migrations/0001_init.sql first.",
    );
  }
  serviceClient ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
