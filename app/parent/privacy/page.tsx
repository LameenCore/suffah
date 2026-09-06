import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { listOwnSupportRequests } from "@/lib/db/support-queries";
import { requestErasureAction } from "@/app/parent/privacy/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Your data" };

export default async function ParentPrivacyPage() {
  const user = await requireRole("parent");
  const { t, intlLocale } = await getT(user);

  let erasureRequests: Awaited<ReturnType<typeof listOwnSupportRequests>> = [];
  try {
    const own = await listOwnSupportRequests(user.id, user.masjidId);
    erasureRequests = own.filter((r) => r.category === "data-erasure");
  } catch {
    // non-fatal — the page still shows the export + request options
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("parentPrivacy.kicker")}
        title={t("parentPrivacy.title")}
        lede={t("parentPrivacy.lede")}
        back={{ href: "/parent", label: t("parentPrivacy.back") }}
      />

      <Card className="space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          {t("parentPrivacy.downloadTitle")}
        </h2>
        <p className="text-sm text-ink-2">{t("parentPrivacy.downloadBody")}</p>
        <ButtonLink href="/parent/privacy/export" variant="primary" size="sm" prefetch={false}>
          {t("parentPrivacy.downloadCta")}
        </ButtonLink>
        <p className="text-xs text-ink-4">{t("parentPrivacy.downloadNote")}</p>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          {t("parentPrivacy.correctTitle")}
        </h2>
        <p className="text-sm text-ink-2">
          {t("parentPrivacy.correctBodyBefore")}
          <Link href="/parent" className="text-teal underline underline-offset-2">
            {t("parentPrivacy.correctBodyLink")}
          </Link>
          {t("parentPrivacy.correctBodyAfter")}
        </p>
      </Card>

      <Card tone="warning" className="space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          {t("parentPrivacy.deleteTitle")}
        </h2>
        <p className="text-sm text-ink-2">{t("parentPrivacy.deleteBody")}</p>
        <form action={requestErasureAction} className="space-y-2">
          <label className="block text-sm">
            <span className="text-ink-2">{t("parentPrivacy.deleteReason")}</span>
            <textarea
              name="reason"
              rows={3}
              maxLength={2000}
              className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm transition-[filter] hover:brightness-95"
          >
            {t("parentPrivacy.deleteSend")}
          </button>
        </form>

        {erasureRequests.length > 0 ? (
          <div className="border-t border-border pt-3 text-sm text-ink-3">
            <p className="font-medium text-ink-2">{t("parentPrivacy.yourRequests")}</p>
            <ul className="mt-1 space-y-1">
              {erasureRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <span>{new Date(r.createdAt).toLocaleDateString(intlLocale)}</span>
                  <span className="text-ink-4">
                    {r.status === "open"
                      ? t("help.statusOpen")
                      : t("help.statusResolved")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <p className="text-xs text-ink-4">
        {t("parentPrivacy.seeAlsoBefore")}
        <Link href="/privacy" className="text-teal underline underline-offset-2">
          {t("parentPrivacy.seeAlsoLink")}
        </Link>
        {t("parentPrivacy.seeAlsoAfter")}
      </p>
    </div>
  );
}
