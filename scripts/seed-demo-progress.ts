/**
 * Seed a believable spread of student results for the walkthrough. The demo
 * student (Yusuf - the default `student` dev role, and the parent's linked child)
 * is left FRESH on Math so demo step 1 (complete a lesson + checkpoint live)
 * works. The other three carry the on-track / watch / gap spread that makes the
 * compliance report worth showing.
 *
 *   npm run seed:progress            # insert (skips if results already exist)
 *   npm run seed:progress -- --reset # wipe this pod's results first
 *
 * Writes result rows directly (no grading) and leaves the pod at node 1 of each
 * course, with Br. Kareem reinstated as the pod volunteer.
 */

import { DEMO_TERM_LABEL } from "@/lib/types";
import { getServiceClient } from "@/lib/db";

const S = {
  yusuf: "00000000-0000-0000-0000-0000000000c1",
  maryam: "00000000-0000-0000-0000-0000000000c2",
  idris: "00000000-0000-0000-0000-0000000000c3",
  safiya: "00000000-0000-0000-0000-0000000000c4",
};
const POD = "00000000-0000-0000-0000-0000000000e1";
const HOME_VOLUNTEER = "00000000-0000-0000-0000-0000000000d1"; // Br. Kareem
const COURSE = {
  math: "00000000-0000-0000-0000-0000000000f1",
  seerah: "00000000-0000-0000-0000-0000000000f2",
  ai: "00000000-0000-0000-0000-0000000000f3",
};
const NODE = {
  math1: "00000000-0000-0000-0000-000000020001",
  seerah1: "00000000-0000-0000-0000-000000020101",
  ai1: "00000000-0000-0000-0000-000000020201",
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

async function main() {
  const reset = process.argv.includes("--reset");
  const db = getServiceClient();
  const students = Object.values(S);

  if (reset) {
    await db.from("checkpoint_results").delete().in("student_user_id", students);
    await db.from("unit_assessment_results").delete().in("student_user_id", students);
    await db.from("term_exam_results").delete().in("student_user_id", students);
    await db.from("compliance_reports").delete().in("student_user_id", students);
    await db.from("lesson_progress").delete().in("student_user_id", students);
    console.log("Wiped the pod's results + lesson progress.");
  }

  const { count } = await db
    .from("checkpoint_results")
    .select("id", { count: "exact", head: true })
    .in("student_user_id", students);
  if ((count ?? 0) > 0 && !reset) {
    console.log(`Pod already has ${count} checkpoint result(s) - pass --reset to redo.`);
    return;
  }

  // Yusuf - active in Seerah, FRESH on Math (demo step 1 completes it live).
  await db.from("checkpoint_results").insert([
    { student_user_id: S.yusuf, pathway_node_id: NODE.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(7) },
  ]);
  await db.from("lesson_progress").insert([
    { student_user_id: S.yusuf, pathway_node_id: NODE.seerah1, status: "lesson_complete" },
  ]);

  // Maryam - watch: passed Math node 1 on the 2nd attempt, Seerah fine.
  await db.from("checkpoint_results").insert([
    { student_user_id: S.maryam, pathway_node_id: NODE.math1, passed: false, answer_data: { score: 0.5 }, attempted_at: daysAgo(9) },
    { student_user_id: S.maryam, pathway_node_id: NODE.math1, passed: true, answer_data: { score: 0.75 }, attempted_at: daysAgo(8) },
    { student_user_id: S.maryam, pathway_node_id: NODE.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(6) },
  ]);

  // Idris - gap in Math: two failed attempts. Seerah fine.
  await db.from("checkpoint_results").insert([
    { student_user_id: S.idris, pathway_node_id: NODE.math1, passed: false, answer_data: { score: 0.25 }, attempted_at: daysAgo(9) },
    { student_user_id: S.idris, pathway_node_id: NODE.math1, passed: false, answer_data: { score: 0.5 }, attempted_at: daysAgo(5) },
    { student_user_id: S.idris, pathway_node_id: NODE.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(4) },
  ]);

  // Safiya - gap in AI Literacy: term exam attempted and failed. Math + AI node 1 fine.
  await db.from("checkpoint_results").insert([
    { student_user_id: S.safiya, pathway_node_id: NODE.math1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(8) },
    { student_user_id: S.safiya, pathway_node_id: NODE.ai1, passed: true, answer_data: { score: 0.75 }, attempted_at: daysAgo(6) },
  ]);
  await db.from("term_exam_results").insert({
    student_user_id: S.safiya, course_id: COURSE.ai, term_label: DEMO_TERM_LABEL, score: 0.55, answer_data: { passed: false }, attempted_at: daysAgo(1),
  });

  // Pod sits at node 1 of every course (Yusuf drives Math forward in the demo).
  await db.from("pod_progress").update({ current_node_id: NODE.math1 }).eq("pod_id", POD).eq("course_id", COURSE.math);
  await db.from("pod_progress").update({ current_node_id: NODE.seerah1 }).eq("pod_id", POD).eq("course_id", COURSE.seerah);
  await db.from("pod_progress").update({ current_node_id: NODE.ai1 }).eq("pod_id", POD).eq("course_id", COURSE.ai);

  // Reset the volunteer story (the handoff demo may have left Br. Kareem departed).
  await db.from("volunteers").update({ left_at: null, status: "active" }).eq("id", HOME_VOLUNTEER);
  await db.from("pods").update({ volunteer_id: HOME_VOLUNTEER }).eq("id", POD);

  console.log(`Seeded demo results for "${DEMO_TERM_LABEL}". Yusuf is fresh on Math for the walkthrough.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
