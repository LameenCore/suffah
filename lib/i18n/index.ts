// Server-side locale resolution + message access (T59).

import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { DEFAULT_LOCALE, INTL_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { en, type Messages } from "@/lib/i18n/messages/en";
import { fr } from "@/lib/i18n/messages/fr";

const CATALOGUES: Record<Locale, Messages> = { en, fr };

/**
 * Resolve the active locale: suffa-locale cookie -> user.locale ->
 * masjid.default_locale -> "en". Pass the session user to enable the last two.
 */
export async function getLocale(
  user?: Pick<SessionUser, "id" | "masjidId"> | null,
): Promise<Locale> {
  const cookieValue = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  if (user) {
    try {
      const db = getServiceClient();
      const [{ data: u }, { data: m }] = await Promise.all([
        db.from("users").select("locale").eq("id", user.id).maybeSingle(),
        db.from("masjids").select("default_locale").eq("id", user.masjidId).maybeSingle(),
      ]);
      if (isLocale(u?.locale)) return u.locale as Locale;
      if (isLocale(m?.default_locale)) return m.default_locale as Locale;
    } catch {
      // fall through to default
    }
  }
  return DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): Messages {
  return CATALOGUES[locale] ?? en;
}

type Leaves<T> = T extends object
  ? { [K in keyof T]: `${string & K}` | `${string & K}.${Leaves<T[K]>}` }[keyof T]
  : never;

export type MessageKey = Leaves<Messages>;

function lookup(messages: Messages, key: string): string | undefined {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages) as string | undefined;
}

export type Translator = (key: MessageKey, params?: Record<string, string | number>) => string;

/** Build a translator bound to `locale`, falling back to English then the key. */
export function makeTranslator(locale: Locale): Translator {
  const messages = getMessages(locale);
  return function t(key: MessageKey, params?: Record<string, string | number>): string {
    let value = lookup(messages, key) ?? lookup(en, key) ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return value;
  };
}

/** Convenience: resolve the locale and return { locale, t, intlLocale }. */
export async function getT(user?: Pick<SessionUser, "id" | "masjidId"> | null) {
  const locale = await getLocale(user);
  return { locale, intlLocale: INTL_LOCALE[locale], t: makeTranslator(locale) };
}
