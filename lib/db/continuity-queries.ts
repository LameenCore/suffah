// Reads/writes for the Continuity Fingerprint (T18). Separate file so the
// pod-handoff logic stays in one place. Every function is masjid-scoped.

import { getServiceClient } from "@/lib/db";
import type { CourseName } from "@/lib/types";
import type { PodBriefing } from "@/lib/ai/continuity";

function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

async function assertPodInMasjid(
  podId: string,
  masjidId: string,
): Promise<{ id: string; name: string }> {
  const { data, error } = await getServiceClient()
    .from("pods")
    .select("id, name, masjid_id, volunteer:volunteers ( name )")
    .eq("id", podId)
    .maybeSingle();
  if (error) throw new Error(`assertPodInMasjid: ${error.message}`);
  if (!data || data.masjid_id !== masjidId) {
    const err = new Error(`pod ${podId} not found in masjid ${masjidId}`);
    err.name = "PodNotFoundError";
    throw err;
  }
  return { id: data.id as string, name: data.name as string };
}

// --- Session notes --------------------------------------------------

export interface PodSessionNote {
  id: string;
  authorKind: "volunteer" | "system";
  authorName: string | null;
  courseName: CourseName | null;
  note: string;
  createdAt: string;
}

export async function listPodSessionNotes(
  podId: string,
  masjidId: string,
  limit = 25,
): Promise<PodSessionNote[]> {
  await assertPodInMasjid(podId, masjidId);
  const { data, error } = await getServiceClient()
    .from("pod_session_notes")
    .select("id, author_kind, author_name, note, created_at, course:courses ( name )")
    .eq("pod_id", podId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listPodSessionNotes: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    authorKind: (r.author_kind as "volunteer" | "system") ?? "volunteer",
    authorName: (r.author_name as string | null) ?? null,
    courseName: (unwrap(r.course as unknown) as { name: CourseName } | null)?.name ?? null,
    note: r.note as string,
    createdAt: r.created_at as string,
  }));
}

export async function addPodSessionNote(
  podId: string,
  masjidId: string,
  input: {
    note: string;
    authorKind?: "volunteer" | "system";
    authorName?: string | null;
    courseId?: string | null;
  },
): Promise<void> {
  await assertPodInMasjid(podId, masjidId);
  const note = input.note.trim();
  if (!note) throw new Error("note is empty");
  const { error } = await getServiceClient().from("pod_session_notes").insert({
    pod_id: podId,
    course_id: input.courseId ?? null,
    author_kind: input.authorKind ?? "volunteer",
    author_name: input.authorName ?? null,
    note,
  });
  if (error) throw new Error(`addPodSessionNote: ${error.message}`);
}

/**
 * Best-effort system note (e.g. the playground noticing a repeated checkpoint
 * fail). Never throws — a note failing must not break the caller.
 */
export async function tryAddSystemNote(
  podId: string,
  courseId: string | null,
  note: string,
): Promise<void> {
  try {
    const { error } = await getServiceClient().from("pod_session_notes").insert({
      pod_id: podId,
      course_id: courseId,
      author_kind: "system",
      author_name: null,
      note,
    });
    if (error) console.warn(`[continuity] tryAddSystemNote: ${error.message}`);
  } catch (err) {
    console.warn("[continuity] tryAddSystemNote failed", err);
  }
}

// --- Learning signals (input to the briefing) -----------------------

export interface PodLearningSignals {
  pod: { id: string; name: string; volunteerName: string | null };
  students: { id: string; name: string }[];
  courses: {
    courseId: string;
    courseName: CourseName;
    currentNodeTitle: string | null;
    nodePosition: number;
    totalNodes: number;
  }[];
  checkpoints: {
    studentName: string;
    courseName: CourseName;
    nodeTitle: string;
    attempts: number;
    passed: boolean;
  }[];
  assessments: {
    studentName: string;
    courseName: CourseName;
    unitTitle: string;
    score: number;
    passed: boolean;
  }[];
  notes: PodSessionNote[];
}

export async function gatherPodLearningSignals(
  podId: string,
  masjidId: string,
): Promise<PodLearningSignals> {
  const db = getServiceClient();

  const { data: podRow, error: podErr } = await db
    .from("pods")
    .select("id, name, masjid_id, volunteer:volunteers ( name )")
    .eq("id", podId)
    .maybeSingle();
  if (podErr) throw new Error(`gatherPodLearningSignals: ${podErr.message}`);
  if (!podRow || podRow.masjid_id !== masjidId) {
    const err = new Error(`pod ${podId} not found in masjid ${masjidId}`);
    err.name = "PodNotFoundError";
    throw err;
  }
  const volunteerName =
    (unwrap(podRow.volunteer as unknown) as { name: string } | null)?.name ?? null;

  const { data: memberRows, error: mErr } = await db
    .from("pod_students")
    .select("student:users!inner ( id, name )")
    .eq("pod_id", podId);
  if (mErr) throw new Error(`gatherPodLearningSignals: ${mErr.message}`);
  const students = (memberRows ?? [])
    .map((r) => unwrap(r.student as unknown) as { id: string; name: string } | null)
    .filter((s): s is { id: string; name: string } => s != null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const studentName = new Map(students.map((s) => [s.id, s.name]));

  const { data: courseRows, error: cErr } = await db
    .from("courses")
    .select("id, name")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (cErr) throw new Error(`gatherPodLearningSignals: ${cErr.message}`);
  const courses = (courseRows ?? []) as { id: string; name: CourseName }[];
  const courseName = new Map(courses.map((c) => [c.id, c.name]));

  const { data: progressRows, error: pErr } = await db
    .from("pod_progress")
    .select("course_id, node:pathway_nodes ( title, sequence_order )")
    .eq("pod_id", podId);
  if (pErr) throw new Error(`gatherPodLearningSignals: ${pErr.message}`);
  const progressByCourse = new Map<string, { title: string | null; position: number }>();
  for (const row of progressRows ?? []) {
    const node = unwrap(row.node as unknown) as
      | { title: string; sequence_order: number }
      | null;
    progressByCourse.set(row.course_id as string, {
      title: node?.title ?? null,
      position: node?.sequence_order ?? 0,
    });
  }

  const nodeCount = new Map<string, number>();
  for (const c of courses) {
    const { count } = await db
      .from("pathway_nodes")
      .select("id", { count: "exact", head: true })
      .eq("course_id", c.id);
    nodeCount.set(c.id, count ?? 0);
  }

  const studentIds = students.map((s) => s.id);

  // Checkpoint attempts: group rows by (student, node) -> attempts + passed.
  const checkpoints: PodLearningSignals["checkpoints"] = [];
  if (studentIds.length > 0) {
    const { data: crRows, error: crErr } = await db
      .from("checkpoint_results")
      .select("student_user_id, passed, pathway_node_id, node:pathway_nodes ( title, course_id )")
      .in("student_user_id", studentIds)
      .order("attempted_at", { ascending: true });
    if (crErr) throw new Error(`gatherPodLearningSignals: ${crErr.message}`);
    const agg = new Map<string, { attempts: number; passed: boolean; node: string; course: string }>();
    for (const r of crRows ?? []) {
      const node = unwrap(r.node as unknown) as { title: string; course_id: string } | null;
      if (!node) continue;
      const key = `${r.student_user_id}|${r.pathway_node_id}`;
      const prev = agg.get(key);
      agg.set(key, {
        attempts: (prev?.attempts ?? 0) + 1,
        passed: (prev?.passed ?? false) || r.passed === true,
        node: node.title,
        course: node.course_id,
      });
    }
    for (const [key, v] of agg) {
      const sid = key.split("|")[0];
      checkpoints.push({
        studentName: studentName.get(sid) ?? "a student",
        courseName: courseName.get(v.course) ?? ("?" as CourseName),
        nodeTitle: v.node,
        attempts: v.attempts,
        passed: v.passed,
      });
    }
  }

  const assessments: PodLearningSignals["assessments"] = [];
  if (studentIds.length > 0) {
    const { data: arRows, error: arErr } = await db
      .from("unit_assessment_results")
      .select("student_user_id, score, passed, unit:units ( title, course_id )")
      .in("student_user_id", studentIds)
      .order("attempted_at", { ascending: false });
    if (arErr) throw new Error(`gatherPodLearningSignals: ${arErr.message}`);
    for (const r of arRows ?? []) {
      const unit = unwrap(r.unit as unknown) as { title: string; course_id: string } | null;
      if (!unit) continue;
      assessments.push({
        studentName: studentName.get(r.student_user_id as string) ?? "a student",
        courseName: courseName.get(unit.course_id) ?? ("?" as CourseName),
        unitTitle: unit.title,
        score: Number(r.score),
        passed: r.passed === true,
      });
    }
  }

  const notes = await listPodSessionNotes(podId, masjidId, 25);

  return {
    pod: { id: podRow.id as string, name: podRow.name as string, volunteerName },
    students,
    courses: courses.map((c) => {
      const p = progressByCourse.get(c.id);
      return {
        courseId: c.id,
        courseName: c.name,
        currentNodeTitle: p?.title ?? null,
        nodePosition: p?.position ?? 0,
        totalNodes: nodeCount.get(c.id) ?? 0,
      };
    }),
    checkpoints,
    assessments,
    notes,
  };
}

// --- Briefings -----------------------------------------------------

export async function saveBriefing(
  podId: string,
  masjidId: string,
  content: PodBriefing,
  generatedBy: string,
): Promise<void> {
  await assertPodInMasjid(podId, masjidId);
  const { error } = await getServiceClient().from("pod_briefings").insert({
    pod_id: podId,
    content,
    generated_by: generatedBy,
  });
  if (error) throw new Error(`saveBriefing: ${error.message}`);
}

export interface StoredBriefing {
  content: PodBriefing;
  generatedBy: string;
  generatedAt: string;
}

export async function getLatestBriefing(
  podId: string,
  masjidId: string,
): Promise<StoredBriefing | null> {
  await assertPodInMasjid(podId, masjidId);
  const { data, error } = await getServiceClient()
    .from("pod_briefings")
    .select("content, generated_by, generated_at")
    .eq("pod_id", podId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLatestBriefing: ${error.message}`);
  if (!data) return null;
  return {
    content: data.content as PodBriefing,
    generatedBy: data.generated_by as string,
    generatedAt: data.generated_at as string,
  };
}

/** For the pod picker on the admin continuity view. */
export async function listPodsForBriefing(
  masjidId: string,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await getServiceClient()
    .from("pods")
    .select("id, name")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (error) throw new Error(`listPodsForBriefing: ${error.message}`);
  return (data ?? []) as { id: string; name: string }[];
}
