import Link from "next/link";
import type { ReactNode } from "react";
import { Star8 } from "@/components/ui/Motif";
import { getT } from "@/lib/i18n";

/** Shared shell for /terms, /privacy, /acceptable-use. Plain, readable, no chrome. */
export async function LegalDoc({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { t } = await getT();
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-ink-3 hover:text-teal">
        <Star8 className="h-4 w-4 text-terracotta" /> Suffa
      </Link>
      <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-4">
        {t("legal.lastUpdated", { date: t("legal.updatedValue") })}
      </p>

      <div className="mt-4 rounded-[var(--radius)] border border-mustard/40 bg-mustard-soft px-4 py-3 text-sm text-[color:var(--ink)]">
        <strong>{t("legal.notAdviceStrong")}</strong> {t("legal.notAdviceBody")}
      </div>

      <div className="legal-body mt-8 space-y-5 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_a]:text-teal [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1">
        {children}
      </div>

      <p className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm text-ink-3">
        <Link href="/terms" className="hover:text-teal">{t("legal.footerTerms")}</Link>
        <Link href="/privacy" className="hover:text-teal">{t("legal.footerPrivacy")}</Link>
        <Link href="/acceptable-use" className="hover:text-teal">
          {t("legal.footerAcceptableUse")}
        </Link>
        <Link href="/login" className="ml-auto hover:text-teal">
          {t("legal.footerBackToSignIn")}
        </Link>
      </p>
    </div>
  );
}
