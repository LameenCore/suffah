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
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Admin
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Volunteers</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Onboard volunteers, track vetting status, and log departures. Volunteers run
          live enrichment - the AI carries primary instruction, so a departure never
          stops learning.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          Volunteer data is unavailable: {loadError}. Configure Supabase and run the
          seed to populate this view.
        </p>
      ) : (
        <VolunteerManager active={roster.active} churned={roster.churned} />
      )}
    </div>
  );
}
