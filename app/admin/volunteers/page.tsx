import Link from "next/link";
import { requireRole } from "@/lib/auth";
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
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/admin"
          className="text-ink-3 underline underline-offset-2 hover:text-ink "
        >
          ← Admin
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Volunteers</h1>
        <p className="mt-1 text-sm text-ink-3 ">
          Onboard volunteers, track vetting status, and log departures. Volunteers run
          live enrichment - the playground carries primary instruction, so a departure never
          stops learning.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-ink-2   ">
          Volunteer data is unavailable: {loadError}. Configure Supabase and run the
          seed to populate this view.
        </p>
      ) : (
        <VolunteerManager active={roster.active} churned={roster.churned} />
      )}
    </div>
  );
}
