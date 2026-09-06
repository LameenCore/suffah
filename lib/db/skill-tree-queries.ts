// Prerequisite / skill-tree graph (T43). Edges can cross courses.

import { getServiceClient } from "@/lib/db";
import { getReadClient } from "@/lib/db/server";
import { unwrapRelation as rel } from "@/lib/db/rel";

export interface GraphNode {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  sequenceOrder: number;
  conceptTag: string | null;
  /** prereq node ids */
  prereqs: string[];
}

export interface SkillGraph {
  nodes: GraphNode[];
  byId: Map<string, GraphNode>;
}

/** Every node in the masjid + its prerequisite edges. */
export async function listSkillGraph(masjidId: string): Promise<SkillGraph> {
  const db = (await getReadClient());
  const { data: nodeRows, error } = await db
    .from("pathway_nodes")
    .select("id, title, sequence_order, concept_tag, course:courses!inner ( id, name, masjid_id )")
    .order("sequence_order", { ascending: true });
  if (error) throw new Error(`listSkillGraph: ${error.message}`);

  const nodes: GraphNode[] = [];
  for (const raw of (nodeRows ?? []) as unknown as Record<string, unknown>[]) {
    const course = rel(raw.course as unknown) as
      | { id: string; name: string; masjid_id: string }
      | null;
    if (!course || course.masjid_id !== masjidId) continue;
    nodes.push({
      id: raw.id as string,
      title: raw.title as string,
      courseId: course.id,
      courseName: course.name,
      sequenceOrder: raw.sequence_order as number,
      conceptTag: (raw.concept_tag as string | null) ?? null,
      prereqs: [],
    });
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nodeIds = new Set(byId.keys());

  const { data: edges, error: eErr } = await db
    .from("node_prerequisites")
    .select("node_id, prereq_node_id");
  if (eErr) throw new Error(`listSkillGraph: ${eErr.message}`);
  for (const e of edges ?? []) {
    const nid = e.node_id as string;
    const pid = e.prereq_node_id as string;
    if (nodeIds.has(nid) && nodeIds.has(pid)) byId.get(nid)!.prereqs.push(pid);
  }

  return { nodes, byId };
}

export interface PrereqStatus {
  locked: boolean;
  /** Unmet prerequisites (passed check not on record for this student). */
  unmet: Array<{ id: string; title: string; courseName: string }>;
}

/**
 * Per-node lock status for one student. A node is locked when it has a
 * prerequisite whose checkpoint this student has not passed.
 */
export async function getPrereqStatus(
  studentUserId: string,
  masjidId: string,
): Promise<Map<string, PrereqStatus>> {
  const graph = await listSkillGraph(masjidId);

  const { data: cr, error } = await (await getReadClient())
    .from("checkpoint_results")
    .select("pathway_node_id, passed")
    .eq("student_user_id", studentUserId);
  if (error) throw new Error(`getPrereqStatus: ${error.message}`);
  const passed = new Set(
    (cr ?? []).filter((r) => r.passed === true).map((r) => r.pathway_node_id as string),
  );

  const out = new Map<string, PrereqStatus>();
  for (const node of graph.nodes) {
    const unmet = node.prereqs
      .filter((pid) => !passed.has(pid))
      .map((pid) => {
        const p = graph.byId.get(pid)!;
        return { id: p.id, title: p.title, courseName: p.courseName };
      });
    out.set(node.id, { locked: unmet.length > 0, unmet });
  }
  return out;
}

// --- writes (admin) ----------------------------------------------------------

async function assertNodeInMasjid(nodeId: string, masjidId: string): Promise<void> {
  const { data, error } = await (await getReadClient())
    .from("pathway_nodes")
    .select("id, course:courses!inner ( masjid_id )")
    .eq("id", nodeId)
    .maybeSingle();
  if (error) throw new Error(`assertNodeInMasjid: ${error.message}`);
  const course = rel(data?.course as unknown) as { masjid_id: string } | null;
  if (!course || course.masjid_id !== masjidId) {
    throw new Error("node not found in this masjid");
  }
}

/** Would adding node <- prereq create a cycle? (prereq already depends on node) */
function wouldCycle(graph: SkillGraph, nodeId: string, prereqId: string): boolean {
  const stack = [prereqId];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === nodeId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const p of graph.byId.get(cur)?.prereqs ?? []) stack.push(p);
  }
  return false;
}

export async function addPrerequisite(
  masjidId: string,
  nodeId: string,
  prereqNodeId: string,
): Promise<void> {
  if (nodeId === prereqNodeId) throw new Error("a node cannot require itself");
  await Promise.all([
    assertNodeInMasjid(nodeId, masjidId),
    assertNodeInMasjid(prereqNodeId, masjidId),
  ]);

  const graph = await listSkillGraph(masjidId);
  if (wouldCycle(graph, nodeId, prereqNodeId)) {
    throw new Error("that would create a circular dependency");
  }

  const { error } = await getServiceClient()
    .from("node_prerequisites")
    .insert({ node_id: nodeId, prereq_node_id: prereqNodeId });
  if (error && !error.message.includes("duplicate")) {
    throw new Error(`addPrerequisite: ${error.message}`);
  }
}

export async function removePrerequisite(
  masjidId: string,
  nodeId: string,
  prereqNodeId: string,
): Promise<void> {
  await assertNodeInMasjid(nodeId, masjidId);
  const { error } = await getServiceClient()
    .from("node_prerequisites")
    .delete()
    .eq("node_id", nodeId)
    .eq("prereq_node_id", prereqNodeId);
  if (error) throw new Error(`removePrerequisite: ${error.message}`);
}

export async function setConceptTag(
  masjidId: string,
  nodeId: string,
  tag: string,
): Promise<void> {
  await assertNodeInMasjid(nodeId, masjidId);
  const { error } = await getServiceClient()
    .from("pathway_nodes")
    .update({ concept_tag: tag.trim() || null })
    .eq("id", nodeId);
  if (error) throw new Error(`setConceptTag: ${error.message}`);
}
