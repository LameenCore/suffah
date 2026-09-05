import { requireRole } from "@/lib/auth";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
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
      <PageHeader
        kicker="Pods"
        title="Pods & assignment"
        lede={`Assign a volunteer and up to ${POD_MAX_STUDENTS} students per pod. The continuity matrix shows where each pod is in every course, so a new volunteer can pick up mid-stream.`}
        back={{ href: "/admin", label: "Overview" }}
      />

      <RegulationNote>
        The {POD_MAX_STUDENTS}-student cap mirrors Quebec&apos;s home-instruction
        exemption threshold (fewer than five children per instructor) as currently
        understood - confirm against active regulation before relying on it.
      </RegulationNote>

      {loadError ? (
        <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-ink-2   ">
          Pod data is unavailable: {loadError}. Configure Supabase and run the seed
          to populate this view.
        </p>
      ) : pods.length === 0 ? (
        <p className="rounded-xl border border-border p-6 text-sm text-ink-3 ">
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
          <Card as="section" className="p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Continuity matrix</h2>
            <p className="mt-1 text-xs text-ink-3">
              Current pathway node per pod, per course. This is what a replacement
              volunteer sees on day one.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-4">
                    <th className="border-b border-border py-2 pr-4 ">
                      Pod
                    </th>
                    <th className="border-b border-border py-2 pr-4 ">
                      Volunteer
                    </th>
                    {courseColumns?.map((c) => (
                      <th
                        key={c.id}
                        className="border-b border-border py-2 pr-4 "
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pods.map((pod) => (
                    <tr key={pod.id} className="align-top">
                      <td className="border-b border-border py-2 pr-4 font-medium ">
                        {pod.name}
                      </td>
                      <td className="border-b border-border py-2 pr-4 text-ink-3  ">
                        {pod.volunteer?.name ?? "-"}
                      </td>
                      {pod.progress.map((p) => (
                        <td
                          key={p.courseId}
                          className="border-b border-border py-2 pr-4 "
                        >
                          {p.currentNodeTitle ? (
                            <>
                              <span className="text-ink-4">
                                node {p.nodePosition}
                                {p.totalNodes ? ` / ${p.totalNodes}` : ""}
                              </span>
                              <br />
                              {p.currentNodeTitle}
                            </>
                          ) : (
                            <span className="text-ink-4">not started</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
