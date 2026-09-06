import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { VolunteerManager } from "@/components/admin/VolunteerManager";
import { listVolunteers, type VolunteerRoster } from "@/lib/db/volunteer-queries";

export default async function AdminVolunteersPage() {
  const user = await requireRole("admin");
  const { t } = await getT(user);

  let roster: VolunteerRoster = { active: [], churned: [] };
  let loadError: string | null = null;

  try {
    roster = await listVolunteers(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load volunteers";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("admin.volunteers.kicker")}
        title={t("admin.volunteers.title")}
        lede={t("admin.volunteers.lede")}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.volunteers.unavailable", { detail: loadError, cmd: "npm run seed" })}
        </Card>
      ) : (
        <VolunteerManager active={roster.active} churned={roster.churned} />
      )}
    </div>
  );
}
