import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { getT } from "@/lib/i18n";
import { signOutAction } from "@/app/logout/actions";
import { Star8 } from "@/components/ui/Motif";

export default async function PlatformLayout({ children }: LayoutProps<"/platform">) {
  const user = await requirePlatformAdmin();
  const { t } = await getT(user);

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
        <Link href="/platform" className="flex items-center gap-2">
          <Star8 className="h-5 w-5 text-terracotta" />
          <span className="font-display text-sm font-semibold text-ink">
            Suffa <span className="text-ink-4">· {t("platform.kicker")}</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-ink-4 sm:inline">{user.email}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-border px-3 py-1 text-xs text-ink-3 transition-colors hover:border-teal hover:text-teal"
            >
              {t("common.signOut")}
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
