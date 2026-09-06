// Enrichment-session attendance (T48). Masjid-scoped throughout.

import { getServiceClient } from "@/lib/db";
import { unwrapRelation } from "@/lib/db/rel";

export type AttendanceStatus = "present" | "absent" | "excused";

export interface SessionRecord {
  id: string;
  date: string;
  topic: string | null;
  present: number;
  absent: number;
  excused: number;
  perStudent: Array<{ studentUserId: string; name: string; status: AttendanceStatus }>;
}

async function assertPodInMasjid(podId: string, masjidId: string): Promise<void> {
  const { data, error } = await getServiceClient()
    .from("pods")
    .select("id, masjid_id")
    .eq("id", podId)
    .maybeSingle();
  if (error) throw new Error(`attendance: ${error.message}`);
  if (!data || data.masjid_id !== masjidId) throw new Error("pod not found in this masjid");
}

/**
 * Record (or overwrite) one enrichment session's attendance. `records` is
 * studentUserId -> status; students not listed are skipped. Idempotent per
 * (pod, date).
 */
export async function recordSessionAttendance(
  masjidId: string,
  podId: string,
  input: {
    date: string;
    topic: string | null;
    recordedBy: string | null;
    records: Record<string, AttendanceStatus>;
  },
): Promise<void> {
  await assertPodInMasjid(podId, masjidId);
  const db = getServiceClient();

  // Only students actually in the pod.
  const { data: members, error: mErr } = await db
    .from("pod_students")
    .select("student_user_id")
    .eq("pod_id", podId);
  if (mErr) throw new Error(`recordSessionAttendance: ${mErr.message}`);
  const inPod = new Set((members ?? []).map((m) => m.student_user_id as string));

  const { data: session, error: sErr } = await db
    .from("enrichment_sessions")
    .upsert(
      {
        masjid_id: masjidId,
        pod_id: podId,
        session_date: input.date,
        topic: input.topic?.trim() || null,
        recorded_by: input.recordedBy,
      },
      { onConflict: "pod_id,session_date" },
    )
    .select("id")
    .single();
  if (sErr) throw new Error(`recordSessionAttendance: ${sErr.message}`);
  const sessionId = session.id as string;

  const rows = Object.entries(input.records)
    .filter(([sid]) => inPod.has(sid))
    .map(([student_user_id, status]) => ({ session_id: sessionId, student_user_id, status }));
  if (rows.length === 0) return;

  const { error: aErr } = await db
    .from("attendance_records")
    .upsert(rows, { onConflict: "session_id,student_user_id" });
  if (aErr) throw new Error(`recordSessionAttendance: ${aErr.message}`);
}

/** Recent sessions for a pod, newest first. */
export async function listPodSessions(
  podId: string,
  masjidId: string,
  limit = 12,
): Promise<SessionRecord[]> {
  await assertPodInMasjid(podId, masjidId);
  const db = getServiceClient();

  const { data: sessions, error } = await db
    .from("enrichment_sessions")
    .select("id, session_date, topic")
    .eq("pod_id", podId)
    .order("session_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listPodSessions: ${error.message}`);
  const sessionRows = (sessions ?? []) as { id: string; session_date: string; topic: string | null }[];
  if (sessionRows.length === 0) return [];

  const ids = sessionRows.map((s) => s.id);
  const { data: recs, error: rErr } = await db
    .from("attendance_records")
    .select("session_id, student_user_id, status, student:users!inner ( name )")
    .in("session_id", ids);
  if (rErr) throw new Error(`listPodSessions: ${rErr.message}`);

  const bySession = new Map<string, SessionRecord["perStudent"]>();
  for (const r of recs ?? []) {
    const nameRel = unwrapRelation(r.student);
    const list = bySession.get(r.session_id as string) ?? [];
    list.push({
      studentUserId: r.student_user_id as string,
      name: (nameRel as { name: string } | null)?.name ?? "-",
      status: r.status as AttendanceStatus,
    });
    bySession.set(r.session_id as string, list);
  }

  return sessionRows.map((s) => {
    const perStudent = (bySession.get(s.id) ?? []).sort((a, b) => a.name.localeCompare(b.name));
    return {
      id: s.id,
      date: s.session_date,
      topic: s.topic,
      present: perStudent.filter((x) => x.status === "present").length,
      absent: perStudent.filter((x) => x.status === "absent").length,
      excused: perStudent.filter((x) => x.status === "excused").length,
      perStudent,
    };
  });
}

export interface ChildAttendanceSummary {
  sessions: number;
  present: number;
  excused: number;
  absent: number;
  /** Most recent few, newest first. */
  recent: Array<{ date: string; status: AttendanceStatus; topic: string | null }>;
}

/** A parent's view of ONE child - counts + recent, no other family's detail. */
export async function getChildAttendanceSummary(
  studentUserId: string,
  masjidId: string,
): Promise<ChildAttendanceSummary> {
  const db = getServiceClient();

  const { data: student } = await db
    .from("users")
    .select("masjid_id, role")
    .eq("id", studentUserId)
    .maybeSingle();
  if (!student || student.masjid_id !== masjidId || student.role !== "student") {
    return { sessions: 0, present: 0, excused: 0, absent: 0, recent: [] };
  }

  const { data, error } = await db
    .from("attendance_records")
    .select("status, session:enrichment_sessions!inner ( session_date, topic, masjid_id )")
    .eq("student_user_id", studentUserId);
  if (error) throw new Error(`getChildAttendanceSummary: ${error.message}`);

  const rows = (data ?? [])
    .map((r) => {
      const s = unwrapRelation(r.session);
      return { status: r.status as AttendanceStatus, session: s as { session_date: string; topic: string | null; masjid_id: string } | null };
    })
    .filter((r) => r.session && r.session.masjid_id === masjidId)
    .sort((a, b) => (b.session!.session_date > a.session!.session_date ? 1 : -1));

  return {
    sessions: rows.length,
    present: rows.filter((r) => r.status === "present").length,
    excused: rows.filter((r) => r.status === "excused").length,
    absent: rows.filter((r) => r.status === "absent").length,
    recent: rows.slice(0, 4).map((r) => ({
      date: r.session!.session_date,
      status: r.status,
      topic: r.session!.topic,
    })),
  };
}

/** Per-student recent attendance for the continuity briefing (T18). */
export async function getPodAttendanceSignal(
  podId: string,
  masjidId: string,
): Promise<Array<{ studentName: string; present: number; absent: number; lastAbsentDate: string | null }>> {
  const sessions = await listPodSessions(podId, masjidId, 6);
  const byStudent = new Map<string, { present: number; absent: number; lastAbsentDate: string | null }>();
  for (const s of sessions) {
    for (const r of s.perStudent) {
      const cur = byStudent.get(r.name) ?? { present: 0, absent: 0, lastAbsentDate: null };
      if (r.status === "present") cur.present += 1;
      if (r.status === "absent") {
        cur.absent += 1;
        if (!cur.lastAbsentDate) cur.lastAbsentDate = s.date;
      }
      byStudent.set(r.name, cur);
    }
  }
  return [...byStudent.entries()].map(([studentName, v]) => ({ studentName, ...v }));
}

/** Distinct yyyy-mm-dd dates a student was marked present - fed to T52 consistency. */
export async function getPresentDates(studentUserId: string): Promise<string[]> {
  const { data, error } = await getServiceClient()
    .from("attendance_records")
    .select("status, session:enrichment_sessions!inner ( session_date )")
    .eq("student_user_id", studentUserId)
    .eq("status", "present");
  if (error) throw new Error(`getPresentDates: ${error.message}`);
  return (data ?? [])
    .map((r) => {
      const s = unwrapRelation(r.session);
      return (s as { session_date: string } | null)?.session_date ?? null;
    })
    .filter((d): d is string => d != null);
}
