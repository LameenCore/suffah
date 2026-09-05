// Shared domain types for Suffa.
// Mirrors docs/DATA_MODEL.md — keep in sync when the schema changes.

export type Role = "admin" | "parent" | "student";

export const ROLES: Role[] = ["admin", "parent", "student"];

export type CourseName = "Math" | "Seerah" | "AI Literacy";

export const COURSE_NAMES: CourseName[] = ["Math", "Seerah", "AI Literacy"];

export type VolunteerStatus = "active" | "inactive" | "pending_vetting";

export type FeeStatus = "fee_paid" | "scholarship_covered";

export type LedgerEntryType =
  | "principal_deposit"
  | "return_disbursed"
  | "sadaqah_received"
  | "scholarship_allocated";

/** Quebec home-instruction exemption threshold: fewer than 5 students per instructor. */
export const POD_MAX_STUDENTS = 4;

/** Default pass threshold for unit assessments / term exams (see PRD open question). */
export const PASS_THRESHOLD = 0.7;

export interface SessionUser {
  id: string;
  masjidId: string;
  role: Role;
  name: string;
  email: string;
}
