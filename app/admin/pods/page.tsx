import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { RegulationNote } from "@/components/RegulationNote";
import { PodCard } from "@/components/admin/PodCard";
import {
  listPods,
  listStudents,
  listVolunteers,
  type AdminPod,
  type AdminStudent,
  type AdminVolunteer,
} from "@/lib/db/admin-queries";
import { POD_MAX_STUDENTS } from "@/lib/types";

export default async function AdminPodsPage() {
  const user = await requireRole("admin");

  let pods: AdminPod[] = [];
  let volunteers: AdminVolunteer[] = [];
  let students: AdminStudent[] = [];
  let loadError: string | null = null;

  try {
    [pods, volunteers, students] = await Promise.all([
      listPods(user.masjidId),
      listVolunteers(user.masjidId),
      listStudents(user.masjidId),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load pod data";
  }

  const unassignedStudents = students
    .filter((s) => !s.podId)
    .map((s) => ({ id: s.id, name: s.name, email: s.email }));

  const courseColumns = pods[0]?.progress.map((p) => ({
    id: p.courseId,
    name: p.courseName,
  }));

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
        <h1 className="text-2xl font-semibold tracking-tight">Pods</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Assign a volunteer and up to {POD_MAX_STUDENTS} students per pod. The
          continuity view shows where each pod is in every course, so a new
          volunteer can pick up mid-stream.
        </p>
      </div>

      <RegulationNote>
        The {POD_MAX_STUDENTS}-student cap mirrors Quebec&apos;s home-instruction
        exemption threshold (fewer than five children per instructor) as currently
        understood - confirm against active regulation before relying on it.
      </RegulationNote>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          Pod data is unavailable: {loadError}. Configure Supabase and run the seed
          to populate this view.
        </p>
      ) : pods.length === 0 ? (
        <p className="rounded-xl border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15">
          No pods yet.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {pods.map((pod) => (
              <PodCard
                key={pod.id}
                pod={pod}
                volunteers={volunteers}
                unassignedStudents={unassignedStudents}
              />
            ))}
          </div>

          {/* Continuity matrix - pod x course -> current node */}
          <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
            <h2 className="font-medium">Continuity view</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Current pathway node per pod, per course. This is what a replacement
              volunteer sees on day one.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                    <th className="border-b border-black/10 py-2 pr-4 dark:border-white/15">
                      Pod
                    </th>
                    <th className="border-b border-black/10 py-2 pr-4 dark:border-white/15">
                      Volunteer
                    </th>
                    {courseColumns?.map((c) => (
                      <th
                        key={c.id}
                        className="border-b border-black/10 py-2 pr-4 dark:border-white/15"
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pods.map((pod) => (
                    <tr key={pod.id} className="align-top">
                      <td className="border-b border-black/5 py-2 pr-4 font-medium dark:border-white/10">
                        {pod.name}
                      </td>
                      <td className="border-b border-black/5 py-2 pr-4 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                        {pod.volunteer?.name ?? "-"}
                      </td>
                      {pod.progress.map((p) => (
                        <td
                          key={p.courseId}
                          className="border-b border-black/5 py-2 pr-4 dark:border-white/10"
                        >
                          {p.currentNodeTitle ? (
                            <>
                              <span className="text-zinc-400">
                                node {p.nodePosition}
                                {p.totalNodes ? ` / ${p.totalNodes}` : ""}
                              </span>
                              <br />
                              {p.currentNodeTitle}
                            </>
                          ) : (
                            <span className="text-zinc-400">not started</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
