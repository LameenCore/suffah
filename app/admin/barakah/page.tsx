import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
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
      <PageHeader
        kicker="Barakah notes"
        title="What the circle values, beyond marks"
        lede="Consistency, helping one another, reflection, and adab in the circle. Observations, never points or rankings."
        back={{ href: "/admin", label: "Overview" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          Barakah notes are unavailable: {loadError}. Run <code>npm run seed</code>.
        </Card>
      ) : pods.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">
          No pods yet - create a pod before recording notes.
        </Card>
      ) : (
        <BarakahCheckIn pods={pods} recentNotes={notes} />
      )}
    </div>
  );
}
