// Law 25 data-subject requests (T36): self-serve export of everything Suffa holds
// about a family, and a tracked right-to-erasure request.
//
// The export is READ-ONLY and assembled from the guardian's own linked children
// (parent_children, migration 0005) within the guardian's masjid — the same
// tenant + relationship guard the parent dashboard uses. Erasure is NOT executed
// here: it files a request for the privacy officer (support_requests) plus an
// audit entry, because account deletion is a deliberate, logged human action.

import { getServiceClient } from "@/lib/db";
import { getReadClient } from "@/lib/db/server";
import { unwrapRelation } from "@/lib/db/rel";
import { recordAudit } from "@/lib/audit";
import { listConsentRecords } from "@/lib/consent";
import { getChildrenForParent } from "@/lib/db/parent-queries";
import type { SessionUser } from "@/lib/types";

export interface FamilyDataExport {
  generatedAt: string;
  note: string;
  guardian: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string | null;
  };
  children: ChildDataExport[];
}

interface ChildDataExport {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
  pods: { podName: string }[];
  lessonProgress: Record<string, unknown>[];
  checkpointResults: Record<string, unknown>[];
  unitAssessmentResults: Record<string, unknown>[];
  termExamResults: Record<string, unknown>[];
  complianceReports: Record<string, unknown>[];
  barakahNotes: Record<string, unknown>[];
  consentRecords: Record<string, unknown>[];
}

const EXPORT_NOTE =
  "Everything Suffa holds about this family, assembled for a Law 25 access / " +
  "portability request. Pod-level session notes that are not child-specific are " +
  "available from the masjid administrator on request.";

/**
 * Assemble the full data export for a guardian and every child linked to them.
 * Tenant + relationship scoped: only children in `getChildrenForParent`.
 */
export async function exportFamilyData(
  guardian: Pick<SessionUser, "id" | "masjidId">,
): Promise<FamilyDataExport> {
  const db = (await getReadClient());

  const { data: gRow, error: gErr } = await db
    .from("users")
    .select("id, name, email, role, created_at, masjid_id")
    .eq("id", guardian.id)
    .maybeSingle();
  if (gErr) throw new Error(`exportFamilyData (guardian): ${gErr.message}`);
  if (!gRow || gRow.masjid_id !== guardian.masjidId) {
    throw new Error("guardian not found in this masjid");
  }

  const children = await getChildrenForParent(guardian.id, guardian.masjidId);

  const childExports: ChildDataExport[] = [];
  for (const child of children) {
    const { data: cRow } = await db
      .from("users")
      .select("id, name, email, created_at")
      .eq("id", child.id)
      .maybeSingle();

    const [pods, lp, cp, ua, te, cr, bk] = await Promise.all([
      db
        .from("pod_students")
        .select("pod:pods!inner ( name, masjid_id )")
        .eq("student_user_id", child.id),
      db.from("lesson_progress").select("*").eq("student_user_id", child.id),
      db.from("checkpoint_results").select("*").eq("student_user_id", child.id),
      db.from("unit_assessment_results").select("*").eq("student_user_id", child.id),
      db.from("term_exam_results").select("*").eq("student_user_id", child.id),
      // compliance_reports has no masjid_id column; the child is already
      // masjid-scoped via getChildrenForParent.
      db.from("compliance_reports").select("*").eq("student_user_id", child.id),
      db
        .from("pod_barakah_log")
        .select("*")
        .eq("student_user_id", child.id)
        .eq("masjid_id", guardian.masjidId),
    ]);

    const consent = await listConsentRecords(child.id, guardian.masjidId);

    const podRows = ((pods.data ?? []) as unknown as Record<string, unknown>[])
      .map((r) => {
        const pod = unwrapRelation(r.pod) as
          | { name: string; masjid_id: string }
          | null;
        if (!pod || pod.masjid_id !== guardian.masjidId) return null;
        return { podName: pod.name };
      })
      .filter((r): r is { podName: string } => r !== null);

    childExports.push({
      id: child.id,
      name: child.name,
      email: (cRow?.email as string) ?? "",
      createdAt: (cRow?.created_at as string | null) ?? null,
      pods: podRows,
      lessonProgress: (lp.data ?? []) as Record<string, unknown>[],
      checkpointResults: (cp.data ?? []) as Record<string, unknown>[],
      unitAssessmentResults: (ua.data ?? []) as Record<string, unknown>[],
      termExamResults: (te.data ?? []) as Record<string, unknown>[],
      complianceReports: (cr.data ?? []) as Record<string, unknown>[],
      barakahNotes: (bk.data ?? []) as Record<string, unknown>[],
      consentRecords: consent as unknown as Record<string, unknown>[],
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    note: EXPORT_NOTE,
    guardian: {
      id: gRow.id as string,
      name: gRow.name as string,
      email: gRow.email as string,
      role: gRow.role as string,
      createdAt: (gRow.created_at as string | null) ?? null,
    },
    children: childExports,
  };
}

/**
 * File a right-to-erasure request for the privacy officer to action. Does not
 * delete anything — records the request (support_requests) and an audit entry.
 */
export async function requestDataErasure(
  guardian: SessionUser,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim().slice(0, 2000);
  const children = await getChildrenForParent(guardian.id, guardian.masjidId);

  const { error } = await getServiceClient().from("support_requests").insert({
    masjid_id: guardian.masjidId,
    from_user_id: guardian.id,
    from_role: guardian.role,
    from_name: guardian.name,
    category: "data-erasure",
    subject: `Data erasure request — ${guardian.name}`,
    body:
      `Guardian ${guardian.name} (${guardian.email}) requests erasure of their ` +
      `family's data.\n\nChildren linked: ${
        children.map((c) => c.name).join(", ") || "(none)"
      }\n\nReason given: ${trimmed || "(none)"}\n\n` +
      "Action: privacy officer to confirm identity, perform the deletion, scrub " +
      "free-text mentions, and record what was legally retained.",
    status: "open",
  });
  if (error) throw new Error(`requestDataErasure: ${error.message}`);

  await recordAudit({
    actor: { id: guardian.id, role: guardian.role, masjidId: guardian.masjidId },
    action: "privacy.erasure_requested",
    targetType: "guardian",
    targetId: guardian.id,
    metadata: { childCount: children.length },
  });
}
