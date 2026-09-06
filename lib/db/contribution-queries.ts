// Community knowledge sourcing for lessons (T22). Reads/writes
// lesson_contributions and surfaces which Seerah lesson drafts have pending
// community input. Tenancy is enforced via the node -> course -> masjid chain
// (getPathwayNode already does this check).

import { getServiceClient } from "@/lib/db";
import { getReadClient } from "@/lib/db/server";
import { getPathwayNode } from "@/lib/db/queries";

export interface Contribution {
  id: string;
  nodeId: string;
  contributorName: string;
  contributorRole: string | null;
  note: string;
  incorporated: boolean;
  createdAt: string;
}

export interface SeerahNodeRow {
  id: string;
  sequenceOrder: number;
  title: string;
  hasLesson: boolean;
  /** communityRevision.version from lesson_content JSON, or 1. */
  version: number;
  revisedAt: string | null;
  pendingContributions: number;
  incorporatedContributions: number;
}

interface CommunityRevision {
  version: number;
  revisedAt: string;
  incorporated: { name: string; role: string | null; note: string }[];
}

function readRevision(lessonContent: unknown): CommunityRevision | null {
  if (!lessonContent || typeof lessonContent !== "object") return null;
  const cr = (lessonContent as Record<string, unknown>).communityRevision;
  if (!cr || typeof cr !== "object") return null;
  const rec = cr as Record<string, unknown>;
  if (typeof rec.version !== "number") return null;
  return {
    version: rec.version,
    revisedAt: typeof rec.revisedAt === "string" ? rec.revisedAt : "",
    incorporated: Array.isArray(rec.incorporated)
      ? (rec.incorporated as CommunityRevision["incorporated"])
      : [],
  };
}

export { readRevision };
export type { CommunityRevision };

/** Seerah pathway nodes for the masjid, with lesson + contribution state. */
export async function listSeerahNodes(masjidId: string): Promise<SeerahNodeRow[]> {
  const db = (await getReadClient());

  const { data: course, error: cErr } = await db
    .from("courses")
    .select("id, name, masjid_id")
    .eq("masjid_id", masjidId)
    .eq("name", "Seerah")
    .maybeSingle();
  if (cErr) throw new Error(`listSeerahNodes: ${cErr.message}`);
  if (!course) return [];

  const { data: nodes, error: nErr } = await db
    .from("pathway_nodes")
    .select("id, sequence_order, title, lesson_content")
    .eq("course_id", course.id)
    .order("sequence_order", { ascending: true });
  if (nErr) throw new Error(`listSeerahNodes: ${nErr.message}`);

  const ids = (nodes ?? []).map((n) => n.id as string);
  const pending = new Map<string, number>();
  const incorporated = new Map<string, number>();
  if (ids.length > 0) {
    const { data: contribs, error: coErr } = await db
      .from("lesson_contributions")
      .select("node_id, incorporated")
      .in("node_id", ids);
    if (coErr) throw new Error(`listSeerahNodes: ${coErr.message}`);
    for (const c of contribs ?? []) {
      const nid = c.node_id as string;
      const m = c.incorporated ? incorporated : pending;
      m.set(nid, (m.get(nid) ?? 0) + 1);
    }
  }

  return (nodes ?? []).map((n) => {
    const rev = readRevision(n.lesson_content);
    return {
      id: n.id as string,
      sequenceOrder: n.sequence_order as number,
      title: n.title as string,
      hasLesson: n.lesson_content != null,
      version: rev?.version ?? 1,
      revisedAt: rev?.revisedAt || null,
      pendingContributions: pending.get(n.id as string) ?? 0,
      incorporatedContributions: incorporated.get(n.id as string) ?? 0,
    };
  });
}

/** Contributions for one node (tenant-guarded). Newest first. */
export async function listContributions(
  nodeId: string,
  masjidId: string,
): Promise<Contribution[]> {
  const node = await getPathwayNode(nodeId, masjidId);
  if (!node) throw new Error("node not found in this masjid");

  const { data, error } = await (await getReadClient())
    .from("lesson_contributions")
    .select("id, node_id, contributor_name, contributor_role, note, incorporated, created_at")
    .eq("node_id", nodeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listContributions: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    nodeId: r.node_id as string,
    contributorName: r.contributor_name as string,
    contributorRole: (r.contributor_role as string | null) ?? null,
    note: r.note as string,
    incorporated: Boolean(r.incorporated),
    createdAt: r.created_at as string,
  }));
}

export async function addContribution(
  masjidId: string,
  nodeId: string,
  input: { name: string; role: string; note: string },
): Promise<void> {
  const node = await getPathwayNode(nodeId, masjidId);
  if (!node) throw new Error("node not found in this masjid");

  const name = input.name.trim();
  const note = input.note.trim();
  if (!name) throw new Error("contributor name is required");
  if (!note) throw new Error("a note is required");

  const { error } = await getServiceClient().from("lesson_contributions").insert({
    node_id: nodeId,
    contributor_name: name,
    contributor_role: input.role.trim() || null,
    note,
  });
  if (error) throw new Error(`addContribution: ${error.message}`);
}
