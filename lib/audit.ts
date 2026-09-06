// Audit trail for sensitive admin actions (T35, migration 0010).
//
// recordAudit() is best-effort: a logging failure must never break the action it
// is recording (same rule as the continuity session-note hook). The table is
// append-only at the DB level, so entries here are the real record.

import { getServiceClient } from "@/lib/db";
import { unwrapRelation } from "@/lib/db/rel";
import type { SessionUser } from "@/lib/types";

export interface AuditEntryInput {
  actor: Pick<SessionUser, "id" | "role" | "masjidId">;
  /** Dotted verb, past tense-ish: 'volunteer.departure', 'pod.student_added'. */
  action: string;
  targetType?: string;
  targetId?: string;
  /** Small, id-level context only - no names, notes, or free text with PII. */
  metadata?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  at: string;
}

/** Write one audit entry. Never throws - logs and swallows on failure. */
export async function recordAudit(input: AuditEntryInput): Promise<void> {
  try {
    const { error } = await getServiceClient()
      .from("audit_log")
      .insert({
        masjid_id: input.actor.masjidId,
        actor_user_id: input.actor.id,
        actor_role: input.actor.role,
        action: input.action,
        target_type: input.targetType ?? null,
        target_id: input.targetId ?? null,
        metadata: input.metadata ?? {},
      });
    if (error) console.error("[audit] insert failed:", error.message);
  } catch (err) {
    console.error("[audit] insert threw:", err);
  }
}

/** Most-recent audit entries for a masjid (admin trail view). */
export async function listAuditEntries(
  masjidId: string,
  limit = 100,
): Promise<AuditEntry[]> {
  const { data, error } = await getServiceClient()
    .from("audit_log")
    .select(
      "id, actor_user_id, actor_role, action, target_type, target_id, metadata, at, " +
        "actor:users!audit_log_actor_user_id_fkey ( name )",
    )
    .eq("masjid_id", masjidId)
    .order("at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listAuditEntries: ${error.message}`);

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  return rows.map((r) => {
    const actor = unwrapRelation(r.actor) as { name: string } | null;
    return {
      id: r.id as string,
      actorUserId: (r.actor_user_id as string | null) ?? null,
      actorName: actor?.name ?? null,
      actorRole: (r.actor_role as string | null) ?? null,
      action: r.action as string,
      targetType: (r.target_type as string | null) ?? null,
      targetId: (r.target_id as string | null) ?? null,
      metadata: (r.metadata as Record<string, unknown> | null) ?? {},
      at: r.at as string,
    };
  });
}
