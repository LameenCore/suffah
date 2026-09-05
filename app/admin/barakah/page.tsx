import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { BarakahCheckIn, type PodOption } from "@/components/admin/BarakahCheckIn";
import { listPods } from "@/lib/db/admin-queries";
import { listBarakahNotes, type BarakahEntry } from "@/lib/db/barakah-queries";

export default async function AdminBarakahPage() {
  const user = await requireRole("admin");

  let pods: PodOption[] = [];
  let notes: BarakahEntry[] = [];
  let loadError: string | null = null;

  try {
    const [podRows, noteRows] = await Promise.all([
      listPods(user.masjidId),
      listBarakahNotes(user.masjidId),
    ]);
    pods = podRows.map((p) => ({
      id: p.id,
      name: p.name,
      students: p.students.map((s) => ({ id: s.id, name: s.name })),
    }));
    notes = noteRows;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load barakah notes";
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
        <h1 className="text-2xl font-semibold tracking-tight">Barakah notes</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          What the community values beyond test scores — consistency, helping one
          another, reflection, and adab in the circle. Observations, never points or
          rankings.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          Barakah notes are unavailable: {loadError}. Configure Supabase and run the
          seed to populate this view.
        </p>
      ) : pods.length === 0 ? (
        <p className="rounded-xl border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15">
          No pods yet — create a pod before recording notes.
        </p>
      ) : (
        <BarakahCheckIn pods={pods} recentNotes={notes} />
      )}
    </div>
  );
}
