// Supabase client for Server Components, Route Handlers, and Server Actions.
// Reads/writes auth cookies via next/headers (see @supabase/ssr).
//
// Phase 1 note: auth is still the dev-role cookie (lib/auth). This client is for
// DB reads/writes now; it also carries the Supabase session once real auth lands.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";

export async function getServerClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  const cookieStore = await cookies();
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
