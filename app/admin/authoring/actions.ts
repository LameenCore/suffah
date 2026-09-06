"use server";

// Server actions for the admin course-authoring UI (T50). Admin only,
// masjid-scoped. Every export re-checks the session + role on its first line and
// re-scopes masjid_id from the session, never the client (see
// .claude/skills/api-design.md). Every mutation is audit-logged.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  createNode,
  renameNode,
  moveNode,
  setNodeUnit,
  addUnit,
  deleteNode,
  saveLessonJson,
  saveCheckpointJson,
} from "@/lib/db/authoring-queries";
import { generateLessonForNode } from "@/lib/ai/lesson";
import { generateCheckpointForNode } from "@/lib/ai/checkpoint";
import type { SessionUser } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

function fail(err: unknown): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : "action failed" };
}

/** Revalidate everything that reads pathway content after a structural/content change. */
function revalidateAll(courseId?: string) {
  revalidatePath("/admin/authoring");
  if (courseId) revalidatePath(`/admin/authoring/${courseId}`);
  revalidatePath("/admin/skill-tree");
  revalidatePath("/student", "layout");
}

export async function createNodeAction(
  courseId: string,
  title: string,
  unitId: string | null,
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    const nodeId = await createNode(user.masjidId, courseId, title, unitId || null);
    await recordAudit({
      actor: user,
      action: "course.node_added",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId, unitId: unitId || null },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function renameNodeAction(
  courseId: string,
  nodeId: string,
  title: string,
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    await renameNode(user.masjidId, nodeId, title);
    await recordAudit({
      actor: user,
      action: "course.node_renamed",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function moveNodeAction(
  courseId: string,
  nodeId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    await moveNode(user.masjidId, nodeId, direction);
    await recordAudit({
      actor: user,
      action: "course.node_reordered",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId, direction },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function setNodeUnitAction(
  courseId: string,
  nodeId: string,
  unitId: string | null,
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    await setNodeUnit(user.masjidId, nodeId, unitId || null);
    await recordAudit({
      actor: user,
      action: "course.node_unit_set",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId, unitId: unitId || null },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function addUnitAction(courseId: string, title: string): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    const unitId = await addUnit(user.masjidId, courseId, title);
    await recordAudit({
      actor: user,
      action: "course.unit_added",
      targetType: "unit",
      targetId: unitId,
      metadata: { courseId },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteNodeAction(
  courseId: string,
  nodeId: string,
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    await deleteNode(user.masjidId, nodeId);
    await recordAudit({
      actor: user,
      action: "course.node_deleted",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function saveLessonJsonAction(
  courseId: string,
  nodeId: string,
  json: string,
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    await saveLessonJson(user.masjidId, nodeId, json);
    await recordAudit({
      actor: user,
      action: "course.lesson_saved",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId, mode: "hand_edit" },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function saveCheckpointJsonAction(
  courseId: string,
  nodeId: string,
  json: string,
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    await saveCheckpointJson(user.masjidId, nodeId, json);
    await recordAudit({
      actor: user,
      action: "course.checkpoint_saved",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId, mode: "hand_edit" },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function regenerateLessonAction(
  courseId: string,
  nodeId: string,
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    const res = await generateLessonForNode(nodeId, user.masjidId, {
      force: true,
      actorUserId: user.id,
    });
    await recordAudit({
      actor: user,
      action: "course.lesson_regenerated",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId, source: res.source },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function regenerateCheckpointAction(
  courseId: string,
  nodeId: string,
): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requireAdmin();
  } catch (err) {
    return fail(err);
  }
  try {
    const res = await generateCheckpointForNode(nodeId, user.masjidId, {
      force: true,
      actorUserId: user.id,
    });
    await recordAudit({
      actor: user,
      action: "course.checkpoint_regenerated",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { courseId, source: res.source },
    });
    revalidateAll(courseId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
