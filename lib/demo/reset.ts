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
    math2: "00000000-0000-0000-0000-000000020002",
    seerah1: "00000000-0000-0000-0000-000000020101",
    ai1: "00000000-0000-0000-0000-000000020201",
  },
} as const;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const dateDaysAgo = (n: number) => daysAgo(n).slice(0, 10);

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
  await db.from("review_items").delete().in("student_user_id", students);
  await db.from("tutor_messages").delete().in("student_user_id", students);
  await db.from("node_remediations").delete().in("student_user_id", students);
  await db.from("path_events").delete().in("student_user_id", students);

  // 2. Wipe the continuity trail so demo step 3 regenerates a fresh briefing.
  await db.from("pod_briefings").delete().eq("pod_id", DEMO.pod);
  await db
    .from("pod_session_notes")
    .delete()
    .eq("pod_id", DEMO.pod)
    .eq("author_kind", "system");
  // Enrichment-session attendance (T48). Deleting the sessions cascades to
  // attendance_records.
  await db.from("enrichment_sessions").delete().eq("pod_id", DEMO.pod);

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

  // 6. Adaptive-path (T42) demo state: Idris got a re-teach on Math node 1 after
  // two misses; Safiya aced it cold and is a fast-track candidate for node 2.
  await db.from("node_remediations").insert({
    student_user_id: DEMO.students.idris,
    pathway_node_id: DEMO.node.math1,
    missed_concepts: ["adding integers with different signs", "subtracting a negative"],
    content: {
      summary:
        "The sign rules are what tripped you up. Let's redo just those with a number line.",
      points: [
        "Adding a negative moves you LEFT on the number line; adding a positive moves RIGHT.",
        "Subtracting a negative is the same as adding a positive: 5 - (-3) = 5 + 3 = 8.",
      ],
      examples: [
        { prompt: "-4 + 7", solution: "Start at -4, move 7 right -> land on 3." },
        { prompt: "2 - (-5)", solution: "Change to 2 + 5 -> 7." },
      ],
    },
    source: "fallback",
  });
  await db.from("path_events").insert([
    {
      student_user_id: DEMO.students.idris,
      pathway_node_id: DEMO.node.math1,
      kind: "remediation_shown",
      detail: { missedCount: 2, source: "fallback" },
      created_at: daysAgo(5),
    },
    {
      student_user_id: DEMO.students.safiya,
      pathway_node_id: DEMO.node.math2,
      kind: "fast_track_suggested",
      detail: { afterNodeId: DEMO.node.math1, score: 1 },
      created_at: daysAgo(8),
    },
  ]);

  // 7. Enrichment-session attendance (T48): two recent sessions. Idris missed
  //    the most recent one - shows up in the parent view + handoff briefing.
  // recorded_by references users(id); the demo's home volunteer is a volunteers
  // row, not a user, so leave it null here.
  const { data: sessionRows, error: sessionErr } = await db
    .from("enrichment_sessions")
    .insert([
      { masjid_id: DEMO.masjidId, pod_id: DEMO.pod, session_date: dateDaysAgo(10), topic: "Group reading circle", recorded_by: null },
      { masjid_id: DEMO.masjidId, pod_id: DEMO.pod, session_date: dateDaysAgo(3), topic: "Seerah discussion + du'a", recorded_by: null },
    ])
    .select("id, session_date");
  if (sessionErr) throw new Error(`reset: seeding attendance sessions: ${sessionErr.message}`);
  if (sessionRows && sessionRows.length === 2) {
    const byDate = new Map(sessionRows.map((s) => [s.session_date as string, s.id as string]));
    const s1 = byDate.get(dateDaysAgo(10))!;
    const s2 = byDate.get(dateDaysAgo(3))!;
    await db.from("attendance_records").insert([
      { session_id: s1, student_user_id: DEMO.students.yusuf, status: "present" },
      { session_id: s1, student_user_id: DEMO.students.maryam, status: "present" },
      { session_id: s1, student_user_id: DEMO.students.idris, status: "present" },
      { session_id: s1, student_user_id: DEMO.students.safiya, status: "excused" },
      { session_id: s2, student_user_id: DEMO.students.yusuf, status: "present" },
      { session_id: s2, student_user_id: DEMO.students.maryam, status: "present" },
      { session_id: s2, student_user_id: DEMO.students.idris, status: "absent" },
      { session_id: s2, student_user_id: DEMO.students.safiya, status: "present" },
    ]);
  }

  return { ok: true, clearedFor: ["progress", "results", "compliance snapshots", "continuity trail", "attendance", "volunteer handoff"] };
}
