"use client";

// Client-side i18n (T59). The catalogues are tiny, so the client bundles both
// and the provider only needs to carry the active locale.

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { en, type Messages } from "@/lib/i18n/messages/en";
import { fr } from "@/lib/i18n/messages/fr";
import type { MessageKey } from "@/lib/i18n";

const CATALOGUES: Record<Locale, Messages> = { en, fr };

function lookup(messages: Messages, key: string): string | undefined {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages) as string | undefined;
}

export type Translator = (key: MessageKey, params?: Record<string, string | number>) => string;

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useIntlLocale(): string {
  return INTL_LOCALE[useContext(LocaleContext)];
}

export function useT(): Translator {
  const locale = useContext(LocaleContext);
  return useMemo(() => {
    const messages = CATALOGUES[locale] ?? en;
    return (key, params) => {
      let value = lookup(messages, key) ?? lookup(en, key) ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return value;
    };
  }, [locale]);
}
