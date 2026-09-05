// Masjid-scoped reads for the parent dashboard (T10). Read-only: parents monitor,
// they don't manage. Every function is scoped to the parent's masjid and to the
// children actually linked to that parent (parent_children, migration 0005).

import { getServiceClient } from "@/lib/db";
import { getPodForStudent } from "@/lib/db/queries";
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

/** Full read-only report for one child, per course. Tenant-guarded by caller. */
export async function getChildReport(
  child: ChildRef,
  masjidId: string,
): Promise<ChildReport> {
  const db = getServiceClient();
  const pod = await getPodForStudent(child.id, masjidId);

  const { data: courseRows, error: cErr } = await db
    .from("courses")
    .select("id, name, grade_band")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (cErr) throw new Error(`getChildReport: ${cErr.message}`);
  const courses = (courseRows ?? []) as {
    id: string;
    name: CourseName;
    grade_band: string;
  }[];

  // Pod position per course.
  const progressByCourse = new Map<string, number>();
  if (pod) {
    const { data: pp, error: ppErr } = await db
      .from("pod_progress")
      .select("course_id, node:pathway_nodes ( sequence_order )")
      .eq("pod_id", pod.id);
    if (ppErr) throw new Error(`getChildReport: ${ppErr.message}`);
    for (const row of pp ?? []) {
      const node = (Array.isArray(row.node) ? row.node[0] : row.node) as
        | { sequence_order: number }
        | null;
      progressByCourse.set(row.course_id as string, node?.sequence_order ?? 0);
    }
  }

  // Checkpoint results: node title + course.
  const { data: cpRows, error: cpErr } = await db
    .from("checkpoint_results")
    .select("passed, attempted_at, node:pathway_nodes!inner ( title, course_id )")
    .eq("student_user_id", child.id)
    .order("attempted_at", { ascending: true });
  if (cpErr) throw new Error(`getChildReport: ${cpErr.message}`);

  // Unit assessment results: unit title + course.
  const { data: uaRows, error: uaErr } = await db
    .from("unit_assessment_results")
    .select("score, passed, attempted_at, unit:units!inner ( title, course_id )")
    .eq("student_user_id", child.id)
    .order("attempted_at", { ascending: true });
  if (uaErr) throw new Error(`getChildReport: ${uaErr.message}`);

  // Term exam results: keyed by course directly.
  const { data: teRows, error: teErr } = await db
    .from("term_exam_results")
    .select("course_id, term_label, score, attempted_at")
    .eq("student_user_id", child.id)
    .order("attempted_at", { ascending: true });
  if (teErr) throw new Error(`getChildReport: ${teErr.message}`);

  const rel = <T,>(v: T | T[] | null | undefined): T | null =>
    v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v;

  const courseReports: CourseReport[] = [];
  for (const course of courses) {
    const totalNodesRes = await db
      .from("pathway_nodes")
      .select("id", { count: "exact", head: true })
      .eq("course_id", course.id);
    if (totalNodesRes.error) throw new Error(`getChildReport: ${totalNodesRes.error.message}`);

    const checkpoints: CheckpointLine[] = (cpRows ?? [])
      .filter((r) => rel(r.node as unknown as { course_id: string })?.course_id === course.id)
      .map((r) => {
        const node = rel(r.node as unknown as { title: string });
        return {
          nodeTitle: node?.title ?? "-",
          passed: Boolean(r.passed),
          attemptedAt: r.attempted_at as string,
        };
      });

    const unitAssessments: UnitAssessmentLine[] = (uaRows ?? [])
      .filter((r) => rel(r.unit as unknown as { course_id: string })?.course_id === course.id)
      .map((r) => {
        const unit = rel(r.unit as unknown as { title: string });
        return {
          unitTitle: unit?.title ?? "-",
          score: Number(r.score),
          passed: Boolean(r.passed),
          attemptedAt: r.attempted_at as string,
        };
      });

    const termExams: TermExamLine[] = (teRows ?? [])
      .filter((r) => (r.course_id as string) === course.id)
      .map((r) => ({
        termLabel: r.term_label as string,
        score: Number(r.score),
        attemptedAt: r.attempted_at as string,
      }));

    courseReports.push({
      courseId: course.id,
      courseName: course.name,
      gradeBand: course.grade_band,
      nodePosition: progressByCourse.get(course.id) ?? 0,
      totalNodes: totalNodesRes.count ?? 0,
      checkpoints,
      unitAssessments,
      termExams,
    });
  }

  return { child, podName: pod?.name ?? null, courses: courseReports };
}
