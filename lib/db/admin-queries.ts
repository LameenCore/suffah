// Masjid-scoped reads + writes for the admin dashboard (pods, assignment,
// continuity). Kept separate from lib/db/queries.ts so pod/admin logic and the
// student-playground logic stay in their own files (one file, one writer).
//
// Every function takes `masjidId` and filters by it before returning or writing
// anything - see .claude/skills/api-design.md (tenant scoping is non-negotiable,
// even in a single-masjid demo).

import { getServiceClient } from "@/lib/db";
import { getReadClient } from "@/lib/db/server";
import { unwrapRelation as unwrap } from "@/lib/db/rel";
import { POD_MAX_STUDENTS, type CourseName, type VolunteerStatus } from "@/lib/types";

export interface AdminVolunteer {
  id: string;
  name: string;
  status: VolunteerStatus;
}

export interface PodMember {
  id: string;
  name: string;
  email: string;
}

/** One course column in the continuity matrix, for one pod. */
export interface PodCourseProgress {
  courseId: string;
  courseName: CourseName;
  currentNodeId: string | null;
  currentNodeTitle: string | null;
  /** 1-based position of the current node in the pathway (0 = none). */
  nodePosition: number;
  totalNodes: number;
}

export interface AdminPod {
  id: string;
  name: string;
  maxStudents: number;
  volunteer: AdminVolunteer | null;
  students: PodMember[];
  /** One entry per course in the masjid, whether or not the pod has started it. */
  progress: PodCourseProgress[];
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  podId: string | null;
  podName: string | null;
}

interface CourseRow {
  id: string;
  name: CourseName;
  totalNodes: number;
}

/** Courses for the masjid plus a node count for each (continuity matrix columns). */
async function listCoursesWithNodeCounts(masjidId: string): Promise<CourseRow[]> {
  const db = getServiceClient();
  const { data: courses, error } = await db
    .from("courses")
    .select("id, name")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (error) throw new Error(`listCoursesWithNodeCounts: ${error.message}`);

  const courseRows = (courses ?? []) as { id: string; name: CourseName }[];
  if (courseRows.length === 0) return [];

  // One query for every node in every course, tallied in memory (was 1 count/course).
  const { data: nodes, error: nErr } = await db
    .from("pathway_nodes")
    .select("course_id")
    .in(
      "course_id",
      courseRows.map((c) => c.id),
    );
  if (nErr) throw new Error(`listCoursesWithNodeCounts: ${nErr.message}`);

  const countByCourse = new Map<string, number>();
  for (const row of (nodes ?? []) as { course_id: string }[]) {
    countByCourse.set(row.course_id, (countByCourse.get(row.course_id) ?? 0) + 1);
  }

  return courseRows.map((c) => ({
    id: c.id,
    name: c.name,
    totalNodes: countByCourse.get(c.id) ?? 0,
  }));
}

/** All volunteers in the masjid, for the pod assignment picker. */
export async function listVolunteers(masjidId: string): Promise<AdminVolunteer[]> {
  const { data, error } = await (await getReadClient())
    .from("volunteers")
    .select("id, name, status")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (error) throw new Error(`listVolunteers: ${error.message}`);
  return (data ?? []) as AdminVolunteer[];
}

/** Every student in the masjid, with the pod they're in (if any). */
export async function listStudents(masjidId: string): Promise<AdminStudent[]> {
  const db = (await getReadClient());
  const { data: users, error } = await db
    .from("users")
    .select("id, name, email")
    .eq("masjid_id", masjidId)
    .eq("role", "student")
    .order("name", { ascending: true });
  if (error) throw new Error(`listStudents: ${error.message}`);

  const { data: memberships, error: mErr } = await db
    .from("pod_students")
    .select("student_user_id, pod:pods!inner ( id, name, masjid_id )")
    .eq("pod.masjid_id", masjidId);
  if (mErr) throw new Error(`listStudents: ${mErr.message}`);

  const byStudent = new Map<string, { id: string; name: string }>();
  for (const row of memberships ?? []) {
    const pod = unwrap(row.pod as unknown) as
      | { id: string; name: string; masjid_id: string }
      | null;
    if (pod && pod.masjid_id === masjidId) {
      byStudent.set(row.student_user_id as string, { id: pod.id, name: pod.name });
    }
  }

  return ((users ?? []) as { id: string; name: string; email: string }[]).map((u) => {
    const pod = byStudent.get(u.id) ?? null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      podId: pod?.id ?? null,
      podName: pod?.name ?? null,
    };
  });
}

/** Pods in the masjid with volunteer, members, and per-course continuity. */
export async function listPods(masjidId: string): Promise<AdminPod[]> {
  const db = (await getReadClient());

  const { data: pods, error } = await db
    .from("pods")
    .select(
      "id, name, max_students, masjid_id, volunteer:volunteers ( id, name, status )",
    )
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (error) throw new Error(`listPods: ${error.message}`);

  const courses = await listCoursesWithNodeCounts(masjidId);
  const podRows = (pods ?? []) as Record<string, unknown>[];
  const podIds = podRows.map((p) => p.id as string);

  // Two batched queries for all pods (was 2 per pod).
  const [membersRes, progressRes] = await Promise.all([
    podIds.length
      ? db
          .from("pod_students")
          .select("pod_id, student:users!inner ( id, name, email )")
          .in("pod_id", podIds)
      : Promise.resolve({ data: [], error: null }),
    podIds.length
      ? db
          .from("pod_progress")
          .select(
            "pod_id, course_id, current_node_id, node:pathway_nodes ( id, title, sequence_order )",
          )
          .in("pod_id", podIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (membersRes.error) throw new Error(`listPods: ${membersRes.error.message}`);
  if (progressRes.error) throw new Error(`listPods: ${progressRes.error.message}`);

  const membersByPod = new Map<string, PodMember[]>();
  for (const row of (membersRes.data ?? []) as Record<string, unknown>[]) {
    const member = unwrap(row.student as unknown) as PodMember | null;
    if (!member) continue;
    const list = membersByPod.get(row.pod_id as string) ?? [];
    list.push(member);
    membersByPod.set(row.pod_id as string, list);
  }

  type PodCourseCell = { nodeId: string | null; title: string | null; position: number };
  const progressByPodCourse = new Map<string, Map<string, PodCourseCell>>();
  for (const row of (progressRes.data ?? []) as Record<string, unknown>[]) {
    const node = unwrap(row.node as unknown) as
      | { id: string; title: string; sequence_order: number }
      | null;
    const byCourse =
      progressByPodCourse.get(row.pod_id as string) ?? new Map<string, PodCourseCell>();
    byCourse.set(row.course_id as string, {
      nodeId: (row.current_node_id as string | null) ?? null,
      title: node?.title ?? null,
      position: node?.sequence_order ?? 0,
    });
    progressByPodCourse.set(row.pod_id as string, byCourse);
  }

  const result: AdminPod[] = [];
  for (const pod of podRows) {
    const podId = pod.id as string;

    const students: PodMember[] = (membersByPod.get(podId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    const progressByCourse =
      progressByPodCourse.get(podId) ?? new Map<string, PodCourseCell>();

    const progress: PodCourseProgress[] = courses.map((c) => {
      const p = progressByCourse.get(c.id);
      return {
        courseId: c.id,
        courseName: c.name,
        currentNodeId: p?.nodeId ?? null,
        currentNodeTitle: p?.title ?? null,
        nodePosition: p?.position ?? 0,
        totalNodes: c.totalNodes,
      };
    });

    const volunteer = unwrap(pod.volunteer as unknown) as AdminVolunteer | null;

    result.push({
      id: podId,
      name: pod.name as string,
      maxStudents: (pod.max_students as number) ?? POD_MAX_STUDENTS,
      volunteer,
      students,
      progress,
    });
  }
  return result;
}

// --- writes ----------------------------------------------------------------

async function assertPodInMasjid(
  podId: string,
  masjidId: string,
): Promise<{ id: string; max_students: number }> {
  const { data, error } = await (await getReadClient())
    .from("pods")
    .select("id, max_students, masjid_id")
    .eq("id", podId)
    .maybeSingle();
  if (error) throw new Error(`assertPodInMasjid: ${error.message}`);
  if (!data || data.masjid_id !== masjidId) {
    throw new Error("pod not found in this masjid");
  }
  return { id: data.id as string, max_students: data.max_students as number };
}

async function assertStudentInMasjid(studentUserId: string, masjidId: string): Promise<void> {
  const { data, error } = await (await getReadClient())
    .from("users")
    .select("id, role, masjid_id")
    .eq("id", studentUserId)
    .maybeSingle();
  if (error) throw new Error(`assertStudentInMasjid: ${error.message}`);
  if (!data || data.masjid_id !== masjidId || data.role !== "student") {
    throw new Error("student not found in this masjid");
  }
}

/**
 * Add a student to a pod. Enforces (a) tenancy, (b) the hard cap of
 * {@link POD_MAX_STUDENTS} (Quebec exemption threshold - also a DB trigger),
 * (c) one pod per student. Throws a human-readable Error on any violation.
 */
export async function addStudentToPod(
  masjidId: string,
  podId: string,
  studentUserId: string,
): Promise<void> {
  const db = getServiceClient();
  const pod = await assertPodInMasjid(podId, masjidId);
  await assertStudentInMasjid(studentUserId, masjidId);

  const { data: existing, error: exErr } = await db
    .from("pod_students")
    .select("id, pod_id")
    .eq("student_user_id", studentUserId);
  if (exErr) throw new Error(`addStudentToPod: ${exErr.message}`);
  if ((existing ?? []).some((r) => r.pod_id === podId)) return; // already a member - no-op
  if ((existing ?? []).length > 0) {
    throw new Error("student is already assigned to another pod");
  }

  const { count, error: cErr } = await db
    .from("pod_students")
    .select("id", { count: "exact", head: true })
    .eq("pod_id", podId);
  if (cErr) throw new Error(`addStudentToPod: ${cErr.message}`);
  const cap = pod.max_students ?? POD_MAX_STUDENTS;
  if ((count ?? 0) >= cap) {
    throw new Error(`pod is at capacity (${cap} students max)`);
  }

  const { error } = await db
    .from("pod_students")
    .insert({ pod_id: podId, student_user_id: studentUserId });
  if (error) throw new Error(`addStudentToPod: ${error.message}`);
}

/** Remove a student from a pod (tenant-guarded). No-op if not a member. */
export async function removeStudentFromPod(
  masjidId: string,
  podId: string,
  studentUserId: string,
): Promise<void> {
  await assertPodInMasjid(podId, masjidId);
  const { error } = await getServiceClient()
    .from("pod_students")
    .delete()
    .eq("pod_id", podId)
    .eq("student_user_id", studentUserId);
  if (error) throw new Error(`removeStudentFromPod: ${error.message}`);
}

/**
 * Assign (or clear, with null) a pod's volunteer. This is the continuity lever:
 * a new volunteer picks up the pod and sees pod_progress unchanged.
 */
export async function setPodVolunteer(
  masjidId: string,
  podId: string,
  volunteerId: string | null,
): Promise<void> {
  const db = getServiceClient();
  await assertPodInMasjid(podId, masjidId);

  if (volunteerId) {
    const { data, error } = await db
      .from("volunteers")
      .select("id, masjid_id")
      .eq("id", volunteerId)
      .maybeSingle();
    if (error) throw new Error(`setPodVolunteer: ${error.message}`);
    if (!data || data.masjid_id !== masjidId) {
      throw new Error("volunteer not found in this masjid");
    }
  }

  const { error } = await db
    .from("pods")
    .update({ volunteer_id: volunteerId })
    .eq("id", podId);
  if (error) throw new Error(`setPodVolunteer: ${error.message}`);
}
