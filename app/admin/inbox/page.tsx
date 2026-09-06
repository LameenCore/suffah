import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { listSupportRequests } from "@/lib/db/support-queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SupportInbox } from "@/components/admin/SupportInbox";

export default async function AdminInboxPage() {
  const user = await requireRole("admin");
  const { t } = await getT(user);

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
        kicker={t("admin.inbox.kicker")}
        title={t("admin.inbox.title")}
        lede={t("admin.inbox.lede")}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.inbox.unavailable", { detail: loadError, cmd: "npm run migrate" })}
        </Card>
      ) : (
        <SupportInbox requests={requests} />
      )}
    </div>
  );
}
