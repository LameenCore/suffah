// Reset the volatile walkthrough state to its seeded starting point, WITHOUT
// re-generating any AI content. Shared by `npm run seed:progress -- --reset` and
// the in-app "Reset walkthrough" button (POST /api/demo/reset), so the two never
// drift.
//
// What it does NOT touch: the generated curriculum (lesson_content /
// checkpoint_content / assessment_content / term_exams), which is expensive to
// rebuild and unchanged by a demo run.

import { getServiceClient } from "@/lib/db";
import { DEMO_TERM_LABEL } from "@/lib/types";

// Fixed demo ids - must match supabase/seed.sql.
const DEMO = {
  masjidId: "00000000-0000-0000-0000-000000000001",
  pod: "00000000-0000-0000-0000-0000000000e1",
  homeVolunteer: "00000000-0000-0000-0000-0000000000d1", // Br. Kareem
  students: {
    yusuf: "00000000-0000-0000-0000-0000000000c1",
    maryam: "00000000-0000-0000-0000-0000000000c2",
    idris: "00000000-0000-0000-0000-0000000000c3",
    safiya: "00000000-0000-0000-0000-0000000000c4",
  },
  course: {
    math: "00000000-0000-0000-0000-0000000000f1",
    seerah: "00000000-0000-0000-0000-0000000000f2",
    ai: "00000000-0000-0000-0000-0000000000f3",
  },
  node: {
    math1: "00000000-0000-0000-0000-000000020001",
    seerah1: "00000000-0000-0000-0000-000000020101",
    ai1: "00000000-0000-0000-0000-000000020201",
  },
} as const;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export interface ResetSummary {
  ok: true;
  clearedFor: string[];
}

/**
 * Idempotent. Only ever operates on the single demo masjid's fixtures.
 * `masjidId` is checked so the endpoint can't be pointed at another tenant.
 */
export async function resetWalkthroughState(masjidId: string): Promise<ResetSummary> {
  if (masjidId !== DEMO.masjidId) {
    throw new Error("reset is only available for the demo masjid");
  }
  const db = getServiceClient();
  const students = Object.values(DEMO.students);

  // 1. Wipe every per-student result + lesson progress for the pod.
  await db.from("checkpoint_results").delete().in("student_user_id", students);
  await db.from("unit_assessment_results").delete().in("student_user_id", students);
  await db.from("term_exam_results").delete().in("student_user_id", students);
  await db.from("compliance_reports").delete().in("student_user_id", students);
  await db.from("lesson_progress").delete().in("student_user_id", students);

  // 2. Wipe the continuity trail so demo step 3 regenerates a fresh briefing.
  await db.from("pod_briefings").delete().eq("pod_id", DEMO.pod);
  await db
    .from("pod_session_notes")
    .delete()
    .eq("pod_id", DEMO.pod)
    .eq("author_kind", "system");

  // 3. Re-seed the on-track / watch / gap spread (Yusuf stays FRESH on Math).
  await db.from("checkpoint_results").insert([
    { student_user_id: DEMO.students.yusuf, pathway_node_id: DEMO.node.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(7) },
    { student_user_id: DEMO.students.maryam, pathway_node_id: DEMO.node.math1, passed: false, answer_data: { score: 0.5 }, attempted_at: daysAgo(9) },
    { student_user_id: DEMO.students.maryam, pathway_node_id: DEMO.node.math1, passed: true, answer_data: { score: 0.75 }, attempted_at: daysAgo(8) },
    { student_user_id: DEMO.students.maryam, pathway_node_id: DEMO.node.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(6) },
    { student_user_id: DEMO.students.idris, pathway_node_id: DEMO.node.math1, passed: false, answer_data: { score: 0.25 }, attempted_at: daysAgo(9) },
    { student_user_id: DEMO.students.idris, pathway_node_id: DEMO.node.math1, passed: false, answer_data: { score: 0.5 }, attempted_at: daysAgo(5) },
    { student_user_id: DEMO.students.idris, pathway_node_id: DEMO.node.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(4) },
    { student_user_id: DEMO.students.safiya, pathway_node_id: DEMO.node.math1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(8) },
    { student_user_id: DEMO.students.safiya, pathway_node_id: DEMO.node.ai1, passed: true, answer_data: { score: 0.75 }, attempted_at: daysAgo(6) },
  ]);
  await db.from("lesson_progress").insert([
    { student_user_id: DEMO.students.yusuf, pathway_node_id: DEMO.node.seerah1, status: "lesson_complete" },
  ]);
  await db.from("term_exam_results").insert({
    student_user_id: DEMO.students.safiya,
    course_id: DEMO.course.ai,
    term_label: DEMO_TERM_LABEL,
    score: 0.55,
    answer_data: { passed: false },
    attempted_at: daysAgo(1),
  });

  // 4. Pod back to node 1 of every course.
  await db.from("pod_progress").update({ current_node_id: DEMO.node.math1 }).eq("pod_id", DEMO.pod).eq("course_id", DEMO.course.math);
  await db.from("pod_progress").update({ current_node_id: DEMO.node.seerah1 }).eq("pod_id", DEMO.pod).eq("course_id", DEMO.course.seerah);
  await db.from("pod_progress").update({ current_node_id: DEMO.node.ai1 }).eq("pod_id", DEMO.pod).eq("course_id", DEMO.course.ai);

  // 5. Undo the volunteer handoff.
  await db.from("volunteers").update({ left_at: null, status: "active" }).eq("id", DEMO.homeVolunteer);
  await db.from("pods").update({ volunteer_id: DEMO.homeVolunteer }).eq("id", DEMO.pod);

  return { ok: true, clearedFor: ["progress", "results", "compliance snapshots", "continuity trail", "volunteer handoff"] };
}
