import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listStudents } from "@/lib/db/admin-queries";
import { assembleComplianceReport, getLatestStoredReport } from "@/lib/compliance/report";
import { ComplianceReportView } from "@/components/compliance/ComplianceReportView";
import { SnapshotBar } from "@/components/compliance/SnapshotBar";

export default async function AdminCompliancePage({
  searchParams,
}: PageProps<"/admin/compliance">) {
  const user = await requireRole("admin");
  const sp = await searchParams;
  const selectedId = typeof sp.student === "string" ? sp.student : null;

  let students: Awaited<ReturnType<typeof listStudents>> = [];
  let loadError: string | null = null;
  try {
    students = await listStudents(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load students";
  }

  const selected = students.find((s) => s.id === selectedId) ?? students[0] ?? null;

  const [report, stored] = selected
    ? await Promise.all([
        assembleComplianceReport(selected.id, selected.name, user.masjidId),
        getLatestStoredReport(selected.id),
      ])
    : [null, null];

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
        <h1 className="text-2xl font-semibold tracking-tight">Compliance report</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Assembled continuously from checkpoint, unit-assessment and term-exam data. Each
          course shows a forward-looking status — on track, watch, or gap forming — not just
          a backward record. Save a snapshot for the file when a term closes.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          {loadError}. Run <code>npm run seed</code>.
        </p>
      ) : students.length === 0 ? (
        <p className="rounded-xl border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15">
          No students yet.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <Link
                key={s.id}
                href={`/admin/compliance?student=${s.id}`}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  selected?.id === s.id
                    ? "border-emerald-400 bg-emerald-50 font-medium text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "border-black/10 text-zinc-600 hover:border-emerald-300 dark:border-white/15 dark:text-zinc-300"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>

          {selected && report ? (
            <>
              <SnapshotBar
                studentId={selected.id}
                studentName={selected.name}
                lastSnapshotAt={stored?.generatedAt ?? null}
              />
              <ComplianceReportView report={report} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
