import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { VolunteerManager } from "@/components/admin/VolunteerManager";
import { listVolunteers, type VolunteerRoster } from "@/lib/db/volunteer-queries";

export default async function AdminVolunteersPage() {
  const user = await requireRole("admin");

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
        kicker="Volunteers"
        title="The people who run the circle"
        lede="Onboard volunteers, track vetting status, and log departures. Volunteers lead live enrichment - the playground carries primary instruction, so a departure never stops learning."
        back={{ href: "/admin", label: "Overview" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          Volunteer data is unavailable: {loadError}. Run <code>npm run seed</code>.
        </Card>
      ) : (
        <VolunteerManager active={roster.active} churned={roster.churned} />
      )}
    </div>
  );
}
