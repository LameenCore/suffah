import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { getChildrenForParent } from "@/lib/db/parent-queries";
import {
  CONSENT_PURPOSES,
  CONSENT_VERSION,
  getActiveConsent,
  type ConsentPurposeKey,
} from "@/lib/consent";
import {
  grantConsentAction,
  withdrawConsentAction,
  setSimpleModeAction,
} from "@/app/parent/consent/actions";
import { getServiceClient } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Consent" };

const PURPOSE_KEY: Record<
  ConsentPurposeKey,
  { label: MessageKey; detail: MessageKey }
> = {
  curriculum: {
    label: "consent.purpose.curriculumLabel",
    detail: "consent.purpose.curriculumDetail",
  },
  ai_instruction: {
    label: "consent.purpose.aiInstructionLabel",
    detail: "consent.purpose.aiInstructionDetail",
  },
  compliance_record: {
    label: "consent.purpose.complianceRecordLabel",
    detail: "consent.purpose.complianceRecordDetail",
  },
  retention: {
    label: "consent.purpose.retentionLabel",
    detail: "consent.purpose.retentionDetail",
  },
};

export default async function ParentConsentPage() {
  const user = await requireRole("parent");
  const { t, intlLocale } = await getT(user);

  let children: Awaited<ReturnType<typeof getChildrenForParent>> = [];
  let loadError: string | null = null;
  try {
    children = await getChildrenForParent(user.id, user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load children";
  }

  const simpleByChild = new Map<string, boolean>();
  if (children.length > 0) {
    const { data } = await getServiceClient()
      .from("users")
      .select("id, simple_mode")
      .in(
        "id",
        children.map((c) => c.id),
      );
    for (const r of data ?? []) simpleByChild.set(r.id as string, Boolean(r.simple_mode));
  }

  const withConsent = await Promise.all(
    children.map(async (c) => ({
      child: c,
      consent: await getActiveConsent(c.id, user.masjidId),
      simple: simpleByChild.get(c.id) ?? false,
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("consent.kicker")}
        title={t("consent.title")}
        lede={t("consent.lede")}
        back={{ href: "/parent", label: t("consent.back") }}
      />

      <p className="rounded-[var(--radius)] border border-mustard/40 bg-mustard-soft px-4 py-3 text-sm text-[color:var(--ink)]">
        {t("consent.versionNote", { version: CONSENT_VERSION })}
      </p>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("consent.loadError", { detail: loadError })}
        </Card>
      ) : children.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">{t("consent.noChildren")}</Card>
      ) : (
        withConsent.map(({ child, consent, simple }) => (
          <Card key={child.id} as="section" className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink">{child.name}</h2>
              {consent ? (
                <Badge tone="success">{t("consent.onFile")}</Badge>
              ) : (
                <Badge tone="warning">{t("consent.locked")}</Badge>
              )}
            </div>

            <form
              action={setSimpleModeAction}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-ink-2">
                {t("consent.simpleView")}
                <span className="ml-1 text-ink-4">{t("consent.simpleViewHint")}</span>
              </span>
              <input type="hidden" name="childId" value={child.id} />
              <input type="hidden" name="on" value={simple ? "0" : "1"} />
              <button
                type="submit"
                className="shrink-0 rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-teal hover:text-teal"
              >
                {simple ? t("consent.turnOff") : t("consent.turnOn")}
              </button>
            </form>

            <div>
              <p className="text-sm font-medium text-ink-2">{t("consent.consentingTo")}</p>
              <ul className="mt-2 space-y-2">
                {CONSENT_PURPOSES.map((p) => (
                  <li key={p.key} className="text-sm text-ink-2">
                    <span className="font-medium text-ink">
                      {t(PURPOSE_KEY[p.key].label)}.
                    </span>{" "}
                    <span className="text-ink-3">{t(PURPOSE_KEY[p.key].detail)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {consent ? (
              <form action={withdrawConsentAction} className="border-t border-border pt-4">
                <input type="hidden" name="childId" value={child.id} />
                <p className="text-sm text-ink-3">
                  {t("consent.recordedWithdraw", {
                    date: new Date(consent.recordedAt).toLocaleDateString(intlLocale),
                  })}
                </p>
                <button
                  type="submit"
                  className="mt-3 rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-danger hover:text-danger"
                >
                  {t("consent.withdraw")}
                </button>
              </form>
            ) : (
              <form
                action={grantConsentAction}
                className="space-y-3 border-t border-border pt-4"
              >
                <input type="hidden" name="childId" value={child.id} />
                <label className="flex items-start gap-2 text-sm text-ink-2">
                  <input type="checkbox" name="agree" className="mt-0.5" />
                  <span>{t("consent.agree", { name: child.name })}</span>
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
                >
                  {t("consent.give")}
                </button>
              </form>
            )}
          </Card>
        ))
      )}

      <p className="text-xs text-ink-4">
        {t("consent.seeAlsoBefore")}
        <Link href="/privacy" className="text-teal underline underline-offset-2">
          {t("consent.privacyPolicy")}
        </Link>
        {t("consent.seeAlsoBetween")}
        <Link href="/parent/privacy" className="text-teal underline underline-offset-2">
          {t("consent.yourData")}
        </Link>
        {t("consent.seeAlsoAfter")}
      </p>
    </div>
  );
}
