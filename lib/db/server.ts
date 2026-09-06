// Supabase client for Server Components, Route Handlers, and Server Actions.
// Reads/writes auth cookies via next/headers (see @supabase/ssr).
//
// Phase 1 note: auth is still the dev-role cookie (lib/auth). This client is for
// DB reads/writes now; it also carries the Supabase session once real auth lands.

import { createServerClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";
import { getServiceClient } from "@/lib/db";

// `next/headers` is imported lazily (inside the async fns) so this module has no
// static dependency on it. Client components import types from lib/db/*-queries
// (which since T80 import getReadClient from here); a static `next/headers`
// import would then break the client bundle even though the code never runs
// client-side. The dynamic import only ever executes on the server.
async function requestCookies() {
  const { cookies } = await import("next/headers");
  return cookies();
}

// Mirrors lib/auth's DEV_ROLE_COOKIE. Redefined here (not imported) because
// lib/auth imports this module — importing back would cycle.
const DEV_ROLE_COOKIE = "suffa-dev-role";

export async function getServerClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  const cookieStore = await requestCookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component - safe to ignore when a proxy/route
          // handler is responsible for refreshing the session.
        }
      },
    },
  });
}

/**
 * The client to use for **reads on behalf of a signed-in user** (T79 / T80).
 *
 * - Real Supabase session  -> the RLS-enforced SSR client. Postgres row-level
 *   security (migration 0016) is the live tenant boundary; the `masjidId`
 *   argument every query helper takes is now a redundant guard, not the only one.
 * - Dev-role cookie / `NEXT_PUBLIC_SUFFA_DEV_ROLE` (the "try the demo" path) ->
 *   the service-role client. There is no real `auth.uid()` in that mode, so the
 *   RLS client would see zero rows and blank every dashboard. Service-role is
 *   safe here because the app-code `masjidId` filter still scopes the query.
 * - **No request context** (a script, or a helper reused by a cross-tenant job)
 *   -> `cookies()` throws; we fall back to service-role. So a query helper that
 *   is *usually* request-scoped but occasionally isn't will keep working exactly
 *   as it did before T80 rather than 500. RLS still applies wherever a real
 *   session exists.
 *
 * Genuinely cross-tenant server work (seed scripts, continuity briefing
 * generation, spend rollups) calls `getServiceClient` directly and explicitly.
 */
export async function getReadClient() {
  try {
    const cookieStore = await requestCookies();
    const devMode =
      Boolean(cookieStore.get(DEV_ROLE_COOKIE)?.value) || Boolean(env.devRole);
    if (devMode) return getServiceClient();
    return getServerClient();
  } catch {
    return getServiceClient();
  }
}
