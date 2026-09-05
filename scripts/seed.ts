/**
 * Apply supabase/seed.sql's demo data through the service-role client.
 *
 *   npm run seed
 *
 * Idempotent: deletes the demo masjid first (FK cascade clears every child row),
 * then re-inserts. Mirrors supabase/seed.sql exactly — keep the two in sync.
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * This exists because the SQL file can only be run in the Supabase SQL editor or
 * via the CLI, and neither is wired up for this hackathon environment.
 */

import { getServiceClient } from "@/lib/db";

const MASJID = "00000000-0000-0000-0000-000000000001";
const U = {
  admin: "00000000-0000-0000-0000-0000000000a1",
  parent: "00000000-0000-0000-0000-0000000000b1",
  yusuf: "00000000-0000-0000-0000-0000000000c1",
  maryam: "00000000-0000-0000-0000-0000000000c2",
  idris: "00000000-0000-0000-0000-0000000000c3",
  safiya: "00000000-0000-0000-0000-0000000000c4",
};
const VOLUNTEER = "00000000-0000-0000-0000-0000000000d1";
const POD = "00000000-0000-0000-0000-0000000000e1";
const COURSE = {
  math: "00000000-0000-0000-0000-0000000000f1",
  seerah: "00000000-0000-0000-0000-0000000000f2",
  ai: "00000000-0000-0000-0000-0000000000f3",
};
const UNIT = {
  math: "00000000-0000-0000-0000-000000010001",
  seerah: "00000000-0000-0000-0000-000000010002",
  ai: "00000000-0000-0000-0000-000000010003",
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const monthsAgo = (n: number) => daysAgo(n * 30);

async function seed() {
  const db = getServiceClient();
  const check = <T,>(res: { error: { message: string } | null; data: T }): T => {
    if (res.error) throw new Error(res.error.message);
    return res.data;
  };

  // Wipe (FK cascade from masjids clears users, pods, courses, ledger, …)
  check(await db.from("masjids").delete().eq("id", MASJID));

  check(await db.from("masjids").insert({ id: MASJID, name: "Masjid As-Suffa (Demo)" }));

  check(
    await db.from("users").insert([
      { id: U.admin, masjid_id: MASJID, role: "admin", name: "Masjid Admin", email: "admin@suffa.demo" },
      { id: U.parent, masjid_id: MASJID, role: "parent", name: "Parent (Demo Family)", email: "parent@suffa.demo" },
      { id: U.yusuf, masjid_id: MASJID, role: "student", name: "Yusuf (Secondary 1)", email: "yusuf@suffa.demo" },
      { id: U.maryam, masjid_id: MASJID, role: "student", name: "Maryam (Secondary 1)", email: "maryam@suffa.demo" },
      { id: U.idris, masjid_id: MASJID, role: "student", name: "Idris (Secondary 1)", email: "idris@suffa.demo" },
      { id: U.safiya, masjid_id: MASJID, role: "student", name: "Safiya (Secondary 1)", email: "safiya@suffa.demo" },
    ]),
  );

  check(
    await db.from("volunteers").insert([
      {
        id: VOLUNTEER,
        masjid_id: MASJID,
        user_id: null,
        name: "Br. Kareem",
        status: "active",
        certification_note: "CEGEP math tutor; reference check on file (mock).",
        joined_at: daysAgo(40),
        left_at: null,
      },
      {
        // Departed volunteer — seeds a non-empty churn log (T15). Her pod kept
        // its pod_progress and was picked up by Br. Kareem.
        id: "00000000-0000-0000-0000-0000000000d2",
        masjid_id: MASJID,
        user_id: null,
        name: "Sr. Amina",
        status: "inactive",
        certification_note: "Undergrad education student; moved cities.",
        joined_at: daysAgo(150),
        left_at: daysAgo(20),
      },
    ]),
  );

  check(
    await db.from("pods").insert({ id: POD, masjid_id: MASJID, name: "Pod Al-Farabi", volunteer_id: VOLUNTEER }),
  );
  check(
    await db.from("pod_students").insert([
      { pod_id: POD, student_user_id: U.yusuf },
      { pod_id: POD, student_user_id: U.maryam },
      { pod_id: POD, student_user_id: U.idris },
      { pod_id: POD, student_user_id: U.safiya },
    ]),
  );

  check(
    await db.from("courses").insert([
      { id: COURSE.math, masjid_id: MASJID, name: "Math", grade_band: "Secondary 1" },
      { id: COURSE.seerah, masjid_id: MASJID, name: "Seerah", grade_band: "Secondary 1" },
      { id: COURSE.ai, masjid_id: MASJID, name: "AI Literacy", grade_band: "Secondary 1" },
    ]),
  );
  check(
    await db.from("units").insert([
      { id: UNIT.math, course_id: COURSE.math, title: "Operations with Integers", sequence_order: 1 },
      { id: UNIT.seerah, course_id: COURSE.seerah, title: "The Meccan Period", sequence_order: 1 },
      { id: UNIT.ai, course_id: COURSE.ai, title: "What a Model Actually Does", sequence_order: 1 },
    ]),
  );

  // Node ids match supabase/seed.sql: math 2000x, seerah 2010x, ai 2020x.
  const N = {
    math1: "00000000-0000-0000-0000-000000020001",
    math2: "00000000-0000-0000-0000-000000020002",
    math3: "00000000-0000-0000-0000-000000020003",
    seerah1: "00000000-0000-0000-0000-000000020101",
    seerah2: "00000000-0000-0000-0000-000000020102",
    seerah3: "00000000-0000-0000-0000-000000020103",
    ai1: "00000000-0000-0000-0000-000000020201",
    ai2: "00000000-0000-0000-0000-000000020202",
    ai3: "00000000-0000-0000-0000-000000020203",
  };
  check(
    await db.from("pathway_nodes").insert([
      { id: N.math1, course_id: COURSE.math, unit_id: UNIT.math, sequence_order: 1, title: "Adding and subtracting integers" },
      { id: N.math2, course_id: COURSE.math, unit_id: UNIT.math, sequence_order: 2, title: "Multiplying and dividing integers" },
      { id: N.math3, course_id: COURSE.math, unit_id: UNIT.math, sequence_order: 3, title: "Order of operations with integers" },
      { id: N.seerah1, course_id: COURSE.seerah, unit_id: UNIT.seerah, sequence_order: 1, title: "Mecca before the revelation" },
      { id: N.seerah2, course_id: COURSE.seerah, unit_id: UNIT.seerah, sequence_order: 2, title: "The first revelation" },
      { id: N.seerah3, course_id: COURSE.seerah, unit_id: UNIT.seerah, sequence_order: 3, title: "The early community and its trials" },
      { id: N.ai1, course_id: COURSE.ai, unit_id: UNIT.ai, sequence_order: 1, title: "Prediction, not knowledge" },
      { id: N.ai2, course_id: COURSE.ai, unit_id: UNIT.ai, sequence_order: 2, title: "Training data and where it comes from" },
      { id: N.ai3, course_id: COURSE.ai, unit_id: UNIT.ai, sequence_order: 3, title: "Why models get things confidently wrong" },
    ]),
  );

  check(
    await db.from("pod_progress").insert([
      { pod_id: POD, course_id: COURSE.math, current_node_id: N.math1 },
      { pod_id: POD, course_id: COURSE.seerah, current_node_id: N.seerah1 },
      { pod_id: POD, course_id: COURSE.ai, current_node_id: N.ai1 },
    ]),
  );

  // Mock ledger — no payment processing. Principal stays locked at 250k; only
  // the returns are spent (rising quarterly operating draws); sadaqah tops up the
  // scholarship pool. Principal must never be summed into "spendable" totals.
  check(
    await db.from("waqf_ledger").insert([
      { masjid_id: MASJID, entry_type: "principal_deposit", amount: 250000, note: "Founding waqf endowment (locked principal)", created_at: monthsAgo(15) },
      { masjid_id: MASJID, entry_type: "return_disbursed", amount: -3000, note: "Operating draw — hosting + pod coordination", created_at: monthsAgo(13) },
      { masjid_id: MASJID, entry_type: "return_disbursed", amount: -3150, note: "Operating draw", created_at: monthsAgo(10) },
      { masjid_id: MASJID, entry_type: "return_disbursed", amount: -3300, note: "Operating draw", created_at: monthsAgo(7) },
      { masjid_id: MASJID, entry_type: "return_disbursed", amount: -3450, note: "Operating draw", created_at: monthsAgo(4) },
      { masjid_id: MASJID, entry_type: "return_disbursed", amount: -3600, note: "Operating draw", created_at: monthsAgo(1) },
      { masjid_id: MASJID, entry_type: "sadaqah_received", amount: 2000, note: "Eid al-Adha giving campaign", created_at: monthsAgo(11) },
      { masjid_id: MASJID, entry_type: "sadaqah_received", amount: 5000, note: "Ramadan scholarship drive", created_at: monthsAgo(5) },
      { masjid_id: MASJID, entry_type: "sadaqah_received", amount: 1200, note: "Weekly jumu'ah sadaqah (aggregated)", created_at: monthsAgo(1) },
      { masjid_id: MASJID, entry_type: "scholarship_allocated", amount: -1200, note: "Safiya — full fee scholarship (Term 1)", created_at: monthsAgo(6) },
      { masjid_id: MASJID, entry_type: "scholarship_allocated", amount: -1200, note: "Safiya — full fee scholarship (Term 2)", created_at: monthsAgo(1) },
    ]),
  );

  check(
    await db.from("family_fee_status").insert([
      { masjid_id: MASJID, student_user_id: U.yusuf, status: "fee_paid" },
      { masjid_id: MASJID, student_user_id: U.maryam, status: "fee_paid" },
      { masjid_id: MASJID, student_user_id: U.idris, status: "fee_paid" },
      { masjid_id: MASJID, student_user_id: U.safiya, status: "scholarship_covered" },
    ]),
  );

  // Family link (parent_children — migration 0005): the demo parent monitors
  // Yusuf, the student who moves through the playground during the demo.
  check(
    await db.from("parent_children").insert([
      { parent_user_id: U.parent, student_user_id: U.yusuf },
    ]),
  );

  // Waqf-to-outcome links (sponsorships — migration 0006). Illustrative mapping;
  // outcomes are read from real pod_progress / unit_assessment_results.
  check(
    await db.from("sponsorships").insert([
      { masjid_id: MASJID, sponsor_label: "Founding endowment allocation", amount: 1500, pod_id: POD, unit_id: UNIT.math, note: "Sponsors Pod Al-Farabi through the integers unit (Math)." },
      { masjid_id: MASJID, sponsor_label: "Ramadan drive — anonymous", amount: 900, pod_id: POD, unit_id: UNIT.seerah, note: "Sponsors the Meccan Period unit (Seerah)." },
      { masjid_id: MASJID, sponsor_label: "Local family gift", amount: 750, pod_id: POD, unit_id: UNIT.ai, note: "Sponsors the AI-literacy intro unit." },
    ]),
  );

  // Barakah notes (pod_barakah_log — migration 0007). Short observations, never
  // scores. student_user_id null = whole-pod note.
  check(
    await db.from("pod_barakah_log").insert([
      { masjid_id: MASJID, pod_id: POD, student_user_id: null, indicator: "attendance", note: "Full pod present for all four sessions this week.", recorded_by: "Br. Kareem", recorded_at: daysAgo(3) },
      { masjid_id: MASJID, pod_id: POD, student_user_id: null, indicator: "adab", note: "Circle settled quickly; made du'a together before starting.", recorded_by: "Br. Kareem", recorded_at: daysAgo(3) },
      { masjid_id: MASJID, pod_id: POD, student_user_id: U.yusuf, indicator: "cooperation", note: "Helped Idris work through sign errors without being asked.", recorded_by: "Br. Kareem", recorded_at: daysAgo(6) },
      { masjid_id: MASJID, pod_id: POD, student_user_id: U.yusuf, indicator: "reflection", note: 'Thoughtful reflection on what "prediction, not knowledge" means.', recorded_by: "Br. Kareem", recorded_at: daysAgo(9) },
      { masjid_id: MASJID, pod_id: POD, student_user_id: U.maryam, indicator: "cooperation", note: "Maryam slowed down to check her work and explained a step to Safiya.", recorded_by: "Br. Kareem", recorded_at: daysAgo(6) },
    ]),
  );

  console.log("Seeded demo masjid:", MASJID);
}

seed().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
