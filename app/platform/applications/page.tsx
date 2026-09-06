import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { listMasjidApplications } from "@/lib/platform/applications";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ApplicationCard } from "./ApplicationCard";

export const metadata = { title: "Masjid applications" };

export default async function ApplicationsPage() {
  await requirePlatformAdmin();

  let apps: Awaited<ReturnType<typeof listMasjidApplications>> = [];
  let loadError: string | null = null;
  try {
    apps = await listMasjidApplications();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load applications";
  }

  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Platform"
        title="Masjid applications"
        lede="Communities that applied to run Suffa. Approving one provisions the tenant, its first admin login, and a starter curriculum."
        back={{ href: "/platform", label: "Masjids" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}
        </Card>
      ) : apps.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">
          No applications yet. The public form is at{" "}
          <Link href="/for-masjids" className="text-teal underline underline-offset-2">
            /for-masjids
          </Link>
          .
        </Card>
      ) : (
        <>
          {pending.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-4">
                Pending ({pending.length})
              </h2>
              {pending.map((a) => (
                <ApplicationCard key={a.id} app={a} />
              ))}
            </section>
          ) : null}
          {reviewed.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-4">Reviewed</h2>
              {reviewed.map((a) => (
                <ApplicationCard key={a.id} app={a} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
