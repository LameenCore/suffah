// Masjid-scoped reads for the parent dashboard (T10). Read-only: parents monitor,
// they don't manage. Every function is scoped to the parent's masjid and to the
// children actually linked to that parent (parent_children, migration 0005).

import { getServiceClient } from "@/lib/db";
import type { CourseName } from "@/lib/types";

export interface ChildRef {
  id: string;
  name: string;
}

export interface CheckpointLine {
  nodeTitle: string;
  passed: boolean;
  attemptedAt: string;
}

export interface UnitAssessmentLine {
  unitTitle: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
}

export interface TermExamLine {
  termLabel: string;
  score: number;
  attemptedAt: string;
}

export interface CourseReport {
  courseId: string;
  courseName: CourseName;
  gradeBand: string;
  /** Pod's current position in this course's pathway (0 = not started). */
  nodePosition: number;
  totalNodes: number;
  checkpoints: CheckpointLine[];
  unitAssessments: UnitAssessmentLine[];
  termExams: TermExamLine[];
}

export interface ChildReport {
  child: ChildRef;
  podName: string | null;
  courses: CourseReport[];
}

/** Students linked to this parent, within the parent's masjid. */
export async function getChildrenForParent(
  parentUserId: string,
  masjidId: string,
): Promise<ChildRef[]> {
  const { data, error } = await getServiceClient()
    .from("parent_children")
    .select("student:users!parent_children_student_user_id_fkey ( id, name, masjid_id, role )")
    .eq("parent_user_id", parentUserId);
  if (error) throw new Error(`getChildrenForParent: ${error.message}`);

  return (data ?? [])
    .map((r) => {
      const s = (Array.isArray(r.student) ? r.student[0] : r.student) as
        | { id: string; name: string; masjid_id: string; role: string }
        | null;
      return s;
    })
    .filter(
      (s): s is { id: string; name: string; masjid_id: string; role: string } =>
        s != null && s.masjid_id === masjidId && s.role === "student",
    )
    .map((s) => ({ id: s.id, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const rel = <T,>(v: T | T[] | null | undefined): T | null =>
  v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v;

/**
 * Full read-only reports for several children at once. Fixed number of queries
 * (~7) regardless of how many children - the admin overview fans this across the
 * whole pod, so a per-child version would be an N+1. Tenant-guarded by caller.
 */
export async function getChildReports(
  children: ChildRef[],
  masjidId: string,
): Promise<ChildReport[]> {
  if (children.length === 0) return [];
  const db = getServiceClient();
  const studentIds = children.map((c) => c.id);

  const [courseRes, memberRes, cpRes, uaRes, teRes] = await Promise.all([
    db
      .from("courses")
      .select("id, name, grade_band")
      .eq("masjid_id", masjidId)
      .order("name", { ascending: true }),
    db
      .from("pod_students")
      .select("student_user_id, pod:pods!inner ( id, name, masjid_id )")
      .in("student_user_id", studentIds),
    db
      .from("checkpoint_results")
      .select("student_user_id, passed, attempted_at, node:pathway_nodes!inner ( title, course_id )")
      .in("student_user_id", studentIds)
      .order("attempted_at", { ascending: true }),
    db
      .from("unit_assessment_results")
      .select("student_user_id, score, passed, attempted_at, unit:units!inner ( title, course_id )")
      .in("student_user_id", studentIds)
      .order("attempted_at", { ascending: true }),
    db
      .from("term_exam_results")
      .select("student_user_id, course_id, term_label, score, attempted_at")
      .in("student_user_id", studentIds)
      .order("attempted_at", { ascending: true }),
  ]);
  for (const [label, res] of [
    ["courses", courseRes],
    ["pod_students", memberRes],
    ["checkpoint_results", cpRes],
    ["unit_assessment_results", uaRes],
    ["term_exam_results", teRes],
  ] as const) {
    if (res.error) throw new Error(`getChildReports (${label}): ${res.error.message}`);
  }

  const courses = (courseRes.data ?? []) as {
    id: string;
    name: CourseName;
    grade_band: string;
  }[];

  // student -> pod (masjid-checked)
  const podByStudent = new Map<string, { id: string; name: string }>();
  for (const row of memberRes.data ?? []) {
    const pod = rel(row.pod as unknown) as
      | { id: string; name: string; masjid_id: string }
      | null;
    if (pod && pod.masjid_id === masjidId) {
      podByStudent.set(row.student_user_id as string, { id: pod.id, name: pod.name });
    }
  }
  const podIds = [...new Set([...podByStudent.values()].map((p) => p.id))];

  // pod position per course, and per-course node totals - one query each.
  const [ppRes, nodeRes] = await Promise.all([
    podIds.length
      ? db
          .from("pod_progress")
          .select("pod_id, course_id, node:pathway_nodes ( sequence_order )")
          .in("pod_id", podIds)
      : Promise.resolve({ data: [] as unknown[], error: null }),
    courses.length
      ? db
          .from("pathway_nodes")
          .select("course_id")
          .in(
            "course_id",
            courses.map((c) => c.id),
          )
      : Promise.resolve({ data: [] as unknown[], error: null }),
  ]);
  if (ppRes.error) throw new Error(`getChildReports (pod_progress): ${ppRes.error.message}`);
  if (nodeRes.error) throw new Error(`getChildReports (pathway_nodes): ${nodeRes.error.message}`);

  const posByPodCourse = new Map<string, number>();
  for (const row of (ppRes.data ?? []) as Record<string, unknown>[]) {
    const node = rel(row.node as unknown) as { sequence_order: number } | null;
    posByPodCourse.set(
      `${row.pod_id as string}:${row.course_id as string}`,
      node?.sequence_order ?? 0,
    );
  }

  const totalNodesByCourse = new Map<string, number>();
  for (const row of (nodeRes.data ?? []) as { course_id: string }[]) {
    totalNodesByCourse.set(row.course_id, (totalNodesByCourse.get(row.course_id) ?? 0) + 1);
  }

  const cpByStudent = groupBy(cpRes.data ?? [], (r) => r.student_user_id as string);
  const uaByStudent = groupBy(uaRes.data ?? [], (r) => r.student_user_id as string);
  const teByStudent = groupBy(teRes.data ?? [], (r) => r.student_user_id as string);

  return children.map((child) => {
    const pod = podByStudent.get(child.id) ?? null;
    const cpRows = cpByStudent.get(child.id) ?? [];
    const uaRows = uaByStudent.get(child.id) ?? [];
    const teRows = teByStudent.get(child.id) ?? [];

    const courseReports: CourseReport[] = courses.map((course) => ({
      courseId: course.id,
      courseName: course.name,
      gradeBand: course.grade_band,
      nodePosition: pod ? (posByPodCourse.get(`${pod.id}:${course.id}`) ?? 0) : 0,
      totalNodes: totalNodesByCourse.get(course.id) ?? 0,
      checkpoints: cpRows
        .filter((r) => rel(r.node as unknown as { course_id: string })?.course_id === course.id)
        .map((r) => ({
          nodeTitle: rel(r.node as unknown as { title: string })?.title ?? "-",
          passed: Boolean(r.passed),
          attemptedAt: r.attempted_at as string,
        })),
      unitAssessments: uaRows
        .filter((r) => rel(r.unit as unknown as { course_id: string })?.course_id === course.id)
        .map((r) => ({
          unitTitle: rel(r.unit as unknown as { title: string })?.title ?? "-",
          score: Number(r.score),
          passed: Boolean(r.passed),
          attemptedAt: r.attempted_at as string,
        })),
      termExams: teRows
        .filter((r) => (r.course_id as string) === course.id)
        .map((r) => ({
          termLabel: r.term_label as string,
          score: Number(r.score),
          attemptedAt: r.attempted_at as string,
        })),
    }));

    return { child, podName: pod?.name ?? null, courses: courseReports };
  });
}

function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = m.get(k) ?? [];
    list.push(r);
    m.set(k, list);
  }
  return m;
}

/** Full read-only report for one child, per course. Tenant-guarded by caller. */
export async function getChildReport(
  child: ChildRef,
  masjidId: string,
): Promise<ChildReport> {
  const [report] = await getChildReports([child], masjidId);
  return report ?? { child, podName: null, courses: [] };
}
