// In-app help / bug reports (support_requests, migration 0009). Masjid-scoped.

import { getServiceClient } from "@/lib/db";
import { getReadClient } from "@/lib/db/server";
import type { SessionUser } from "@/lib/types";

// "data-erasure" is filed by the parent privacy page (T36), not the help form.
export type SupportCategory = "question" | "bug" | "idea" | "data-erasure";
export type SupportStatus = "open" | "resolved";

export interface SupportRequest {
  id: string;
  fromName: string;
  fromRole: string;
  category: SupportCategory;
  subject: string;
  body: string;
  status: SupportStatus;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export async function createSupportRequest(
  user: SessionUser,
  input: { category: SupportCategory; subject: string; body: string },
): Promise<void> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject || !body) throw new Error("Add a subject and a message.");
  if (subject.length > 160) throw new Error("Keep the subject under 160 characters.");

  const { error } = await getServiceClient().from("support_requests").insert({
    masjid_id: user.masjidId,
    from_user_id: user.id,
    from_role: user.role,
    from_name: user.name,
    category: input.category,
    subject,
    body,
  });
  if (error) throw new Error(`createSupportRequest: ${error.message}`);
}

export async function countOpenSupport(masjidId: string): Promise<number> {
  const { count, error } = await (await getReadClient())
    .from("support_requests")
    .select("id", { count: "exact", head: true })
    .eq("masjid_id", masjidId)
    .eq("status", "open");
  if (error) throw new Error(`countOpenSupport: ${error.message}`);
  return count ?? 0;
}

function shape(r: Record<string, unknown>): SupportRequest {
  return {
    id: r.id as string,
    fromName: r.from_name as string,
    fromRole: r.from_role as string,
    category: (r.category as SupportCategory) ?? "question",
    subject: r.subject as string,
    body: r.body as string,
    status: (r.status as SupportStatus) ?? "open",
    adminNote: (r.admin_note as string | null) ?? null,
    createdAt: r.created_at as string,
    resolvedAt: (r.resolved_at as string | null) ?? null,
  };
}

export async function listSupportRequests(masjidId: string): Promise<SupportRequest[]> {
  const { data, error } = await (await getReadClient())
    .from("support_requests")
    .select("*")
    .eq("masjid_id", masjidId)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listSupportRequests: ${error.message}`);
  return (data ?? []).map((r) => shape(r as Record<string, unknown>));
}

/** Requests this user sent (so they can see their own thread). */
export async function listOwnSupportRequests(
  userId: string,
  masjidId: string,
): Promise<SupportRequest[]> {
  const { data, error } = await (await getReadClient())
    .from("support_requests")
    .select("*")
    .eq("masjid_id", masjidId)
    .eq("from_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(`listOwnSupportRequests: ${error.message}`);
  return (data ?? []).map((r) => shape(r as Record<string, unknown>));
}

export async function resolveSupportRequest(
  requestId: string,
  masjidId: string,
  adminNote: string | null,
): Promise<void> {
  const db = getServiceClient();
  // tenant guard
  const { data, error: readErr } = await db
    .from("support_requests")
    .select("id, masjid_id")
    .eq("id", requestId)
    .maybeSingle();
  if (readErr) throw new Error(`resolveSupportRequest: ${readErr.message}`);
  if (!data || data.masjid_id !== masjidId) throw new Error("request not found in this masjid");

  const { error } = await db
    .from("support_requests")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      admin_note: adminNote?.trim() || null,
    })
    .eq("id", requestId);
  if (error) throw new Error(`resolveSupportRequest: ${error.message}`);
}

export async function reopenSupportRequest(
  requestId: string,
  masjidId: string,
): Promise<void> {
  const db = getServiceClient();
  const { data, error: readErr } = await db
    .from("support_requests")
    .select("id, masjid_id")
    .eq("id", requestId)
    .maybeSingle();
  if (readErr) throw new Error(`reopenSupportRequest: ${readErr.message}`);
  if (!data || data.masjid_id !== masjidId) throw new Error("request not found in this masjid");

  const { error } = await db
    .from("support_requests")
    .update({ status: "open", resolved_at: null })
    .eq("id", requestId);
  if (error) throw new Error(`reopenSupportRequest: ${error.message}`);
}
