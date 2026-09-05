import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getChildrenForParent } from "@/lib/db/parent-queries";
import {
  CONSENT_PURPOSES,
  CONSENT_VERSION,
  getActiveConsent,
} from "@/lib/consent";
import { grantConsentAction, withdrawConsentAction } from "@/app/parent/consent/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Consent — Suffa" };

export default async function ParentConsentPage() {
  const user = await requireRole("parent");

  let children: Awaited<ReturnType<typeof getChildrenForParent>> = [];
  let loadError: string | null = null;
  try {
    children = await getChildrenForParent(user.id, user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load children";
  }

  const withConsent = await Promise.all(
    children.map(async (c) => ({
      child: c,
      consent: await getActiveConsent(c.id, user.masjidId),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Consent"
        title="Consent for each child"
        lede="A child's playground stays locked until you, as the parent or legal guardian, consent to how Suffa teaches and records their learning. You can withdraw consent later."
        back={{ href: "/parent", label: "This week" }}
      />

      <p className="rounded-[var(--radius)] border border-mustard/40 bg-mustard-soft px-4 py-3 text-sm text-[color:var(--ink)]">
        Consent is recorded with a version ({CONSENT_VERSION}). If we materially change what
        we do, we&apos;ll ask again. Verify evaluation formats and exemption thresholds with
        the masjid and against current Quebec regulation.
      </p>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}.
        </Card>
      ) : children.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">No children linked to this account yet.</Card>
      ) : (
        withConsent.map(({ child, consent }) => (
          <Card key={child.id} as="section" className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink">{child.name}</h2>
              {consent ? (
                <Badge tone="success">Consent on file</Badge>
              ) : (
                <Badge tone="warning">Playground locked — consent needed</Badge>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-ink-2">You are consenting to:</p>
              <ul className="mt-2 space-y-2">
                {CONSENT_PURPOSES.map((p) => (
                  <li key={p.key} className="text-sm text-ink-2">
                    <span className="font-medium text-ink">{p.label}.</span>{" "}
                    <span className="text-ink-3">{p.detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {consent ? (
              <form action={withdrawConsentAction} className="border-t border-border pt-4">
                <input type="hidden" name="childId" value={child.id} />
                <p className="text-sm text-ink-3">
                  Recorded {new Date(consent.recordedAt).toLocaleDateString()}. Withdrawing
                  consent locks the playground and stops new AI-generated lessons for this
                  child; existing records are kept unless you also request deletion.
                </p>
                <button
                  type="submit"
                  className="mt-3 rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-danger hover:text-danger"
                >
                  Withdraw consent
                </button>
              </form>
            ) : (
              <form action={grantConsentAction} className="space-y-3 border-t border-border pt-4">
                <input type="hidden" name="childId" value={child.id} />
                <label className="flex items-start gap-2 text-sm text-ink-2">
                  <input type="checkbox" name="agree" className="mt-0.5" />
                  <span>
                    I am {child.name}&apos;s parent or legal guardian and I consent to all of
                    the above.
                  </span>
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
                >
                  Give consent
                </button>
              </form>
            )}
          </Card>
        ))
      )}

      <p className="text-xs text-ink-4">
        See the{" "}
        <Link href="/privacy" className="text-teal underline underline-offset-2">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/parent/privacy" className="text-teal underline underline-offset-2">
          Your data
        </Link>
        .
      </p>
    </div>
  );
}
