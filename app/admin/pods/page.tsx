import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
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
import { getFastTrackSuggestions, type FastTrackSuggestion } from "@/lib/db/path-queries";
import { POD_MAX_STUDENTS } from "@/lib/types";

export default async function AdminPodsPage() {
  const user = await requireRole("admin");
  const { t } = await getT(user);

  let pods: AdminPod[] = [];
  let volunteers: AdminVolunteer[] = [];
  let students: AdminStudent[] = [];
  let fastTrack: FastTrackSuggestion[] = [];
  let loadError: string | null = null;

  try {
    [pods, volunteers, students] = await Promise.all([
      listPods(user.masjidId),
      listVolunteers(user.masjidId),
      listStudents(user.masjidId),
    ]);
    fastTrack = await getFastTrackSuggestions(user.masjidId).catch(() => []);
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
        kicker={t("admin.pods.kicker")}
        title={t("admin.pods.title")}
        lede={t("admin.pods.lede", { max: POD_MAX_STUDENTS })}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      <RegulationNote>
        {t("admin.pods.regulationNote", { max: POD_MAX_STUDENTS })}
      </RegulationNote>

      {fastTrack.length > 0 ? (
        <Card tone="teal" className="p-4">
          <p className="text-sm font-medium text-ink">{t("admin.pods.fastTrackTitle")}</p>
          <ul className="mt-1 space-y-0.5 text-sm text-ink-2">
            {fastTrack.map((s, i) => (
              <li key={i}>
                {t("admin.pods.fastTrackItem", {
                  student: s.studentName,
                  node: s.nodeTitle,
                  course: s.courseName,
                })}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {loadError ? (
        <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-ink-2   ">
          {t("admin.pods.unavailable", { detail: loadError })}
        </p>
      ) : pods.length === 0 ? (
        <p className="rounded-xl border border-border p-6 text-sm text-ink-3 ">
          {t("admin.pods.empty")}
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
            <h2 className="font-display text-lg font-semibold text-ink">
              {t("admin.pods.matrixTitle")}
            </h2>
            <p className="mt-1 text-xs text-ink-3">{t("admin.pods.matrixLede")}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-4">
                    <th className="border-b border-border py-2 pr-4 ">
                      {t("admin.pods.colPod")}
                    </th>
                    <th className="border-b border-border py-2 pr-4 ">
                      {t("admin.pods.colVolunteer")}
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
                                {p.totalNodes
                                  ? t("admin.pods.nodePosOfTotal", {
                                      pos: p.nodePosition,
                                      total: p.totalNodes,
                                    })
                                  : t("admin.pods.nodePos", { pos: p.nodePosition })}
                              </span>
                              <br />
                              {p.currentNodeTitle}
                            </>
                          ) : (
                            <span className="text-ink-4">{t("admin.pods.notStarted")}</span>
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
