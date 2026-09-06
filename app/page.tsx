import Link from "next/link";
import type { Metadata } from "next";
import { Star8, Crescent, Dome, Lantern, Flourish } from "@/components/ui/Motif";
import { Mascot } from "@/components/ui/Mascot";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { getT } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    absolute: "Suffa — homeschool pods where the software carries the curriculum",
  },
  description:
    "Community-run homeschool pods for Quebec Muslim families. A self-paced curriculum playground keeps learning going even when a volunteer moves on; volunteers add live enrichment; the masjid handles admin and compliance. Waqf-sustained, free to families.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Suffa — homeschool pods that don't stop when a volunteer leaves",
    description:
      "A self-paced curriculum playground carries the teaching; community volunteers add live enrichment; the masjid handles compliance. Waqf-sustained, free to families.",
    type: "website",
    siteName: "Suffa",
  },
};

const CONTACT_EMAIL = "hello@suffa.community";

export default async function Landing() {
  const { t } = await getT();

  const steps = [
    { icon: <Lantern className="h-5 w-5 text-mustard" />, title: t("landing.step1Title"), body: t("landing.step1Body") },
    { icon: <Crescent className="h-5 w-5 text-teal-strong" />, title: t("landing.step2Title"), body: t("landing.step2Body") },
    { icon: <Dome className="h-6 w-10 text-terracotta" />, title: t("landing.step3Title"), body: t("landing.step3Body") },
  ];
  const views = [
    { name: t("landing.viewStudents"), body: t("landing.viewStudentsBody") },
    { name: t("landing.viewFamilies"), body: t("landing.viewFamiliesBody") },
    { name: t("landing.viewAdmins"), body: t("landing.viewAdminsBody") },
  ];

  return (
    <div className="flex min-h-full flex-col bg-bg text-ink-2">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-5">
        <span className="flex items-center gap-2">
          <Star8 className="h-5 w-5 text-terracotta" />
          <span className="font-display text-lg font-semibold text-ink">{t("landing.brand")}</span>
        </span>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
          <LocaleSwitch compact />
          <Link href="/login" className="text-ink-3 hover:text-teal">
            {t("common.signIn")}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-teal px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
          >
            {t("landing.familySignup")}
          </Link>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="flex-1">
        <section className="relative overflow-hidden">
          <div
            className="geo-field pointer-events-none absolute inset-x-0 top-0 h-96 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto grid w-full max-w-5xl gap-8 px-6 py-16 sm:py-24 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                {t("landing.kicker")}
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                {t("landing.heroTitle")}
              </h1>
              <p className="max-w-xl text-base text-ink-2">{t("landing.heroBody")}</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/signup"
                  className="rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
                >
                  {t("landing.familySignup")}
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-teal hover:text-teal"
                >
                  {t("landing.exploreDemo")}
                </Link>
              </div>
              <p className="text-xs text-ink-4">{t("landing.demoNote")}</p>
            </div>
            <div className="hidden justify-self-center md:block">
              <Mascot size={190} mood="cheer" />
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-bg-tint">
          <div className="mx-auto w-full max-w-5xl px-6 py-12">
            <div className="flex items-start gap-3">
              <Flourish className="mt-1 h-4 w-16 shrink-0 text-terracotta" />
              <p className="max-w-3xl text-sm text-ink-2">{t("landing.nameBody")}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-ink">{t("landing.problemTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink-2">{t("landing.problemBody")}</p>
        </section>

        <section className="border-t border-border bg-surface-2">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <h2 className="font-display text-2xl font-semibold text-ink">{t("landing.howTitle")}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div
                  key={s.title}
                  className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex h-10 items-center">{s.icon}</div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm text-ink-2">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-ink">{t("landing.viewsTitle")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {views.map((v) => (
              <div key={v.name} className="rounded-[var(--radius)] border border-border bg-surface p-5">
                <h3 className="font-display text-base font-semibold text-ink">{v.name}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-bg-tint">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-16 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{t("landing.forFamiliesTitle")}</h2>
              <p className="mt-2 text-sm text-ink-2">{t("landing.forFamiliesBody")}</p>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{t("landing.forMasjidsTitle")}</h2>
              <p className="mt-2 text-sm text-ink-2">
                {t("landing.forMasjidsBody", { email: CONTACT_EMAIL })}
              </p>
              <Link
                href="/for-masjids"
                className="mt-2 inline-block text-sm font-medium text-teal hover:text-teal-strong"
              >
                {t("forMasjids.formTitle")} &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 text-xs text-ink-4">
          <p className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-teal">{t("landing.footerTerms")}</Link>
            <Link href="/privacy" className="hover:text-teal">{t("landing.footerPrivacy")}</Link>
            <Link href="/acceptable-use" className="hover:text-teal">{t("landing.footerAup")}</Link>
            <Link href="/login" className="ml-auto hover:text-teal">{t("common.signIn")}</Link>
          </p>
          <p className="mt-4 max-w-2xl">{t("landing.footerDisclaimer")}</p>
          <p className="mt-4">{t("landing.footerTagline")}</p>
        </div>
      </footer>
    </div>
  );
}
