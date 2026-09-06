// Admin course-authoring reads + writes (T50).
//
// A masjid adding a course node, regrouping a unit, or fixing a lesson should not
// need a seed script. Everything here is masjid-scoped: every read filters by
// masjid_id and every write re-checks that the target row's course belongs to the
// caller's masjid before touching it (see .claude/skills/api-design.md).
//
// Continuity guardrails (see docs/ARCHITECTURE.md - a pod mid-way through a
// course must not break):
//   - a node that is any pod's current node, or has student results, cannot be
//     deleted;
//   - after a structural change the course's nodes are re-sequenced contiguously
//     so pod advancement (getNextNode: sequence_order + 1) never hits a gap;
//   - lesson / checkpoint content is edited in place on a stable node id - the
//     pod's pod_progress row is untouched. Hand edits stamp generatedAt as the
//     version marker; regeneration goes through the existing force-guarded
//     generators.

import { z } from "zod";
import { getServiceClient } from "@/lib/db";
import { getReadClient } from "@/lib/db/server";
import { unwrapRelation as rel } from "@/lib/db/rel";
import type { CourseName } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { LessonBodySchema, type LessonContent } from "@/lib/ai/lesson";
import { CheckpointBodySchema, type CheckpointContent } from "@/lib/ai/checkpoint";

// --- shapes ---------------------------------------------------------------

export interface AuthoringNode {
  id: string;
  title: string;
  sequenceOrder: number;
  unitId: string | null;
  hasLesson: boolean;
  hasCheckpoint: boolean;
  /** how many pods currently sit on this node (any course) */
  podsOnNode: number;
  /** has at least one student checkpoint attempt or lesson-complete record */
  hasStudentActivity: boolean;
}

export interface AuthoringUnit {
  id: string;
  title: string;
  sequenceOrder: number;
}

export interface AuthoringCourse {
  id: string;
  name: CourseName;
  gradeBand: string;
  units: AuthoringUnit[];
  nodes: AuthoringNode[];
}

// --- guards -------------------------------------------------------------

async function assertCourseInMasjid(courseId: string, masjidId: string): Promise<void> {
  const { data, error } = await getServiceClient()
    .from("courses")
    .select("id, masjid_id")
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw new Error(`assertCourseInMasjid: ${error.message}`);
  if (!data || data.masjid_id !== masjidId) throw new Error("course not found in this masjid");
}

interface NodeGuardRow {
  id: string;
  course_id: string;
  sequence_order: number;
}

async function assertNodeInMasjid(nodeId: string, masjidId: string): Promise<NodeGuardRow> {
  const { data, error } = await getServiceClient()
    .from("pathway_nodes")
    .select("id, course_id, sequence_order, course:courses!inner ( masjid_id )")
    .eq("id", nodeId)
    .maybeSingle();
  if (error) throw new Error(`assertNodeInMasjid: ${error.message}`);
  const course = rel(data?.course as unknown) as { masjid_id: string } | null;
  if (!data || !course || course.masjid_id !== masjidId) {
    throw new Error("node not found in this masjid");
  }
  return {
    id: data.id as string,
    course_id: data.course_id as string,
    sequence_order: data.sequence_order as number,
  };
}

async function assertUnitInCourse(
  unitId: string,
  courseId: string,
  masjidId: string,
): Promise<void> {
  await assertCourseInMasjid(courseId, masjidId);
  const { data, error } = await getServiceClient()
    .from("units")
    .select("id, course_id")
    .eq("id", unitId)
    .maybeSingle();
  if (error) throw new Error(`assertUnitInCourse: ${error.message}`);
  if (!data || data.course_id !== courseId) throw new Error("unit not found in this course");
}

// --- reads -------------------------------------------------------------

/** Every course in the masjid with its units + nodes, ordered for editing. */
export async function listAuthoringCourses(masjidId: string): Promise<AuthoringCourse[]> {
  const db = (await getReadClient());

  const { data: courseRows, error: cErr } = await db
    .from("courses")
    .select("id, name, grade_band")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (cErr) throw new Error(`listAuthoringCourses: ${cErr.message}`);
  const courses = (courseRows ?? []) as { id: string; name: CourseName; grade_band: string }[];
  if (courses.length === 0) return [];
  const courseIds = courses.map((c) => c.id);

  const [{ data: unitRows, error: uErr }, { data: nodeRows, error: nErr }] = await Promise.all([
    db
      .from("units")
      .select("id, course_id, title, sequence_order")
      .in("course_id", courseIds)
      .order("sequence_order", { ascending: true }),
    db
      .from("pathway_nodes")
      .select("id, course_id, unit_id, sequence_order, title, lesson_content, checkpoint_content")
      .in("course_id", courseIds)
      .order("sequence_order", { ascending: true }),
  ]);
  if (uErr) throw new Error(`listAuthoringCourses: ${uErr.message}`);
  if (nErr) throw new Error(`listAuthoringCourses: ${nErr.message}`);

  const nodeIds = (nodeRows ?? []).map((n) => n.id as string);

  // pods currently sitting on each node
  const podsOnNode = new Map<string, number>();
  if (nodeIds.length > 0) {
    const { data: pp, error: ppErr } = await db
      .from("pod_progress")
      .select("current_node_id")
      .in("current_node_id", nodeIds);
    if (ppErr) throw new Error(`listAuthoringCourses: ${ppErr.message}`);
    for (const r of pp ?? []) {
      const id = r.current_node_id as string | null;
      if (id) podsOnNode.set(id, (podsOnNode.get(id) ?? 0) + 1);
    }
  }

  // student activity per node (checkpoint attempts + lesson-complete records)
  const active = new Set<string>();
  if (nodeIds.length > 0) {
    const [{ data: cr }, { data: lp }] = await Promise.all([
      db.from("checkpoint_results").select("pathway_node_id").in("pathway_node_id", nodeIds),
      db.from("lesson_progress").select("pathway_node_id").in("pathway_node_id", nodeIds),
    ]);
    for (const r of cr ?? []) active.add(r.pathway_node_id as string);
    for (const r of lp ?? []) active.add(r.pathway_node_id as string);
  }

  return courses.map((c) => ({
    id: c.id,
    name: c.name,
    gradeBand: c.grade_band,
    units: (unitRows ?? [])
      .filter((u) => u.course_id === c.id)
      .map((u) => ({
        id: u.id as string,
        title: u.title as string,
        sequenceOrder: u.sequence_order as number,
      })),
    nodes: (nodeRows ?? [])
      .filter((n) => n.course_id === c.id)
      .sort((a, b) => (a.sequence_order as number) - (b.sequence_order as number))
      .map((n) => ({
        id: n.id as string,
        title: n.title as string,
        sequenceOrder: n.sequence_order as number,
        unitId: (n.unit_id as string | null) ?? null,
        hasLesson: Boolean(n.lesson_content),
        hasCheckpoint: Boolean(n.checkpoint_content),
        podsOnNode: podsOnNode.get(n.id as string) ?? 0,
        hasStudentActivity: active.has(n.id as string),
      })),
  }));
}

export async function getAuthoringCourse(
  masjidId: string,
  courseId: string,
): Promise<AuthoringCourse | null> {
  const all = await listAuthoringCourses(masjidId);
  return all.find((c) => c.id === courseId) ?? null;
}

/** The persisted lesson/checkpoint JSON for one node, for hand-editing. */
export async function getNodeContent(
  masjidId: string,
  nodeId: string,
): Promise<{ lesson: LessonContent | null; checkpoint: CheckpointContent | null }> {
  await assertNodeInMasjid(nodeId, masjidId);
  const { data, error } = await getServiceClient()
    .from("pathway_nodes")
    .select("lesson_content, checkpoint_content")
    .eq("id", nodeId)
    .maybeSingle();
  if (error) throw new Error(`getNodeContent: ${error.message}`);
  return {
    lesson: (data?.lesson_content as LessonContent | null) ?? null,
    checkpoint: (data?.checkpoint_content as CheckpointContent | null) ?? null,
  };
}

// --- structural writes ------------------------------------------------

/**
 * Renumber a course's nodes to a contiguous 1..n by current order. Two passes so
 * the unique(course_id, sequence_order) constraint is never violated mid-update.
 */
async function resequenceCourse(courseId: string): Promise<void> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("pathway_nodes")
    .select("id, sequence_order")
    .eq("course_id", courseId)
    .order("sequence_order", { ascending: true });
  if (error) throw new Error(`resequenceCourse: ${error.message}`);
  const rows = data ?? [];
  const alreadyOk = rows.every((r, i) => r.sequence_order === i + 1);
  if (alreadyOk) return;

  for (const r of rows) {
    const { error: e } = await db
      .from("pathway_nodes")
      .update({ sequence_order: (r.sequence_order as number) + 1000 })
      .eq("id", r.id as string);
    if (e) throw new Error(`resequenceCourse: ${e.message}`);
  }
  for (let i = 0; i < rows.length; i++) {
    const { error: e } = await db
      .from("pathway_nodes")
      .update({ sequence_order: i + 1 })
      .eq("id", rows[i].id as string);
    if (e) throw new Error(`resequenceCourse: ${e.message}`);
  }
}

const TITLE_MAX = 160;

function cleanTitle(raw: string): string {
  const t = raw.trim();
  if (!t) throw new Error("a title is required");
  if (t.length > TITLE_MAX) throw new Error(`title must be ${TITLE_MAX} characters or fewer`);
  return t;
}

/** Add a node at the end of a course's pathway. Optionally place it in a unit. */
export async function createNode(
  masjidId: string,
  courseId: string,
  title: string,
  unitId: string | null,
): Promise<string> {
  await assertCourseInMasjid(courseId, masjidId);
  const clean = cleanTitle(title);
  if (unitId) await assertUnitInCourse(unitId, courseId, masjidId);

  const db = getServiceClient();
  const { data: last, error: lErr } = await db
    .from("pathway_nodes")
    .select("sequence_order")
    .eq("course_id", courseId)
    .order("sequence_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lErr) throw new Error(`createNode: ${lErr.message}`);
  const nextSeq = ((last?.sequence_order as number | undefined) ?? 0) + 1;

  const { data, error } = await db
    .from("pathway_nodes")
    .insert({
      course_id: courseId,
      unit_id: unitId,
      sequence_order: nextSeq,
      title: clean,
    })
    .select("id")
    .single();
  if (error) throw new Error(`createNode: ${error.message}`);
  return data.id as string;
}

export async function renameNode(
  masjidId: string,
  nodeId: string,
  title: string,
): Promise<void> {
  await assertNodeInMasjid(nodeId, masjidId);
  const clean = cleanTitle(title);
  const { error } = await getServiceClient()
    .from("pathway_nodes")
    .update({ title: clean })
    .eq("id", nodeId);
  if (error) throw new Error(`renameNode: ${error.message}`);
}

/** Move a node one step earlier ("up") or later ("down") in its course. */
export async function moveNode(
  masjidId: string,
  nodeId: string,
  direction: "up" | "down",
): Promise<void> {
  const node = await assertNodeInMasjid(nodeId, masjidId);
  const db = getServiceClient();
  const targetSeq = node.sequence_order + (direction === "up" ? -1 : 1);
  const { data: neighbour, error } = await db
    .from("pathway_nodes")
    .select("id, sequence_order")
    .eq("course_id", node.course_id)
    .eq("sequence_order", targetSeq)
    .maybeSingle();
  if (error) throw new Error(`moveNode: ${error.message}`);
  if (!neighbour) return; // already at an end - no-op

  const neighbourId = neighbour.id as string;
  const a = node.sequence_order;
  const b = neighbour.sequence_order as number;
  // 3-step swap through a sentinel so unique(course_id, sequence_order) holds.
  const steps: Array<[string, number]> = [
    [nodeId, -1],
    [neighbourId, a],
    [nodeId, b],
  ];
  for (const [id, seq] of steps) {
    const { error: e } = await db
      .from("pathway_nodes")
      .update({ sequence_order: seq })
      .eq("id", id);
    if (e) throw new Error(`moveNode: ${e.message}`);
  }
}

export async function setNodeUnit(
  masjidId: string,
  nodeId: string,
  unitId: string | null,
): Promise<void> {
  const node = await assertNodeInMasjid(nodeId, masjidId);
  if (unitId) await assertUnitInCourse(unitId, node.course_id, masjidId);
  const { error } = await getServiceClient()
    .from("pathway_nodes")
    .update({ unit_id: unitId })
    .eq("id", nodeId);
  if (error) throw new Error(`setNodeUnit: ${error.message}`);
}

export async function addUnit(
  masjidId: string,
  courseId: string,
  title: string,
): Promise<string> {
  await assertCourseInMasjid(courseId, masjidId);
  const clean = cleanTitle(title);
  const db = getServiceClient();
  const { data: last, error: lErr } = await db
    .from("units")
    .select("sequence_order")
    .eq("course_id", courseId)
    .order("sequence_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lErr) throw new Error(`addUnit: ${lErr.message}`);
  const nextSeq = ((last?.sequence_order as number | undefined) ?? 0) + 1;

  const { data, error } = await db
    .from("units")
    .insert({ course_id: courseId, title: clean, sequence_order: nextSeq })
    .select("id")
    .single();
  if (error) throw new Error(`addUnit: ${error.message}`);
  return data.id as string;
}

/**
 * Delete a node. Refused when a pod is currently on it or a student has activity
 * on it - either would break continuity or lose a compliance-relevant record.
 * Remaining nodes are re-sequenced contiguously afterwards.
 */
export async function deleteNode(masjidId: string, nodeId: string): Promise<void> {
  const node = await assertNodeInMasjid(nodeId, masjidId);
  const db = getServiceClient();

  const { data: onNode, error: ppErr } = await db
    .from("pod_progress")
    .select("pod_id")
    .eq("current_node_id", nodeId);
  if (ppErr) throw new Error(`deleteNode: ${ppErr.message}`);
  if ((onNode ?? []).length > 0) {
    throw new Error(
      `cannot delete: ${onNode!.length} pod(s) are currently on this node. Advance or move them first.`,
    );
  }

  const [{ count: crCount }, { count: lpCount }] = await Promise.all([
    db
      .from("checkpoint_results")
      .select("id", { count: "exact", head: true })
      .eq("pathway_node_id", nodeId),
    db
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("pathway_node_id", nodeId),
  ]);
  if ((crCount ?? 0) > 0 || (lpCount ?? 0) > 0) {
    throw new Error("cannot delete: students already have results or progress on this node");
  }

  const { error } = await db.from("pathway_nodes").delete().eq("id", nodeId);
  if (error) throw new Error(`deleteNode: ${error.message}`);
  await resequenceCourse(node.course_id);
}

// --- content writes (hand-edit the persisted JSON) --------------------

/** Body fields the model produces, plus the metadata a persisted lesson carries. */
const LessonEditSchema = LessonBodySchema.extend({
  schemaVersion: z.literal(1).optional(),
  generatedBy: z.string().optional(),
  generatedAt: z.string().optional(),
  regulationNote: z.string().optional(),
}).passthrough();

const CheckpointEditSchema = CheckpointBodySchema.extend({
  schemaVersion: z.literal(1).optional(),
  generatedBy: z.string().optional(),
  generatedAt: z.string().optional(),
}).passthrough();

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("that is not valid JSON");
  }
}

/** Validate + persist hand-edited lesson JSON. Stamps a new generatedAt (version marker). */
export async function saveLessonJson(
  masjidId: string,
  nodeId: string,
  rawJson: string,
  locale: Locale = "en",
): Promise<void> {
  await assertNodeInMasjid(nodeId, masjidId);
  const parsed = LessonEditSchema.safeParse(parseJson(rawJson));
  if (!parsed.success) {
    throw new Error(`lesson JSON invalid: ${parsed.error.issues[0]?.message ?? "schema mismatch"}`);
  }
  const content: LessonContent = {
    ...(parsed.data as unknown as LessonContent),
    schemaVersion: 1,
    generatedBy: "hand-edited",
    generatedAt: new Date().toISOString(),
  };
  const column = locale === "fr" ? "lesson_content_fr" : "lesson_content";
  const { error } = await getServiceClient()
    .from("pathway_nodes")
    .update({ [column]: content })
    .eq("id", nodeId);
  if (error) throw new Error(`saveLessonJson: ${error.message}`);
}

/** Validate + persist hand-edited checkpoint JSON. Node must already have a lesson. */
export async function saveCheckpointJson(
  masjidId: string,
  nodeId: string,
  rawJson: string,
  locale: Locale = "en",
): Promise<void> {
  await assertNodeInMasjid(nodeId, masjidId);
  const parsed = CheckpointEditSchema.safeParse(parseJson(rawJson));
  if (!parsed.success) {
    throw new Error(
      `checkpoint JSON invalid: ${parsed.error.issues[0]?.message ?? "schema mismatch"}`,
    );
  }
  const content: CheckpointContent = {
    ...(parsed.data as unknown as CheckpointContent),
    schemaVersion: 1,
    generatedBy: "hand-edited",
    generatedAt: new Date().toISOString(),
  };
  const column = locale === "fr" ? "checkpoint_content_fr" : "checkpoint_content";
  const { error } = await getServiceClient()
    .from("pathway_nodes")
    .update({ [column]: content })
    .eq("id", nodeId);
  if (error) throw new Error(`saveCheckpointJson: ${error.message}`);
}
