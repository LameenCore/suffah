// Adaptive-path branch state (T42): remediation gating + fast-track signals.

import { getServiceClient } from "@/lib/db";
import { countCheckpointAttempts } from "@/lib/db/queries";

/** True when the student has missed this checkpoint >=2x and hasn't seen a re-teach yet. */
export async function needsRemediation(
  nodeId: string,
  studentUserId: string,
): Promise<boolean> {
  const db = getServiceClient();
  const { data: fails, error } = await db
    .from("checkpoint_results")
    .select("passed")
    .eq("student_user_id", studentUserId)
    .eq("pathway_node_id", nodeId);
  if (error) throw new Error(`needsRemediation: ${error.message}`);
  const missed = (fails ?? []).filter((r) => r.passed !== true).length;
  if (missed < 2) return false;

  const { data: shown } = await db
    .from("node_remediations")
    .select("id")
    .eq("student_user_id", studentUserId)
    .eq("pathway_node_id", nodeId)
    .maybeSingle();
  return !shown;
}

/** Record that a post-remediation attempt passed (for the path history). */
export async function recordRemediationPassed(
  nodeId: string,
  studentUserId: string,
): Promise<void> {
  const db = getServiceClient();
  const { data: hadRemediation } = await db
    .from("node_remediations")
    .select("id")
    .eq("student_user_id", studentUserId)
    .eq("pathway_node_id", nodeId)
    .maybeSingle();
  if (!hadRemediation) return;

  const { data: already } = await db
    .from("path_events")
    .select("id")
    .eq("student_user_id", studentUserId)
    .eq("pathway_node_id", nodeId)
    .eq("kind", "remediation_passed")
    .maybeSingle();
  if (already) return;

  await db.from("path_events").insert({
    student_user_id: studentUserId,
    pathway_node_id: nodeId,
    kind: "remediation_passed",
  });
}

export const FAST_TRACK_THRESHOLD = 0.9;

/**
 * A strong first-try pass is a "could move faster" signal. Pods advance together
 * so this doesn't auto-skip - it surfaces to the admin/volunteer.
 */
export async function maybeSuggestFastTrack(
  passedNodeId: string,
  nextNodeId: string | null,
  studentUserId: string,
  score: number,
): Promise<void> {
  if (!nextNodeId || score < FAST_TRACK_THRESHOLD) return;
  const attempts = await countCheckpointAttempts(studentUserId, passedNodeId);
  if (attempts !== 1) return; // first try only

  const db = getServiceClient();
  const { data: already } = await db
    .from("path_events")
    .select("id")
    .eq("student_user_id", studentUserId)
    .eq("pathway_node_id", nextNodeId)
    .eq("kind", "fast_track_suggested")
    .maybeSingle();
  if (already) return;

  await db.from("path_events").insert({
    student_user_id: studentUserId,
    pathway_node_id: nextNodeId,
    kind: "fast_track_suggested",
    detail: { afterNodeId: passedNodeId, score },
  });
}

export interface PathEvent {
  kind: "remediation_shown" | "remediation_passed" | "fast_track_suggested";
  nodeId: string;
  nodeTitle: string;
  courseName: string;
  detail: Record<string, unknown>;
  at: string;
}

function rel<T>(v: T | T[] | null | undefined): T | null {
  return v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v;
}

export interface FastTrackSuggestion {
  studentName: string;
  nodeTitle: string;
  courseName: string;
  at: string;
}

/**
 * Open fast-track suggestions across the masjid - students who passed a
 * checkpoint cold and could move past the next node. Deduped to the latest per
 * (student, node).
 */
export async function getFastTrackSuggestions(masjidId: string): Promise<FastTrackSuggestion[]> {
  const { data, error } = await getServiceClient()
    .from("path_events")
    .select(
      "created_at, student:users!inner ( name, masjid_id ), node:pathway_nodes!inner ( title, course:courses!inner ( name, masjid_id ) )",
    )
    .eq("kind", "fast_track_suggested")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getFastTrackSuggestions: ${error.message}`);

  const out: FastTrackSuggestion[] = [];
  const seen = new Set<string>();
  for (const raw of (data ?? []) as unknown as Record<string, unknown>[]) {
    const student = rel(raw.student as unknown) as { name: string; masjid_id: string } | null;
    const node = rel(raw.node as unknown) as { title: string; course: unknown } | null;
    if (!student || student.masjid_id !== masjidId || !node) continue;
    const course = rel(node.course) as { name: string; masjid_id: string } | null;
    if (!course || course.masjid_id !== masjidId) continue;
    const key = `${student.name}:${node.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      studentName: student.name,
      nodeTitle: node.title,
      courseName: course.name,
      at: raw.created_at as string,
    });
  }
  return out;
}

/** Path branch history for one student (parent + compliance view). */
export async function getPathHistory(
  studentUserId: string,
  masjidId: string,
): Promise<PathEvent[]> {
  const { data, error } = await getServiceClient()
    .from("path_events")
    .select(
      "kind, detail, created_at, node:pathway_nodes!inner ( title, course:courses!inner ( name, masjid_id ) )",
    )
    .eq("student_user_id", studentUserId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getPathHistory: ${error.message}`);

  const out: PathEvent[] = [];
  for (const raw of (data ?? []) as unknown as Record<string, unknown>[]) {
    const node = rel(raw.node as unknown) as
      | { title: string; course: unknown }
      | null;
    if (!node) continue;
    const course = rel(node.course) as { name: string; masjid_id: string } | null;
    if (!course || course.masjid_id !== masjidId) continue;
    out.push({
      kind: raw.kind as PathEvent["kind"],
      nodeId: "",
      nodeTitle: node.title,
      courseName: course.name,
      detail: (raw.detail as Record<string, unknown>) ?? {},
      at: raw.created_at as string,
    });
  }
  return out;
}
