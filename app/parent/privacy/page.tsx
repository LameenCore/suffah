import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listOwnSupportRequests } from "@/lib/db/support-queries";
import { requestErasureAction } from "@/app/parent/privacy/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Your data" };

export default async function ParentPrivacyPage() {
  const user = await requireRole("parent");

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
        kicker="Your data"
        title="What Suffa holds, and your rights over it"
        lede="Under Quebec's Law 25 you can see everything we hold about your family, ask us to correct it, and ask us to delete it."
        back={{ href: "/parent", label: "This week" }}
      />

      <Card className="space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Download your data</h2>
        <p className="text-sm text-ink-2">
          A machine-readable copy of your account and every linked child&apos;s account,
          pod membership, lesson progress, checkpoint / assessment / exam results,
          compliance reports, community notes, and consent records.
        </p>
        <ButtonLink href="/parent/privacy/export" variant="primary" size="sm" prefetch={false}>
          Download JSON export
        </ButtonLink>
        <p className="text-xs text-ink-4">
          Pod-level session notes that are not specific to your child are available from
          your masjid administrator on request.
        </p>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Correct something</h2>
        <p className="text-sm text-ink-2">
          If a name, email, or result is wrong, message your masjid administrator through{" "}
          <Link href="/parent" className="text-teal underline underline-offset-2">
            the help option
          </Link>{" "}
          and they will fix it.
        </p>
      </Card>

      <Card tone="warning" className="space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Request deletion</h2>
        <p className="text-sm text-ink-2">
          This sends a request to the masjid&apos;s privacy officer. They will confirm your
          identity, delete your family&apos;s data, and tell you what (if anything) the law
          requires them to keep. It does not delete anything immediately.
        </p>
        <form action={requestErasureAction} className="space-y-2">
          <label className="block text-sm">
            <span className="text-ink-2">Reason (optional)</span>
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
            Send deletion request
          </button>
        </form>

        {erasureRequests.length > 0 ? (
          <div className="border-t border-border pt-3 text-sm text-ink-3">
            <p className="font-medium text-ink-2">Your requests</p>
            <ul className="mt-1 space-y-1">
              {erasureRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  <span className="capitalize text-ink-4">{r.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <p className="text-xs text-ink-4">
        See the{" "}
        <Link href="/privacy" className="text-teal underline underline-offset-2">
          Privacy Policy
        </Link>{" "}
        for what we collect, who processes it, and how long we keep it.
      </p>
    </div>
  );
}
