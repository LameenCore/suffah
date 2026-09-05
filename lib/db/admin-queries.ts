// Masjid-scoped reads + writes for the admin dashboard (pods, assignment,
// continuity). Kept separate from lib/db/queries.ts so pod/admin logic and the
// student-playground logic stay in their own files (one file, one writer).
//
// Every function takes `masjidId` and filters by it before returning or writing
// anything — see .claude/skills/api-design.md (tenant scoping is non-negotiable,
// even in a single-masjid demo).

import { getServiceClient } from "@/lib/db";
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

function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
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

  const rows: CourseRow[] = [];
  for (const c of (courses ?? []) as { id: string; name: CourseName }[]) {
    const { count, error: countErr } = await db
      .from("pathway_nodes")
      .select("id", { count: "exact", head: true })
      .eq("course_id", c.id);
    if (countErr) throw new Error(`listCoursesWithNodeCounts: ${countErr.message}`);
    rows.push({ id: c.id, name: c.name, totalNodes: count ?? 0 });
  }
  return rows;
}

/** All volunteers in the masjid, for the pod assignment picker. */
export async function listVolunteers(masjidId: string): Promise<AdminVolunteer[]> {
  const { data, error } = await getServiceClient()
    .from("volunteers")
    .select("id, name, status")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (error) throw new Error(`listVolunteers: ${error.message}`);
  return (data ?? []) as AdminVolunteer[];
}

/** Every student in the masjid, with the pod they're in (if any). */
export async function listStudents(masjidId: string): Promise<AdminStudent[]> {
  const db = getServiceClient();
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
  const db = getServiceClient();

  const { data: pods, error } = await db
    .from("pods")
    .select(
      "id, name, max_students, masjid_id, volunteer:volunteers ( id, name, status )",
    )
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (error) throw new Error(`listPods: ${error.message}`);

  const courses = await listCoursesWithNodeCounts(masjidId);

  const result: AdminPod[] = [];
  for (const pod of (pods ?? []) as Record<string, unknown>[]) {
    const podId = pod.id as string;

    const { data: members, error: mErr } = await db
      .from("pod_students")
      .select("student:users!inner ( id, name, email )")
      .eq("pod_id", podId);
    if (mErr) throw new Error(`listPods: ${mErr.message}`);

    const students: PodMember[] = (members ?? [])
      .map((row) => unwrap(row.student as unknown) as PodMember | null)
      .filter((s): s is PodMember => s != null)
      .sort((a, b) => a.name.localeCompare(b.name));

    const { data: progressRows, error: pErr } = await db
      .from("pod_progress")
      .select("course_id, current_node_id, node:pathway_nodes ( id, title, sequence_order )")
      .eq("pod_id", podId);
    if (pErr) throw new Error(`listPods: ${pErr.message}`);

    const progressByCourse = new Map<
      string,
      { nodeId: string | null; title: string | null; position: number }
    >();
    for (const row of progressRows ?? []) {
      const node = unwrap(row.node as unknown) as
        | { id: string; title: string; sequence_order: number }
        | null;
      progressByCourse.set(row.course_id as string, {
        nodeId: (row.current_node_id as string | null) ?? null,
        title: node?.title ?? null,
        position: node?.sequence_order ?? 0,
      });
    }

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
  const { data, error } = await getServiceClient()
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
  const { data, error } = await getServiceClient()
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
 * {@link POD_MAX_STUDENTS} (Quebec exemption threshold — also a DB trigger),
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
  if ((existing ?? []).some((r) => r.pod_id === podId)) return; // already a member — no-op
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
