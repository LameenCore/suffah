// Aggregate metrics for the admin overview dashboard. One round of queries,
// masjid-scoped, all read-only.

import { getServiceClient } from "@/lib/db";
import { PASS_THRESHOLD } from "@/lib/types";

export interface CourseEngagement {
  courseId: string;
  courseName: string;
  totalNodes: number;
  nodesWithLesson: number;
  checkpointAttempts: number;
  checkpointPassRate: number; // 0..1
}

export interface AdminMetrics {
  pods: number;
  students: number;
  activeVolunteers: number;
  departedVolunteers: number;

  lessonsCompleted: number;
  checkpointAttempts: number;
  checkpointPassRate: number;
  studentsActive: number; // >=1 checkpoint attempt

  unitAttempts: number;
  unitAvgScore: number | null;
  unitPassRate: number;

  termExamAttempts: number;
  termExamAvgScore: number | null;

  waqf: {
    principal: number;
    returnsDisbursed: number; // negative
    sadaqah: number;
    scholarships: number; // negative
    spentOfReturnsPct: number; // rough: |returns| / (annual return assumption)
  };

  openHelpRequests: number;
  barakahNotes: number;
  seerahPending: number;

  courses: CourseEngagement[];
}

const n = (v: unknown) => Number(v ?? 0);

export async function getAdminMetrics(masjidId: string): Promise<AdminMetrics> {
  const db = getServiceClient();

  const [
    pods,
    students,
    volActive,
    volDeparted,
    lessons,
    checkpoints,
    units,
    exams,
    ledger,
    help,
    barakah,
    seerah,
    courseRows,
    nodeRows,
  ] = await Promise.all([
    db.from("pods").select("id", { count: "exact", head: true }).eq("masjid_id", masjidId),
    db
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("masjid_id", masjidId)
      .eq("role", "student"),
    db
      .from("volunteers")
      .select("id", { count: "exact", head: true })
      .eq("masjid_id", masjidId)
      .is("left_at", null),
    db
      .from("volunteers")
      .select("id", { count: "exact", head: true })
      .eq("masjid_id", masjidId)
      .not("left_at", "is", null),
    db.from("lesson_progress").select("id", { count: "exact", head: true }),
    db.from("checkpoint_results").select("student_user_id, passed, pathway_node_id"),
    db.from("unit_assessment_results").select("score, passed"),
    db.from("term_exam_results").select("score"),
    db.from("waqf_ledger").select("amount, entry_type").eq("masjid_id", masjidId),
    db
      .from("support_requests")
      .select("id", { count: "exact", head: true })
      .eq("masjid_id", masjidId)
      .eq("status", "open"),
    db.from("pod_barakah_log").select("id", { count: "exact", head: true }).eq("masjid_id", masjidId),
    db
      .from("lesson_contributions")
      .select("id", { count: "exact", head: true })
      .eq("incorporated", false),
    db.from("courses").select("id, name").eq("masjid_id", masjidId).order("name"),
    db.from("pathway_nodes").select("id, course_id, lesson_content"),
  ]);

  const cpRows = (checkpoints.data ?? []) as {
    student_user_id: string;
    passed: boolean;
    pathway_node_id: string;
  }[];
  const cpPassed = cpRows.filter((r) => r.passed === true).length;
  const activeStudents = new Set(cpRows.map((r) => r.student_user_id)).size;

  const uRows = (units.data ?? []) as { score: number; passed: boolean }[];
  const uAvg = uRows.length ? uRows.reduce((s, r) => s + n(r.score), 0) / uRows.length : null;
  const uPass = uRows.length ? uRows.filter((r) => r.passed).length / uRows.length : 0;

  const eRows = (exams.data ?? []) as { score: number }[];
  const eAvg = eRows.length ? eRows.reduce((s, r) => s + n(r.score), 0) / eRows.length : null;

  const led = (ledger.data ?? []) as { amount: number; entry_type: string }[];
  const sum = (t: string) =>
    led.filter((r) => r.entry_type === t).reduce((s, r) => s + n(r.amount), 0);
  const principal = sum("principal_deposit");
  const returnsDisbursed = sum("return_disbursed");
  const sadaqah = sum("sadaqah_received");
  const scholarships = sum("scholarship_allocated");

  const courses = (courseRows.data ?? []) as { id: string; name: string }[];
  const nodes = (nodeRows.data ?? []) as {
    id: string;
    course_id: string;
    lesson_content: unknown;
  }[];
  const courseIds = new Set(courses.map((c) => c.id));

  const cpByCourse = new Map<string, { attempts: number; passed: number }>();
  const nodeCourse = new Map(nodes.map((x) => [x.id, x.course_id]));
  for (const r of cpRows) {
    const cid = nodeCourse.get(r.pathway_node_id);
    if (!cid || !courseIds.has(cid)) continue;
    const cur = cpByCourse.get(cid) ?? { attempts: 0, passed: 0 };
    cur.attempts += 1;
    if (r.passed) cur.passed += 1;
    cpByCourse.set(cid, cur);
  }

  const courseEngagement: CourseEngagement[] = courses.map((c) => {
    const cNodes = nodes.filter((x) => x.course_id === c.id);
    const cp = cpByCourse.get(c.id) ?? { attempts: 0, passed: 0 };
    return {
      courseId: c.id,
      courseName: c.name,
      totalNodes: cNodes.length,
      nodesWithLesson: cNodes.filter((x) => x.lesson_content).length,
      checkpointAttempts: cp.attempts,
      checkpointPassRate: cp.attempts ? cp.passed / cp.attempts : 0,
    };
  });

  // rough "spent of returns" - assume a 4% annual draw on the principal as the ceiling
  const annualReturnCeiling = principal * 0.04 || 1;
  const spentOfReturnsPct = Math.min(1, Math.abs(returnsDisbursed) / (annualReturnCeiling * 1.5));

  return {
    pods: pods.count ?? 0,
    students: students.count ?? 0,
    activeVolunteers: volActive.count ?? 0,
    departedVolunteers: volDeparted.count ?? 0,

    lessonsCompleted: lessons.count ?? 0,
    checkpointAttempts: cpRows.length,
    checkpointPassRate: cpRows.length ? cpPassed / cpRows.length : 0,
    studentsActive: activeStudents,

    unitAttempts: uRows.length,
    unitAvgScore: uAvg,
    unitPassRate: uPass,

    termExamAttempts: eRows.length,
    termExamAvgScore: eAvg,

    waqf: {
      principal,
      returnsDisbursed,
      sadaqah,
      scholarships,
      spentOfReturnsPct,
    },

    openHelpRequests: help.count ?? 0,
    barakahNotes: barakah.count ?? 0,
    seerahPending: seerah.count ?? 0,

    courses: courseEngagement,
  };
}

export { PASS_THRESHOLD };
