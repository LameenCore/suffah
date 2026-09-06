// Reads for the volunteer portal (/volunteer) — T32. Delegated access: a
// volunteer only ever sees the pod(s) where pods.volunteer_id points at their
// own volunteers record, within their masjid. Everything here is scoped by
// (userId, masjidId) first.

import { getServiceClient } from "@/lib/db";
import { unwrapRelation as unwrap } from "@/lib/db/rel";
import type { CourseName } from "@/lib/types";
import {
  listPodSessionNotes,
  getLatestBriefing,
  type PodSessionNote,
} from "@/lib/db/continuity-queries";
import type { PodBriefing } from "@/lib/ai/continuity";

export interface VolunteerContext {
  volunteerId: string;
  volunteerName: string;
}

export interface VolunteerPodCourse {
  courseId: string;
  courseName: CourseName;
  currentNodeTitle: string | null;
  nodePosition: number;
  totalNodes: number;
}

export interface VolunteerPodView {
  id: string;
  name: string;
  students: { id: string; name: string }[];
  courses: VolunteerPodCourse[];
  notes: PodSessionNote[];
  briefing: { content: PodBriefing; source: string; generatedAt: string } | null;
}


/**
 * The active volunteers record for this signed-in user, or null when the account
 * has not been linked by an admin yet (→ the "waiting to be linked" gate).
 */
export async function getVolunteerContext(
  userId: string,
  masjidId: string,
): Promise<VolunteerContext | null> {
  const { data, error } = await getServiceClient()
    .from("volunteers")
    .select("id, name, masjid_id, left_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`getVolunteerContext: ${error.message}`);
  if (!data || data.masjid_id !== masjidId || data.left_at != null) return null;
  return { volunteerId: data.id as string, volunteerName: data.name as string };
}

/** Pod ids + names this volunteer currently covers. Tenant + delegation scoped. */
export async function listVolunteerPodRefs(
  volunteerId: string,
  masjidId: string,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await getServiceClient()
    .from("pods")
    .select("id, name")
    .eq("masjid_id", masjidId)
    .eq("volunteer_id", volunteerId)
    .order("name", { ascending: true });
  if (error) throw new Error(`listVolunteerPodRefs: ${error.message}`);
  return (data ?? []) as { id: string; name: string }[];
}

/** Guard for the volunteer server actions: the pod must be one this volunteer covers. */
export async function assertPodCoveredByVolunteer(
  podId: string,
  volunteerId: string,
  masjidId: string,
): Promise<void> {
  const { data, error } = await getServiceClient()
    .from("pods")
    .select("id, masjid_id, volunteer_id")
    .eq("id", podId)
    .maybeSingle();
  if (error) throw new Error(`assertPodCoveredByVolunteer: ${error.message}`);
  if (!data || data.masjid_id !== masjidId || data.volunteer_id !== volunteerId) {
    throw new Error("that pod is not assigned to you");
  }
}

/** Full read-only view of every pod this volunteer covers. */
export async function getVolunteerPodViews(
  volunteerId: string,
  masjidId: string,
): Promise<VolunteerPodView[]> {
  const db = getServiceClient();
  const podRefs = await listVolunteerPodRefs(volunteerId, masjidId);
  if (podRefs.length === 0) return [];

  const { data: courseRows } = await db
    .from("courses")
    .select("id, name")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  const courses = (courseRows ?? []) as { id: string; name: CourseName }[];

  // per-course total node counts (one query)
  const totalByCourse = new Map<string, number>();
  if (courses.length > 0) {
    const { data: nodeRows } = await db
      .from("pathway_nodes")
      .select("course_id")
      .in(
        "course_id",
        courses.map((c) => c.id),
      );
    for (const r of (nodeRows ?? []) as { course_id: string }[]) {
      totalByCourse.set(r.course_id, (totalByCourse.get(r.course_id) ?? 0) + 1);
    }
  }

  return Promise.all(
    podRefs.map(async (pod) => {
      const [members, progress, notes, briefing] = await Promise.all([
        db
          .from("pod_students")
          .select("student:users!inner ( id, name )")
          .eq("pod_id", pod.id),
        db
          .from("pod_progress")
          .select("course_id, node:pathway_nodes ( title, sequence_order )")
          .eq("pod_id", pod.id),
        listPodSessionNotes(pod.id, masjidId, 15),
        getLatestBriefing(pod.id, masjidId),
      ]);

      const students = ((members.data ?? []) as unknown[])
        .map((r) => unwrap((r as { student: unknown }).student) as { id: string; name: string } | null)
        .filter((s): s is { id: string; name: string } => s != null)
        .sort((a, b) => a.name.localeCompare(b.name));

      const posByCourse = new Map<string, { title: string | null; position: number }>();
      for (const row of (progress.data ?? []) as Record<string, unknown>[]) {
        const node = unwrap(row.node as unknown) as
          | { title: string; sequence_order: number }
          | null;
        posByCourse.set(row.course_id as string, {
          title: node?.title ?? null,
          position: node?.sequence_order ?? 0,
        });
      }

      return {
        id: pod.id,
        name: pod.name,
        students,
        courses: courses.map((c) => {
          const p = posByCourse.get(c.id);
          return {
            courseId: c.id,
            courseName: c.name,
            currentNodeTitle: p?.title ?? null,
            nodePosition: p?.position ?? 0,
            totalNodes: totalByCourse.get(c.id) ?? 0,
          };
        }),
        notes,
        briefing: briefing
          ? {
              content: briefing.content,
              source: briefing.generatedBy === "fallback" ? "fallback" : "model",
              generatedAt: briefing.generatedAt,
            }
          : null,
      };
    }),
  );
}
