// Masjid-scoped read/write helpers. Route handlers and server code call these
// instead of hand-rolling Supabase queries so that masjid_id scoping stays in
// one place (see .claude/skills/api-design.md — every query filters by tenant).

import { getServiceClient } from "@/lib/db";
import type { CourseName } from "@/lib/types";
import type { LessonContent } from "@/lib/ai/lesson";

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
  course: CourseRef;
}

/** pathway_nodes -> courses join, then an explicit masjid_id check. */
const NODE_SELECT =
  "id, course_id, unit_id, sequence_order, title, lesson_content, " +
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
