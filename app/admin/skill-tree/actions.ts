"use server";

// Server actions for the skill-tree editor (T43). Admin only, masjid-scoped.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  addPrerequisite,
  removePrerequisite,
  setConceptTag,
} from "@/lib/db/skill-tree-queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

export async function addPrereqAction(
  nodeId: string,
  prereqNodeId: string,
): Promise<ActionResult> {
  let user;
  try {
    user = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "not permitted" };
  }
  try {
    await addPrerequisite(user.masjidId, nodeId, prereqNodeId);
    await recordAudit({
      actor: user,
      action: "skill_tree.prereq_added",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { prereqNodeId },
    });
    revalidatePath("/admin/skill-tree");
    revalidatePath("/student", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "could not add" };
  }
}

export async function removePrereqAction(
  nodeId: string,
  prereqNodeId: string,
): Promise<ActionResult> {
  let user;
  try {
    user = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "not permitted" };
  }
  try {
    await removePrerequisite(user.masjidId, nodeId, prereqNodeId);
    await recordAudit({
      actor: user,
      action: "skill_tree.prereq_removed",
      targetType: "pathway_node",
      targetId: nodeId,
      metadata: { prereqNodeId },
    });
    revalidatePath("/admin/skill-tree");
    revalidatePath("/student", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "could not remove" };
  }
}

export async function setConceptTagAction(
  nodeId: string,
  tag: string,
): Promise<ActionResult> {
  let user;
  try {
    user = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "not permitted" };
  }
  try {
    await setConceptTag(user.masjidId, nodeId, tag);
    revalidatePath("/admin/skill-tree");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "could not save" };
  }
}
