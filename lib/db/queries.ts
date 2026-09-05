// Masjid-scoped read/write helpers. Route handlers and server code call these
// instead of hand-rolling Supabase queries so that masjid_id scoping stays in
// one place (see .claude/skills/api-design.md - every query filters by tenant).

import { getServiceClient } from "@/lib/db";
import type { CourseName } from "@/lib/types";
import type { LessonContent } from "@/lib/ai/lesson";
import type { CheckpointContent } from "@/lib/ai/checkpoint";
import type { AssessmentContent } from "@/lib/ai/assessment";

export interface CourseRef {
  id: string;
  name: CourseName;
  grade_band: string;
  masjid_id: string;
}

export interface PathwayNode {
  id: string;
  course_id: string;
  unit_id: string | null;
  sequence_order: number;
  title: string;
  lesson_content: LessonContent | null;
  checkpoint_content: CheckpointContent | null;
  course: CourseRef;
}

/** pathway_nodes -> courses join, then an explicit masjid_id check. */
const NODE_SELECT =
  "id, course_id, unit_id, sequence_order, title, lesson_content, checkpoint_content, " +
  "course:courses!inner ( id, name, grade_band, masjid_id )";

function shapeNode(row: Record<string, unknown>): PathwayNode {
  // Supabase types an embedded to-one relation as an array in some versions.
  const course = Array.isArray(row.course) ? row.course[0] : row.course;
  return {
    id: row.id as string,
    course_id: row.course_id as string,
    unit_id: (row.unit_id as string | null) ?? null,
    sequence_order: row.sequence_order as number,
    title: row.title as string,
    lesson_content: (row.lesson_content as LessonContent | null) ?? null,
    checkpoint_content: (row.checkpoint_content as CheckpointContent | null) ?? null,
    course: course as CourseRef,
  };
}

/** One node, only if it belongs to `masjidId`. Returns null otherwise. */
export async function getPathwayNode(
  nodeId: string,
  masjidId: string,
): Promise<PathwayNode | null> {
  const { data, error } = await getServiceClient()
    .from("pathway_nodes")
    .select(NODE_SELECT)
    .eq("id", nodeId)
    .maybeSingle();

  if (error) throw new Error(`getPathwayNode: ${error.message}`);
  if (!data) return null;

  const node = shapeNode(data as unknown as Record<string, unknown>);
  if (node.course.masjid_id !== masjidId) return null;
  return node;
}

/** The first node (sequence_order = 1) of every course in the masjid. */
export async function getFirstNodePerCourse(masjidId: string): Promise<PathwayNode[]> {
  const { data, error } = await getServiceClient()
    .from("pathway_nodes")
    .select(NODE_SELECT)
    .eq("sequence_order", 1)
    .order("title", { ascending: true });

  if (error) throw new Error(`getFirstNodePerCourse: ${error.message}`);
  return (data ?? [])
    .map((row) => shapeNode(row as unknown as Record<string, unknown>))
    .filter((n) => n.course.masjid_id === masjidId);
}

/**
 * Persist generated lesson content onto a node. Scoped: the update only lands
 * if the node's course belongs to `masjidId`.
 */
export async function saveLessonContent(
  nodeId: string,
  masjidId: string,
  content: LessonContent,
): Promise<PathwayNode> {
  // Guard tenancy before writing.
  const existing = await getPathwayNode(nodeId, masjidId);
  if (!existing) throw new Error(`saveLessonContent: node ${nodeId} not in masjid ${masjidId}`);

  const { error } = await getServiceClient()
    .from("pathway_nodes")
    .update({ lesson_content: content })
    .eq("id", nodeId);

  if (error) throw new Error(`saveLessonContent: ${error.message}`);

  const updated = await getPathwayNode(nodeId, masjidId);
  if (!updated) throw new Error("saveLessonContent: node vanished after update");
  return updated;
}

// --- Student playground -------------------------------------------------

export interface PodRef {
  id: string;
  name: string;
}

export interface PlaygroundCourse {
  course: CourseRef;
  /** The node the pod is currently on for this course (pod_progress). */
  currentNode: PathwayNode | null;
  /** This student has marked the current node's lesson complete. */
  lessonComplete: boolean;
  /** 1-based position of the current node in the course pathway. */
  nodePosition: number;
  totalNodes: number;
}

export interface Playground {
  pod: PodRef | null;
  courses: PlaygroundCourse[];
}

/** The (single) pod a student belongs to in this masjid, or null. */
export async function getPodForStudent(
  studentUserId: string,
  masjidId: string,
): Promise<PodRef | null> {
  const { data, error } = await getServiceClient()
    .from("pod_students")
    .select("pod:pods!inner ( id, name, masjid_id )")
    .eq("student_user_id", studentUserId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getPodForStudent: ${error.message}`);
  if (!data) return null;
  const pod = (Array.isArray(data.pod) ? data.pod[0] : data.pod) as {
    id: string;
    name: string;
    masjid_id: string;
  };
  if (!pod || pod.masjid_id !== masjidId) return null;
  return { id: pod.id, name: pod.name };
}

/**
 * Everything the student playground needs: the student's pod and, per course,
 * the pod's current node (with its lesson) plus this student's completion state.
 */
export async function getPlayground(
  studentUserId: string,
  masjidId: string,
): Promise<Playground> {
  const db = getServiceClient();
  const pod = await getPodForStudent(studentUserId, masjidId);
  if (!pod) return { pod: null, courses: [] };

  const { data: progressRows, error: progressErr } = await db
    .from("pod_progress")
    .select("course_id, current_node_id")
    .eq("pod_id", pod.id);
  if (progressErr) throw new Error(`getPlayground: ${progressErr.message}`);

  const { data: courseRows, error: courseErr } = await db
    .from("courses")
    .select("id, name, grade_band, masjid_id")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  if (courseErr) throw new Error(`getPlayground: ${courseErr.message}`);

  const currentNodeIds = (progressRows ?? [])
    .map((r) => r.current_node_id as string | null)
    .filter((id): id is string => Boolean(id));

  const completeNodeIds = new Set<string>();
  if (currentNodeIds.length > 0) {
    const { data: lp, error: lpErr } = await db
      .from("lesson_progress")
      .select("pathway_node_id")
      .eq("student_user_id", studentUserId)
      .in("pathway_node_id", currentNodeIds);
    if (lpErr) throw new Error(`getPlayground: ${lpErr.message}`);
    for (const row of lp ?? []) completeNodeIds.add(row.pathway_node_id as string);
  }

  const courses: PlaygroundCourse[] = [];
  for (const course of (courseRows ?? []) as CourseRef[]) {
    const progress = (progressRows ?? []).find((r) => r.course_id === course.id);
    const currentNodeId = (progress?.current_node_id as string | null) ?? null;

    const { count, error: countErr } = await db
      .from("pathway_nodes")
      .select("id", { count: "exact", head: true })
      .eq("course_id", course.id);
    if (countErr) throw new Error(`getPlayground: ${countErr.message}`);

    const currentNode = currentNodeId
      ? await getPathwayNode(currentNodeId, masjidId)
      : null;

    courses.push({
      course,
      currentNode,
      lessonComplete: currentNodeId ? completeNodeIds.has(currentNodeId) : false,
      nodePosition: currentNode?.sequence_order ?? 0,
      totalNodes: count ?? 0,
    });
  }

  return { pod, courses };
}

/** Has this student marked the given node's lesson complete? */
export async function isLessonComplete(
  studentUserId: string,
  nodeId: string,
): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from("lesson_progress")
    .select("id")
    .eq("student_user_id", studentUserId)
    .eq("pathway_node_id", nodeId)
    .maybeSingle();
  if (error) throw new Error(`isLessonComplete: ${error.message}`);
  return Boolean(data);
}

/**
 * Record that a student finished a lesson node. Idempotent (unique constraint
 * on student + node). Tenant-guarded: the node must belong to `masjidId`.
 */
export async function markLessonComplete(
  studentUserId: string,
  nodeId: string,
  masjidId: string,
): Promise<void> {
  const node = await getPathwayNode(nodeId, masjidId);
  if (!node) throw new Error(`markLessonComplete: node ${nodeId} not in masjid ${masjidId}`);

  const { error } = await getServiceClient()
    .from("lesson_progress")
    .upsert(
      { student_user_id: studentUserId, pathway_node_id: nodeId, status: "lesson_complete" },
      { onConflict: "student_user_id,pathway_node_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`markLessonComplete: ${error.message}`);
}

// --- Checkpoints ------------------------------------------------------

/** Persist generated checkpoint questions onto a node (tenant-guarded). */
export async function saveCheckpointContent(
  nodeId: string,
  masjidId: string,
  content: CheckpointContent,
): Promise<PathwayNode> {
  const existing = await getPathwayNode(nodeId, masjidId);
  if (!existing) throw new Error(`saveCheckpointContent: node ${nodeId} not in masjid ${masjidId}`);

  const { error } = await getServiceClient()
    .from("pathway_nodes")
    .update({ checkpoint_content: content })
    .eq("id", nodeId);
  if (error) throw new Error(`saveCheckpointContent: ${error.message}`);

  const updated = await getPathwayNode(nodeId, masjidId);
  if (!updated) throw new Error("saveCheckpointContent: node vanished after update");
  return updated;
}

export interface CheckpointResultRow {
  passed: boolean;
  answer_data: unknown;
  attempted_at: string;
}

/** Most recent checkpoint attempt for this student on this node, or null. */
export async function getLatestCheckpointResult(
  studentUserId: string,
  nodeId: string,
): Promise<CheckpointResultRow | null> {
  const { data, error } = await getServiceClient()
    .from("checkpoint_results")
    .select("passed, answer_data, attempted_at")
    .eq("student_user_id", studentUserId)
    .eq("pathway_node_id", nodeId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLatestCheckpointResult: ${error.message}`);
  return (data as CheckpointResultRow | null) ?? null;
}

/** How many times this student has attempted this node's checkpoint. */
export async function countCheckpointAttempts(
  studentUserId: string,
  nodeId: string,
): Promise<number> {
  const { count, error } = await getServiceClient()
    .from("checkpoint_results")
    .select("id", { count: "exact", head: true })
    .eq("student_user_id", studentUserId)
    .eq("pathway_node_id", nodeId);
  if (error) throw new Error(`countCheckpointAttempts: ${error.message}`);
  return count ?? 0;
}

export async function saveCheckpointResult(
  studentUserId: string,
  nodeId: string,
  passed: boolean,
  answerData: unknown,
): Promise<void> {
  const { error } = await getServiceClient().from("checkpoint_results").insert({
    student_user_id: studentUserId,
    pathway_node_id: nodeId,
    passed,
    answer_data: answerData,
  });
  if (error) throw new Error(`saveCheckpointResult: ${error.message}`);
}

/** The node one step further along the same course, or null if this is the last. */
export async function getNextNode(
  courseId: string,
  currentSequenceOrder: number,
  masjidId: string,
): Promise<PathwayNode | null> {
  const { data, error } = await getServiceClient()
    .from("pathway_nodes")
    .select(NODE_SELECT)
    .eq("course_id", courseId)
    .eq("sequence_order", currentSequenceOrder + 1)
    .maybeSingle();
  if (error) throw new Error(`getNextNode: ${error.message}`);
  if (!data) return null;
  const node = shapeNode(data as unknown as Record<string, unknown>);
  return node.course.masjid_id === masjidId ? node : null;
}

/**
 * Move a pod's position for a course to `nextNodeId`. Only advances forward:
 * a no-op if the pod is already at or past that node.
 */
export async function advancePodProgress(
  podId: string,
  courseId: string,
  nextNode: PathwayNode,
): Promise<boolean> {
  const db = getServiceClient();
  const { data: current, error: readErr } = await db
    .from("pod_progress")
    .select("current_node_id")
    .eq("pod_id", podId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (readErr) throw new Error(`advancePodProgress: ${readErr.message}`);

  const currentNodeId = (current?.current_node_id as string | null) ?? null;
  if (currentNodeId) {
    const currentNode = await getPathwayNode(currentNodeId, nextNode.course.masjid_id);
    if (currentNode && currentNode.sequence_order >= nextNode.sequence_order) return false;
  }

  const { error } = await db
    .from("pod_progress")
    .update({ current_node_id: nextNode.id })
    .eq("pod_id", podId)
    .eq("course_id", courseId);
  if (error) throw new Error(`advancePodProgress: ${error.message}`);
  return true;
}

// --- Units + unit assessments ----------------------------------------

export interface UnitRef {
  id: string;
  course_id: string;
  title: string;
  sequence_order: number;
  assessment_content: AssessmentContent | null;
  course: CourseRef;
}

const UNIT_SELECT =
  "id, course_id, title, sequence_order, assessment_content, " +
  "course:courses!inner ( id, name, grade_band, masjid_id )";

function shapeUnit(row: Record<string, unknown>): UnitRef {
  const course = Array.isArray(row.course) ? row.course[0] : row.course;
  return {
    id: row.id as string,
    course_id: row.course_id as string,
    title: row.title as string,
    sequence_order: row.sequence_order as number,
    assessment_content: (row.assessment_content as AssessmentContent | null) ?? null,
    course: course as CourseRef,
  };
}

/** One unit, only if its course belongs to `masjidId`. */
export async function getUnit(unitId: string, masjidId: string): Promise<UnitRef | null> {
  const { data, error } = await getServiceClient()
    .from("units")
    .select(UNIT_SELECT)
    .eq("id", unitId)
    .maybeSingle();
  if (error) throw new Error(`getUnit: ${error.message}`);
  if (!data) return null;
  const unit = shapeUnit(data as unknown as Record<string, unknown>);
  return unit.course.masjid_id === masjidId ? unit : null;
}

/** All pathway nodes in a unit, ordered by sequence. */
export async function getUnitNodes(unitId: string, masjidId: string): Promise<PathwayNode[]> {
  const { data, error } = await getServiceClient()
    .from("pathway_nodes")
    .select(NODE_SELECT)
    .eq("unit_id", unitId)
    .order("sequence_order", { ascending: true });
  if (error) throw new Error(`getUnitNodes: ${error.message}`);
  return (data ?? [])
    .map((row) => shapeNode(row as unknown as Record<string, unknown>))
    .filter((n) => n.course.masjid_id === masjidId);
}

export async function saveUnitAssessmentContent(
  unitId: string,
  masjidId: string,
  content: AssessmentContent,
): Promise<UnitRef> {
  const existing = await getUnit(unitId, masjidId);
  if (!existing) throw new Error(`saveUnitAssessmentContent: unit ${unitId} not in masjid ${masjidId}`);

  const { error } = await getServiceClient()
    .from("units")
    .update({ assessment_content: content })
    .eq("id", unitId);
  if (error) throw new Error(`saveUnitAssessmentContent: ${error.message}`);

  const updated = await getUnit(unitId, masjidId);
  if (!updated) throw new Error("saveUnitAssessmentContent: unit vanished after update");
  return updated;
}

export interface UnitAssessmentResultRow {
  score: number;
  passed: boolean;
  answer_data: unknown;
  attempted_at: string;
}

export async function getLatestUnitAssessmentResult(
  studentUserId: string,
  unitId: string,
): Promise<UnitAssessmentResultRow | null> {
  const { data, error } = await getServiceClient()
    .from("unit_assessment_results")
    .select("score, passed, answer_data, attempted_at")
    .eq("student_user_id", studentUserId)
    .eq("unit_id", unitId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLatestUnitAssessmentResult: ${error.message}`);
  return (data as UnitAssessmentResultRow | null) ?? null;
}

export async function saveUnitAssessmentResult(
  studentUserId: string,
  unitId: string,
  score: number,
  passed: boolean,
  answerData: unknown,
): Promise<void> {
  const { error } = await getServiceClient().from("unit_assessment_results").insert({
    student_user_id: studentUserId,
    unit_id: unitId,
    score,
    passed,
    answer_data: answerData,
  });
  if (error) throw new Error(`saveUnitAssessmentResult: ${error.message}`);
}

/** How far a student has got through a unit's checkpoints. */
export async function getUnitCheckpointProgress(
  studentUserId: string,
  unitId: string,
  masjidId: string,
): Promise<{ total: number; passed: number; complete: boolean }> {
  const nodes = await getUnitNodes(unitId, masjidId);
  if (nodes.length === 0) return { total: 0, passed: 0, complete: false };

  const { data, error } = await getServiceClient()
    .from("checkpoint_results")
    .select("pathway_node_id, passed")
    .eq("student_user_id", studentUserId)
    .in(
      "pathway_node_id",
      nodes.map((n) => n.id),
    );
  if (error) throw new Error(`getUnitCheckpointProgress: ${error.message}`);

  const passedNodes = new Set(
    (data ?? []).filter((r) => r.passed === true).map((r) => r.pathway_node_id as string),
  );
  return {
    total: nodes.length,
    passed: passedNodes.size,
    complete: passedNodes.size >= nodes.length,
  };
}
