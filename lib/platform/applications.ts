// Masjid onboarding applications (T63). Service-role throughout: the public
// submit path is a validated server action; review is platform-admin only.

import { getServiceClient } from "@/lib/db";
import { provisionMasjid, type ProvisionResult } from "@/lib/platform/provision";
import { recordAudit } from "@/lib/audit";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface MasjidApplication {
  id: string;
  masjidName: string;
  contactName: string;
  contactEmail: string;
  city: string | null;
  note: string | null;
  status: ApplicationStatus;
  reviewNote: string | null;
  provisionedMasjidId: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function shape(r: Record<string, unknown>): MasjidApplication {
  return {
    id: r.id as string,
    masjidName: r.masjid_name as string,
    contactName: r.contact_name as string,
    contactEmail: r.contact_email as string,
    city: (r.city as string | null) ?? null,
    note: (r.note as string | null) ?? null,
    status: (r.status as ApplicationStatus) ?? "pending",
    reviewNote: (r.review_note as string | null) ?? null,
    provisionedMasjidId: (r.provisioned_masjid_id as string | null) ?? null,
    createdAt: r.created_at as string,
    reviewedAt: (r.reviewed_at as string | null) ?? null,
  };
}

export async function submitMasjidApplication(input: {
  masjidName: string;
  contactName: string;
  contactEmail: string;
  city?: string;
  note?: string;
}): Promise<void> {
  const masjidName = input.masjidName.trim();
  const contactName = input.contactName.trim();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  if (!masjidName || !contactName) throw new Error("Masjid name and a contact name are required.");
  if (!EMAIL_RE.test(contactEmail)) throw new Error("Enter a valid contact email.");
  if (masjidName.length > 160) throw new Error("Keep the masjid name under 160 characters.");

  // Soft dedupe: one pending application per email.
  const db = getServiceClient();
  const { data: existing } = await db
    .from("masjid_applications")
    .select("id")
    .eq("contact_email", contactEmail)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return; // silently succeed — don't leak which emails have applied

  const { error } = await db.from("masjid_applications").insert({
    masjid_name: masjidName,
    contact_name: contactName,
    contact_email: contactEmail,
    city: input.city?.trim() || null,
    note: input.note?.trim().slice(0, 2000) || null,
  });
  if (error) throw new Error(`submitMasjidApplication: ${error.message}`);
}

export async function listMasjidApplications(
  status?: ApplicationStatus,
): Promise<MasjidApplication[]> {
  let q = getServiceClient()
    .from("masjid_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(`listMasjidApplications: ${error.message}`);
  return (data ?? []).map((r) => shape(r as Record<string, unknown>));
}

export async function countPendingApplications(): Promise<number> {
  const { count, error } = await getServiceClient()
    .from("masjid_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw new Error(`countPendingApplications: ${error.message}`);
  return count ?? 0;
}

/** Generate a readable temporary password for the provisioned admin. */
function tempPassword(): string {
  const words = ["barakah", "sabr", "shukr", "noor", "amal", "hilm"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-suffa-${n}`;
}

export interface ApprovalResult extends ProvisionResult {
  adminEmail: string;
  tempPassword: string;
}

export async function approveApplication(
  applicationId: string,
  reviewerUserId: string,
  opts?: { defaultLocale?: string; reviewNote?: string },
): Promise<ApprovalResult> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("masjid_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) throw new Error(`approveApplication: ${error.message}`);
  if (!data) throw new Error("Application not found.");
  const app = shape(data as Record<string, unknown>);
  if (app.status !== "pending") throw new Error(`Application is already ${app.status}.`);

  const pw = tempPassword();
  const result = await provisionMasjid({
    name: app.masjidName,
    defaultLocale: opts?.defaultLocale ?? "fr",
    adminName: app.contactName,
    adminEmail: app.contactEmail,
    adminPassword: pw,
  });

  const { error: updErr } = await db
    .from("masjid_applications")
    .update({
      status: "approved",
      review_note: opts?.reviewNote?.trim() || null,
      reviewed_by: reviewerUserId,
      provisioned_masjid_id: result.masjidId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);
  if (updErr) throw new Error(`approveApplication (update): ${updErr.message}`);

  await recordAudit({
    actor: { id: reviewerUserId, role: "admin", masjidId: result.masjidId },
    action: "platform.masjid_provisioned",
    targetType: "masjid",
    targetId: result.masjidId,
    metadata: { applicationId },
  });

  return { ...result, adminEmail: app.contactEmail, tempPassword: pw };
}

export async function rejectApplication(
  applicationId: string,
  reviewerUserId: string,
  reviewNote: string,
): Promise<void> {
  const { error } = await getServiceClient()
    .from("masjid_applications")
    .update({
      status: "rejected",
      review_note: reviewNote.trim() || null,
      reviewed_by: reviewerUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("status", "pending");
  if (error) throw new Error(`rejectApplication: ${error.message}`);
}
