// Pod "barakah" notes (T23). Soft, values-framed observations - consistency,
// helping others, reflection, adab. Deliberately NOT scored and NOT ranked:
// reads return observations and calm summary phrases, never a number or a
// leaderboard position.

import { getServiceClient } from "@/lib/db";
import { getReadClient } from "@/lib/db/server";

export type BarakahIndicator = "attendance" | "cooperation" | "reflection" | "adab";

export const BARAKAH_INDICATORS: { key: BarakahIndicator; label: string; hint: string }[] = [
  { key: "attendance", label: "Attendance & consistency", hint: "showed up steadily" },
  { key: "cooperation", label: "Helping others", hint: "supported a podmate" },
  { key: "reflection", label: "Reflection & engagement", hint: "engaged thoughtfully" },
  { key: "adab", label: "Adab in the circle", hint: "good manners in the group" },
];

const LABEL = new Map(BARAKAH_INDICATORS.map((i) => [i.key, i.label]));

// Calm phrases surfaced to parents - one per indicator that has any notes.
const PHRASE: Record<BarakahIndicator, string> = {
  attendance: "attends consistently",
  cooperation: "helps others in group sessions",
  reflection: "engages thoughtfully in reflection",
  adab: "shows good adab in the circle",
};

export interface BarakahEntry {
  id: string;
  podId: string;
  podName: string;
  studentUserId: string | null;
  studentName: string | null;
  indicator: BarakahIndicator;
  indicatorLabel: string;
  note: string | null;
  recordedBy: string;
  recordedAt: string;
}

function isIndicator(v: string): v is BarakahIndicator {
  return v === "attendance" || v === "cooperation" || v === "reflection" || v === "adab";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A PostgREST `.or()` filter is built from a string, so any id spliced into it
 * must be a real UUID and nothing else - never free text. All callers pass
 * session/DB ids, but validate anyway (defense in depth).
 */
function assertUuid(value: string, label: string): string {
  if (!UUID_RE.test(value)) throw new Error(`${label} is not a valid id`);
  return value;
}

async function shapeRows(
  rows: Record<string, unknown>[],
  masjidId: string,
): Promise<BarakahEntry[]> {
  const db = getServiceClient();

  const podIds = [...new Set(rows.map((r) => r.pod_id as string))];
  const studentIds = [
    ...new Set(rows.map((r) => r.student_user_id as string | null).filter((x): x is string => !!x)),
  ];

  const podName = new Map<string, string>();
  if (podIds.length > 0) {
    const { data, error } = await db
      .from("pods")
      .select("id, name, masjid_id")
      .in("id", podIds);
    if (error) throw new Error(`barakah shapeRows: ${error.message}`);
    for (const p of data ?? []) {
      if ((p.masjid_id as string) === masjidId) podName.set(p.id as string, p.name as string);
    }
  }

  const studentName = new Map<string, string>();
  if (studentIds.length > 0) {
    const { data, error } = await db
      .from("users")
      .select("id, name")
      .in("id", studentIds);
    if (error) throw new Error(`barakah shapeRows: ${error.message}`);
    for (const u of data ?? []) studentName.set(u.id as string, u.name as string);
  }

  return rows
    .filter((r) => podName.has(r.pod_id as string))
    .map((r) => {
      const indicator = String(r.indicator);
      const ind: BarakahIndicator = isIndicator(indicator) ? indicator : "adab";
      const sid = (r.student_user_id as string | null) ?? null;
      return {
        id: r.id as string,
        podId: r.pod_id as string,
        podName: podName.get(r.pod_id as string) ?? "-",
        studentUserId: sid,
        studentName: sid ? (studentName.get(sid) ?? "-") : null,
        indicator: ind,
        indicatorLabel: LABEL.get(ind) ?? ind,
        note: (r.note as string | null) ?? null,
        recordedBy: (r.recorded_by as string) ?? "volunteer",
        recordedAt: r.recorded_at as string,
      };
    });
}

/** Recent barakah notes across the masjid (admin view). */
export async function listBarakahNotes(
  masjidId: string,
  limit = 40,
): Promise<BarakahEntry[]> {
  const { data, error } = await (await getReadClient())
    .from("pod_barakah_log")
    .select("id, pod_id, student_user_id, indicator, note, recorded_by, recorded_at")
    .eq("masjid_id", masjidId)
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listBarakahNotes: ${error.message}`);
  return shapeRows((data ?? []) as unknown as Record<string, unknown>[], masjidId);
}

export interface ChildBarakahSummary {
  /** Calm phrases (no counts, no scores) for indicators with any note. */
  phrases: string[];
  /** The underlying notes (student-specific + whole-pod), newest first. */
  entries: BarakahEntry[];
}

/** Values-framed summary for one child - for the parent view. */
export async function getChildBarakahSummary(
  studentUserId: string,
  masjidId: string,
): Promise<ChildBarakahSummary> {
  const db = (await getReadClient());

  // The child's pod, so whole-pod notes are included too.
  const { data: membership, error: mErr } = await db
    .from("pod_students")
    .select("pod_id")
    .eq("student_user_id", studentUserId)
    .maybeSingle();
  if (mErr) throw new Error(`getChildBarakahSummary: ${mErr.message}`);
  const podId = (membership?.pod_id as string | undefined) ?? null;

  let query = db
    .from("pod_barakah_log")
    .select("id, pod_id, student_user_id, indicator, note, recorded_by, recorded_at")
    .eq("masjid_id", masjidId)
    .order("recorded_at", { ascending: false });
  query = podId
    ? query.or(
        `student_user_id.eq.${assertUuid(studentUserId, "studentUserId")},` +
          `pod_id.eq.${assertUuid(podId, "podId")}`,
      )
    : query.eq("student_user_id", studentUserId);

  const { data, error } = await query;
  if (error) throw new Error(`getChildBarakahSummary: ${error.message}`);

  const entries = await shapeRows(
    (data ?? []) as unknown as Record<string, unknown>[],
    masjidId,
  );

  const seen = new Set<BarakahIndicator>();
  for (const e of entries) seen.add(e.indicator);
  const phrases = BARAKAH_INDICATORS.filter((i) => seen.has(i.key)).map((i) => PHRASE[i.key]);

  return { phrases, entries };
}

export async function addBarakahNote(
  masjidId: string,
  input: {
    podId: string;
    studentUserId: string | null;
    indicator: string;
    note: string;
    recordedBy: string;
  },
): Promise<void> {
  const db = getServiceClient();

  if (!isIndicator(input.indicator)) throw new Error("invalid indicator");
  const note = input.note.trim();
  if (!note) throw new Error("a short note is required");

  // Tenancy: pod must be in this masjid.
  const { data: pod, error: pErr } = await db
    .from("pods")
    .select("id, masjid_id")
    .eq("id", input.podId)
    .maybeSingle();
  if (pErr) throw new Error(`addBarakahNote: ${pErr.message}`);
  if (!pod || pod.masjid_id !== masjidId) throw new Error("pod not found in this masjid");

  // If a student is named, they must be in that pod.
  if (input.studentUserId) {
    const { data: member, error: mErr } = await db
      .from("pod_students")
      .select("id")
      .eq("pod_id", input.podId)
      .eq("student_user_id", input.studentUserId)
      .maybeSingle();
    if (mErr) throw new Error(`addBarakahNote: ${mErr.message}`);
    if (!member) throw new Error("that student is not in this pod");
  }

  const { error } = await db.from("pod_barakah_log").insert({
    masjid_id: masjidId,
    pod_id: input.podId,
    student_user_id: input.studentUserId,
    indicator: input.indicator,
    note,
    recorded_by: input.recordedBy.trim() || "volunteer",
  });
  if (error) throw new Error(`addBarakahNote: ${error.message}`);
}
