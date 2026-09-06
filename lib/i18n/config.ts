// Lightweight i18n for Suffa (T59). Cookie-based, no locale-prefixed routes -
// a single switch flips the whole app. Resolution order (server):
//   suffa-locale cookie  ->  users.locale  ->  masjids.default_locale  ->  "en"

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "suffa-locale";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

/** BCP-47 tag for Intl formatters. Quebec French. */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-CA",
  fr: "fr-CA",
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}
