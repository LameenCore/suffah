// Central place to read environment config. Nothing here throws at import time so
// `next build` works before Supabase / Anthropic credentials are wired up.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  /** Demo shortcut: when set, the dashboards render for this role without real auth. */
  devRole: process.env.NEXT_PUBLIC_SUFFA_DEV_ROLE ?? "",
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isAnthropicConfigured = Boolean(env.anthropicApiKey);
