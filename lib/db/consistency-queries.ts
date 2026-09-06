// Consistency indicator (T52) - "you've shown up N days", never a ranking.
//
// Ethos guardrails (see the task + the Barakah work T23): this is shown ONLY to
// the student and their own parent, there is no comparison to other students, no
// points/badges/prizes, and no loss-aversion "don't break your streak" framing.
// It is a count of distinct days with any learning activity, nothing more.
//
// Activity = a lesson completed, or a checkpoint / unit assessment / term exam
// attempted. No new table - these timestamps already exist.

import { getServiceClient } from "@/lib/db";
import { getPresentDates } from "@/lib/db/attendance-queries";

// Quebec. All "which day" bucketing uses this zone so "today" matches the family.
const TZ = "America/Toronto";
const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** yyyy-mm-dd for an instant, in the Quebec timezone. */
function localDay(iso: string): string {
  return dayFmt.format(new Date(iso)); // en-CA gives yyyy-mm-dd
}

function todayLocal(): string {
  return dayFmt.format(new Date());
}

/** yyyy-mm-dd N days before today (local). */
function daysAgoLocal(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return dayFmt.format(d);
}

export interface Consistency {
  /** Distinct active days in the last 7 (including today). */
  daysThisWeek: number;
  /** Distinct active days since the 1st of the current month. */
  daysThisMonth: number;
  /** Most recent active day (yyyy-mm-dd) or null. */
  lastActive: string | null;
  /** Last 28 days oldest->newest, each a {date, active} for a dot strip. */
  recent: Array<{ date: string; active: boolean }>;
}

export async function getConsistency(
  studentUserId: string,
  masjidId: string,
): Promise<Consistency> {
  const db = getServiceClient();

  // Tenancy: the student must be in this masjid.
  const { data: student, error: sErr } = await db
    .from("users")
    .select("id, masjid_id, role")
    .eq("id", studentUserId)
    .maybeSingle();
  if (sErr) throw new Error(`getConsistency: ${sErr.message}`);
  if (!student || student.masjid_id !== masjidId || student.role !== "student") {
    return { daysThisWeek: 0, daysThisMonth: 0, lastActive: null, recent: [] };
  }

  const [lp, cp, ua, te, tut] = await Promise.all([
    db.from("lesson_progress").select("completed_at").eq("student_user_id", studentUserId),
    db.from("checkpoint_results").select("attempted_at").eq("student_user_id", studentUserId),
    db.from("unit_assessment_results").select("attempted_at").eq("student_user_id", studentUserId),
    db.from("term_exam_results").select("attempted_at").eq("student_user_id", studentUserId),
    db
      .from("tutor_messages")
      .select("created_at")
      .eq("student_user_id", studentUserId)
      .eq("role", "student"),
  ]);
  for (const [label, res] of [
    ["lesson_progress", lp],
    ["checkpoint_results", cp],
    ["unit_assessment_results", ua],
    ["term_exam_results", te],
    ["tutor_messages", tut],
  ] as const) {
    if (res.error) throw new Error(`getConsistency (${label}): ${res.error.message}`);
  }

  const days = new Set<string>();
  for (const r of lp.data ?? []) days.add(localDay(r.completed_at as string));
  for (const r of [...(cp.data ?? []), ...(ua.data ?? []), ...(te.data ?? [])]) {
    days.add(localDay(r.attempted_at as string));
  }
  for (const r of tut.data ?? []) days.add(localDay(r.created_at as string));
  // Enrichment-session attendance (T48): a day marked present is an engaged day.
  try {
    const present = await getPresentDates(studentUserId);
    for (const d of present) days.add(d); // already yyyy-mm-dd (session_date)
  } catch {
    // attendance is supplementary
  }

  const today = todayLocal();
  const weekCutoff = daysAgoLocal(6);
  const monthCutoff = today.slice(0, 7) + "-01";

  let daysThisWeek = 0;
  let daysThisMonth = 0;
  let lastActive: string | null = null;
  for (const d of days) {
    if (d >= weekCutoff && d <= today) daysThisWeek += 1;
    if (d >= monthCutoff && d <= today) daysThisMonth += 1;
    if (!lastActive || d > lastActive) lastActive = d;
  }

  const recent: Array<{ date: string; active: boolean }> = [];
  for (let i = 27; i >= 0; i -= 1) {
    const date = daysAgoLocal(i);
    recent.push({ date, active: days.has(date) });
  }

  return { daysThisWeek, daysThisMonth, lastActive, recent };
}
