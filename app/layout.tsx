import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { env } from "@/lib/env";
import { getLocale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Suffa — community homeschool pods",
    template: "%s — Suffa",
  },
  description:
    "Community-run homeschool pods for Quebec Muslim families. A self-paced curriculum playground keeps learning going when a volunteer moves on; volunteers add live enrichment; the masjid handles admin and compliance. Waqf-sustained, free to families.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
