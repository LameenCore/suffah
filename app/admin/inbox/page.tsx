import { requireRole } from "@/lib/auth";
import { listSupportRequests } from "@/lib/db/support-queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SupportInbox } from "@/components/admin/SupportInbox";

export default async function AdminInboxPage() {
  const user = await requireRole("admin");

  let requests: Awaited<ReturnType<typeof listSupportRequests>> = [];
  let loadError: string | null = null;
  try {
    requests = await listSupportRequests(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load requests";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Help requests"
        title="What families and students have asked"
        lede="Questions and bug reports sent from the app. Reply with a short note - the sender sees it on their Get help page."
        back={{ href: "/admin", label: "Overview" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. Run <code>npm run migrate</code>.
        </Card>
      ) : (
        <SupportInbox requests={requests} />
      )}
    </div>
  );
}
