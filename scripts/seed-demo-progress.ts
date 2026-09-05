/**
 * Seed a believable spread of student results so the compliance report (T12/T20)
 * and the parent dashboard have something real to show - on track / watch / gap
 * across the pod.
 *
 *   npm run seed:progress            # insert (skips if results already exist)
 *   npm run seed:progress -- --reset # wipe this pod's results first
 *
 * Writes checkpoint_results / unit_assessment_results / term_exam_results rows
 * directly (no grading) and sets pod_progress to match. T17 (demo seed cleanup)
 * can build on this.
 */

import { DEMO_MASJID_ID } from "@/lib/auth";
import { DEMO_TERM_LABEL } from "@/lib/types";
import { getServiceClient } from "@/lib/db";

const S = {
  yusuf: "00000000-0000-0000-0000-0000000000c1",
  maryam: "00000000-0000-0000-0000-0000000000c2",
  idris: "00000000-0000-0000-0000-0000000000c3",
  safiya: "00000000-0000-0000-0000-0000000000c4",
};
const POD = "00000000-0000-0000-0000-0000000000e1";
const COURSE = {
  math: "00000000-0000-0000-0000-0000000000f1",
  seerah: "00000000-0000-0000-0000-0000000000f2",
  ai: "00000000-0000-0000-0000-0000000000f3",
};
const UNIT = { math: "00000000-0000-0000-0000-000000010001" };
const NODE = {
  math1: "00000000-0000-0000-0000-000000020001",
  math2: "00000000-0000-0000-0000-000000020002",
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
    console.log("Wiped the pod's results.");
  }

  const { count } = await db
    .from("checkpoint_results")
    .select("id", { count: "exact", head: true })
    .in("student_user_id", students);
  if ((count ?? 0) > 0 && !reset) {
    console.log(`Pod already has ${count} checkpoint result(s) - pass --reset to redo.`);
    return;
  }

  // Yusuf - on track: passes Math 1 & 2, Math unit assessment, Seerah 1.
  await db.from("checkpoint_results").insert([
    { student_user_id: S.yusuf, pathway_node_id: NODE.math1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(12) },
    { student_user_id: S.yusuf, pathway_node_id: NODE.math2, passed: true, answer_data: { score: 0.75 }, attempted_at: daysAgo(6) },
    { student_user_id: S.yusuf, pathway_node_id: NODE.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(9) },
  ]);
  await db.from("unit_assessment_results").insert({
    student_user_id: S.yusuf, unit_id: UNIT.math, score: 0.86, passed: true, answer_data: {}, attempted_at: daysAgo(3),
  });

  // Maryam - watch: Math 1 passed on the 2nd try, no unit assessment.
  await db.from("checkpoint_results").insert([
    { student_user_id: S.maryam, pathway_node_id: NODE.math1, passed: false, answer_data: { score: 0.5 }, attempted_at: daysAgo(11) },
    { student_user_id: S.maryam, pathway_node_id: NODE.math1, passed: true, answer_data: { score: 0.75 }, attempted_at: daysAgo(10) },
    { student_user_id: S.maryam, pathway_node_id: NODE.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(8) },
  ]);

  // Idris - gap in Math: attempted, low pass rate. Seerah fine.
  await db.from("checkpoint_results").insert([
    { student_user_id: S.idris, pathway_node_id: NODE.math1, passed: false, answer_data: { score: 0.25 }, attempted_at: daysAgo(10) },
    { student_user_id: S.idris, pathway_node_id: NODE.math1, passed: false, answer_data: { score: 0.5 }, attempted_at: daysAgo(7) },
    { student_user_id: S.idris, pathway_node_id: NODE.seerah1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(6) },
  ]);

  // Safiya - gap in AI Literacy: term exam attempted and failed.
  await db.from("checkpoint_results").insert([
    { student_user_id: S.safiya, pathway_node_id: NODE.ai1, passed: true, answer_data: { score: 0.75 }, attempted_at: daysAgo(9) },
    { student_user_id: S.safiya, pathway_node_id: NODE.math1, passed: true, answer_data: { score: 1 }, attempted_at: daysAgo(9) },
  ]);
  await db.from("term_exam_results").insert({
    student_user_id: S.safiya, course_id: COURSE.ai, term_label: DEMO_TERM_LABEL, score: 0.55, answer_data: { passed: false }, attempted_at: daysAgo(1),
  });

  // Pod position: Math at node 2, Seerah + AI at node 1.
  await db.from("pod_progress").update({ current_node_id: NODE.math2 }).eq("pod_id", POD).eq("course_id", COURSE.math);

  console.log(`Seeded results for term "${DEMO_TERM_LABEL}". Masjid ${DEMO_MASJID_ID}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
