// Masjid-scoped reads for the admin waqf/donation transparency view (T14).
// Mock data only - no payment processing (see DATA_MODEL.md / PRD non-goals).
//
// HARD RULE from DATA_MODEL.md: principal_deposit entries are the locked
// endowment. They are never summed into "spent" or "spendable" totals - the
// whole point of the model is that the principal is untouched. Every aggregate
// here keeps principal on its own line.

import { getServiceClient } from "@/lib/db";
import type { FeeStatus, LedgerEntryType } from "@/lib/types";

export interface LedgerEntry {
  entryType: LedgerEntryType;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface SpendPoint {
  /** ISO date of the entry. */
  t: string;
  /** Cumulative money OUT (operating draws + scholarships) up to and incl. this point. */
  cumulativeOut: number;
}

export interface LedgerSummary {
  /** Locked endowment - sum of principal_deposit. Never spent. */
  principal: number;
  /** Sum of |return_disbursed| - operating costs funded from returns. */
  returnsDisbursed: number;
  /** Sum of sadaqah_received - tops up the scholarship pool. */
  sadaqahReceived: number;
  /** Sum of |scholarship_allocated|. */
  scholarshipsAllocated: number;
  /** Total money out (returnsDisbursed + scholarshipsAllocated), principal excluded. */
  totalOut: number;
  /** Cumulative-out series over time, for the chart. */
  spendSeries: SpendPoint[];
  entries: LedgerEntry[];
}

const OUT_TYPES: LedgerEntryType[] = ["return_disbursed", "scholarship_allocated"];

export async function getLedgerSummary(masjidId: string): Promise<LedgerSummary> {
  const { data, error } = await getServiceClient()
    .from("waqf_ledger")
    .select("entry_type, amount, note, created_at")
    .eq("masjid_id", masjidId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getLedgerSummary: ${error.message}`);

  const entries: LedgerEntry[] = (data ?? []).map((r) => ({
    entryType: r.entry_type as LedgerEntryType,
    amount: Number(r.amount),
    note: (r.note as string | null) ?? null,
    createdAt: r.created_at as string,
  }));

  let principal = 0;
  let returnsDisbursed = 0;
  let sadaqahReceived = 0;
  let scholarshipsAllocated = 0;
  let runningOut = 0;
  const spendSeries: SpendPoint[] = [];

  for (const e of entries) {
    switch (e.entryType) {
      case "principal_deposit":
        principal += e.amount;
        break;
      case "return_disbursed":
        returnsDisbursed += Math.abs(e.amount);
        break;
      case "sadaqah_received":
        sadaqahReceived += e.amount;
        break;
      case "scholarship_allocated":
        scholarshipsAllocated += Math.abs(e.amount);
        break;
    }
    if (OUT_TYPES.includes(e.entryType)) {
      runningOut += Math.abs(e.amount);
      spendSeries.push({ t: e.createdAt, cumulativeOut: runningOut });
    }
  }

  return {
    principal,
    returnsDisbursed,
    sadaqahReceived,
    scholarshipsAllocated,
    totalOut: returnsDisbursed + scholarshipsAllocated,
    spendSeries,
    entries,
  };
}

export interface FamilyFeeRow {
  studentUserId: string;
  studentName: string;
  status: FeeStatus;
}

export async function getFamilyFeeStatus(masjidId: string): Promise<FamilyFeeRow[]> {
  const { data, error } = await getServiceClient()
    .from("family_fee_status")
    .select("student_user_id, status, student:users!inner ( name, masjid_id )")
    .eq("masjid_id", masjidId);
  if (error) throw new Error(`getFamilyFeeStatus: ${error.message}`);

  return (data ?? [])
    .map((r) => {
      const student = (Array.isArray(r.student) ? r.student[0] : r.student) as
        | { name: string; masjid_id: string }
        | null;
      return {
        studentUserId: r.student_user_id as string,
        studentName: student?.name ?? "-",
        status: r.status as FeeStatus,
        masjidOk: student?.masjid_id === masjidId,
      };
    })
    .filter((r) => r.masjidOk)
    .map(({ studentUserId, studentName, status }) => ({
      studentUserId,
      studentName,
      status,
    }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}
