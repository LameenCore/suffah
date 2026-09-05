// Masjid-scoped reads + writes for volunteer onboarding and the churn log (T15).
// Vetting is mocked — `status` is a plain enum, no background-check integration
// (see ARCHITECTURE.md / PRD non-goals).
//
// The churn story: when a volunteer departs we stamp `left_at`, flip status to
// inactive, AND detach them from any pod (pods.volunteer_id -> null). The pod's
// pod_progress is untouched, so a replacement picks up exactly where things were.

import { getServiceClient } from "@/lib/db";
import type { VolunteerStatus } from "@/lib/types";

export interface VolunteerRow {
  id: string;
  name: string;
  status: VolunteerStatus;
  certificationNote: string | null;
  joinedAt: string;
  leftAt: string | null;
  /** Names of pods this volunteer is currently assigned to. */
  pods: string[];
}

export interface VolunteerRoster {
  /** Still here (left_at is null) — any status. */
  active: VolunteerRow[];
  /** Departed (left_at set) — the churn log. */
  churned: VolunteerRow[];
}

const SELECT = "id, name, status, certification_note, joined_at, left_at, masjid_id";

function shape(row: Record<string, unknown>, podsByVol: Map<string, string[]>): VolunteerRow {
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as VolunteerStatus,
    certificationNote: (row.certification_note as string | null) ?? null,
    joinedAt: row.joined_at as string,
    leftAt: (row.left_at as string | null) ?? null,
    pods: podsByVol.get(row.id as string) ?? [],
  };
}

export async function listVolunteers(masjidId: string): Promise<VolunteerRoster> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteers")
    .select(SELECT)
    .eq("masjid_id", masjidId)
    .order("joined_at", { ascending: false });
  if (error) throw new Error(`listVolunteers: ${error.message}`);

  const { data: pods, error: pErr } = await db
    .from("pods")
    .select("name, volunteer_id")
    .eq("masjid_id", masjidId)
    .not("volunteer_id", "is", null);
  if (pErr) throw new Error(`listVolunteers: ${pErr.message}`);

  const podsByVol = new Map<string, string[]>();
  for (const p of pods ?? []) {
    const vid = p.volunteer_id as string;
    podsByVol.set(vid, [...(podsByVol.get(vid) ?? []), p.name as string]);
  }

  const rows = (data ?? []).map((r) => shape(r as Record<string, unknown>, podsByVol));
  return {
    active: rows.filter((r) => r.leftAt == null),
    churned: rows.filter((r) => r.leftAt != null),
  };
}

async function assertVolunteerInMasjid(id: string, masjidId: string): Promise<VolunteerRow> {
  const { data, error } = await getServiceClient()
    .from("volunteers")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`assertVolunteerInMasjid: ${error.message}`);
  if (!data || (data as Record<string, unknown>).masjid_id !== masjidId) {
    throw new Error("volunteer not found in this masjid");
  }
  return shape(data as Record<string, unknown>, new Map());
}

export async function addVolunteer(
  masjidId: string,
  input: { name: string; certificationNote: string | null },
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("name is required");

  const { error } = await getServiceClient().from("volunteers").insert({
    masjid_id: masjidId,
    user_id: null,
    name,
    status: "pending_vetting",
    certification_note: input.certificationNote?.trim() || null,
  });
  if (error) throw new Error(`addVolunteer: ${error.message}`);
}

export async function setVolunteerStatus(
  masjidId: string,
  id: string,
  status: VolunteerStatus,
): Promise<void> {
  const v = await assertVolunteerInMasjid(id, masjidId);
  if (v.leftAt != null) throw new Error("this volunteer has already departed");

  const { error } = await getServiceClient()
    .from("volunteers")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`setVolunteerStatus: ${error.message}`);
}

/** Departure = churn event. Stamp left_at, go inactive, detach from every pod. */
export async function recordDeparture(masjidId: string, id: string): Promise<void> {
  const db = getServiceClient();
  const v = await assertVolunteerInMasjid(id, masjidId);
  if (v.leftAt != null) return; // already recorded

  const { error } = await db
    .from("volunteers")
    .update({ left_at: new Date().toISOString(), status: "inactive" })
    .eq("id", id);
  if (error) throw new Error(`recordDeparture: ${error.message}`);

  // Continuity: pod loses its volunteer but keeps pod_progress.
  const { error: podErr } = await db
    .from("pods")
    .update({ volunteer_id: null })
    .eq("masjid_id", masjidId)
    .eq("volunteer_id", id);
  if (podErr) throw new Error(`recordDeparture: ${podErr.message}`);
}

/** Undo a departure (demo do-over): clear left_at, back to active. */
export async function reinstateVolunteer(masjidId: string, id: string): Promise<void> {
  await assertVolunteerInMasjid(id, masjidId);
  const { error } = await getServiceClient()
    .from("volunteers")
    .update({ left_at: null, status: "active" })
    .eq("id", id);
  if (error) throw new Error(`reinstateVolunteer: ${error.message}`);
}
