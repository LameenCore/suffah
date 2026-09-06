import Link from "next/link";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { Star8, Dome, Crescent, Lantern } from "@/components/ui/Motif";
import { submitApplicationAction } from "@/app/for-masjids/actions";

export const metadata: Metadata = {
  title: "Run Suffa at your masjid",
  description:
    "Any masjid can run Suffa. Apply to provision a tenant — your own pods, volunteers, curriculum and compliance records, sustained by your community's waqf.",
  alternates: { canonical: "/for-masjids" },
};

export default async function ForMasjidsPage({ searchParams }: PageProps<"/for-masjids">) {
  const { t } = await getT();
  const sp = await searchParams;
  const submitted = sp.submitted === "1";
  const error = typeof sp.error === "string" ? sp.error : null;

  const points = [
    { icon: <Dome className="h-6 w-10 text-terracotta" />, text: t("forMasjids.point1") },
    { icon: <Lantern className="h-5 w-5 text-mustard" />, text: t("forMasjids.point2") },
    { icon: <Crescent className="h-5 w-5 text-teal-strong" />, text: t("forMasjids.point3") },
  ];

  return (
    <div className="flex min-h-full flex-col bg-bg text-ink-2">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Star8 className="h-5 w-5 text-terracotta" />
          <span className="font-display text-lg font-semibold text-ink">Suffa</span>
        </Link>
        <Link href="/login" className="text-sm text-ink-3 hover:text-teal">
          {t("common.signIn")}
        </Link>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
          {t("forMasjids.kicker")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {t("forMasjids.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ink-2">{t("forMasjids.lede")}</p>

        <ul className="mt-8 space-y-4">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-10 shrink-0 items-center">{p.icon}</span>
              <span className="text-sm text-ink-2">{p.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          {submitted ? (
            <div className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-ink">
                {t("forMasjids.thanksTitle")}
              </h2>
              <p className="text-sm text-ink-2">{t("forMasjids.thanksBody")}</p>
              <Link href="/" className="inline-block text-sm text-teal underline underline-offset-2">
                {t("forMasjids.backHome")}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-ink">
                {t("forMasjids.formTitle")}
              </h2>
              {error ? (
                <p role="alert" className="mt-2 rounded-[var(--radius)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-[color:var(--ink)]">
                  {error}
                </p>
              ) : null}
              <form action={submitApplicationAction} className="mt-4 space-y-3">
                <label className="block text-sm">
                  <span className="text-ink-2">{t("forMasjids.fieldMasjid")}</span>
                  <input
                    name="masjidName"
                    required
                    maxLength={160}
                    className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-ink-2">{t("forMasjids.fieldContact")}</span>
                    <input
                      name="contactName"
                      required
                      autoComplete="name"
                      className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink-2">{t("forMasjids.fieldEmail")}</span>
                    <input
                      type="email"
                      name="contactEmail"
                      required
                      autoComplete="email"
                      className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="text-ink-2">{t("forMasjids.fieldCity")}</span>
                  <input
                    name="city"
                    className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-2">{t("forMasjids.fieldNote")}</span>
                  <textarea
                    name="note"
                    rows={3}
                    maxLength={2000}
                    className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
                >
                  {t("forMasjids.submit")}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-ink-4">{t("forMasjids.disclaimer")}</p>
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto flex w-full max-w-3xl flex-wrap gap-4 px-6 py-6 text-xs text-ink-4">
          <Link href="/terms" className="hover:text-teal">{t("footer.terms")}</Link>
          <Link href="/privacy" className="hover:text-teal">{t("footer.privacy")}</Link>
          <Link href="/" className="ml-auto hover:text-teal">{t("forMasjids.backHome")}</Link>
        </p>
      </footer>
    </div>
  );
}
