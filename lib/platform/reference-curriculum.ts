// Shared curriculum adopt/fork (T81). A deep copy of courses -> units ->
// pathway_nodes (including generated lesson_content / checkpoint_content) from
// one masjid into another. Used to seed the reference tenant from the demo, to
// fill a freshly-provisioned masjid, and for an admin's "adopt the shared
// curriculum" action on /admin/authoring. The copy is independent — editing it
// never touches the source.

import { getServiceClient } from "@/lib/db";

/** The sentinel masjid that holds the shared Secondary 1 curriculum. */
export const REFERENCE_MASJID_ID = "00000000-0000-0000-0000-0000000000fe";

export interface CopyResult {
  coursesCopied: number;
  nodesCopied: number;
  skipped: string[]; // course names already present in the target
}

/**
 * Copy every course the source masjid has into the target masjid. A course whose
 * name already exists in the target is skipped (so this is safe to re-run and to
 * use as a "top up"). Tenant ids are supplied by the caller, never the request.
 */
export async function copyCurriculum(
  fromMasjidId: string,
  toMasjidId: string,
): Promise<CopyResult> {
  if (fromMasjidId === toMasjidId) {
    throw new Error("copyCurriculum: source and target are the same masjid");
  }
  const db = getServiceClient();

  const [{ data: srcCourses, error: scErr }, { data: dstCourses, error: dcErr }] =
    await Promise.all([
      db
        .from("courses")
        .select("id, name, grade_band")
        .eq("masjid_id", fromMasjidId)
        .order("name"),
      db.from("courses").select("name").eq("masjid_id", toMasjidId),
    ]);
  if (scErr) throw new Error(`copyCurriculum (source courses): ${scErr.message}`);
  if (dcErr) throw new Error(`copyCurriculum (target courses): ${dcErr.message}`);

  const have = new Set((dstCourses ?? []).map((c) => (c.name as string).toLowerCase()));
  const result: CopyResult = { coursesCopied: 0, nodesCopied: 0, skipped: [] };

  for (const course of srcCourses ?? []) {
    if (have.has((course.name as string).toLowerCase())) {
      result.skipped.push(course.name as string);
      continue;
    }

    const { data: newCourse, error: ncErr } = await db
      .from("courses")
      .insert({
        masjid_id: toMasjidId,
        name: course.name,
        grade_band: course.grade_band,
      })
      .select("id")
      .single();
    if (ncErr || !newCourse) {
      throw new Error(`copyCurriculum (course ${course.name}): ${ncErr?.message}`);
    }

    // units for this course
    const { data: units, error: uErr } = await db
      .from("units")
      .select("id, title, sequence_order")
      .eq("course_id", course.id)
      .order("sequence_order");
    if (uErr) throw new Error(`copyCurriculum (units): ${uErr.message}`);

    const unitIdMap = new Map<string, string>();
    for (const u of units ?? []) {
      const { data: nu, error: nuErr } = await db
        .from("units")
        .insert({
          course_id: newCourse.id,
          title: u.title,
          sequence_order: u.sequence_order,
        })
        .select("id")
        .single();
      if (nuErr || !nu) throw new Error(`copyCurriculum (unit ${u.title}): ${nuErr?.message}`);
      unitIdMap.set(u.id as string, nu.id as string);
    }

    // pathway nodes (with content)
    const { data: nodes, error: nErr } = await db
      .from("pathway_nodes")
      .select("unit_id, sequence_order, title, lesson_content, checkpoint_content")
      .eq("course_id", course.id)
      .order("sequence_order");
    if (nErr) throw new Error(`copyCurriculum (nodes): ${nErr.message}`);

    const nodeRows = (nodes ?? []).map((n) => ({
      course_id: newCourse.id,
      unit_id: n.unit_id ? (unitIdMap.get(n.unit_id as string) ?? null) : null,
      sequence_order: n.sequence_order,
      title: n.title,
      lesson_content: n.lesson_content ?? null,
      checkpoint_content: n.checkpoint_content ?? null,
    }));
    if (nodeRows.length > 0) {
      const { error: niErr } = await db.from("pathway_nodes").insert(nodeRows);
      if (niErr) throw new Error(`copyCurriculum (node insert): ${niErr.message}`);
    }

    result.coursesCopied += 1;
    result.nodesCopied += nodeRows.length;
  }

  return result;
}

/** Copy the shared reference curriculum into a masjid. */
export async function adoptSharedCurriculum(toMasjidId: string): Promise<CopyResult> {
  return copyCurriculum(REFERENCE_MASJID_ID, toMasjidId);
}

/** Does the reference masjid actually have a curriculum to adopt? */
export async function referenceHasCurriculum(): Promise<boolean> {
  const { count, error } = await getServiceClient()
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("masjid_id", REFERENCE_MASJID_ID);
  if (error) return false;
  return (count ?? 0) > 0;
}
