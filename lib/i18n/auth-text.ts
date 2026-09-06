// Auth server actions redirect with a short error CODE in ?error=; the login /
// signup pages resolve it to a localised string here. An unrecognised value
// (e.g. a raw Supabase message) is shown as-is.

import type { MessageKey, Translator } from "@/lib/i18n";

const CODES = new Set([
  "enterEmailPassword",
  "signInFailed",
  "notLinked",
  "unknownRole",
  "fillNameEmailPassword",
  "passwordMin",
  "chooseRole",
  "inviteOnly",
  "createFailed",
  "emailTaken",
  "accountCreatedSignIn",
]);

export function resolveAuthError(t: Translator, raw: string): string {
  return CODES.has(raw) ? t(`auth.err.${raw}` as MessageKey) : raw;
}
