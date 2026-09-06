import { Sidebar, type NavItem } from "@/components/Sidebar";
import { SkipLink } from "@/components/SkipLink";
import { env } from "@/lib/env";
import type { SessionUser } from "@/lib/types";
import { I18nProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";

/** App shell: left sidebar (drawer on mobile) + content column. */
export function DashboardChrome({
  user,
  nav,
  locale,
  wide = false,
  children,
}: {
  user: SessionUser;
  nav: NavItem[];
  /** Resolved with the user (cookie -> user pref -> masjid default). */
  locale: Locale;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider locale={locale}>
      <SkipLink />
      <div className="flex min-h-full bg-bg">
        <Sidebar
          user={user}
          items={nav}
          demoReset={env.demoMode && user.role === "admin"}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <main
            id="main"
            tabIndex={-1}
            className={`mx-auto w-full flex-1 px-5 py-8 sm:px-8 ${
              wide ? "max-w-6xl" : "max-w-4xl"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </I18nProvider>
  );
}
