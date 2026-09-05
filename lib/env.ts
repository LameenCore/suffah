// Central place to read environment config. Nothing here throws at import time so
// `next build` works before Supabase / Anthropic credentials are wired up.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  /** Demo shortcut: when set, the dashboards render for this role without real auth. */
  devRole: process.env.NEXT_PUBLIC_SUFFA_DEV_ROLE ?? "",
  /** Public origin, for canonical URLs / sitemap. No trailing slash. */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://suffa.community").replace(
    /\/$/,
    "",
  ),
  /**
   * When "1"/"true", exposes the in-app "Reset walkthrough" control and its
   * /api/demo/reset endpoint. Never set this in a real deployment.
   */
  demoMode: /^(1|true)$/i.test(process.env.NEXT_PUBLIC_SUFFA_DEMO_MODE ?? ""),
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isAnthropicConfigured = Boolean(env.anthropicApiKey);
