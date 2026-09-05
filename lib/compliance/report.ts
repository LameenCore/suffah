// Compliance report assembly (T12) + the living status view (T20).
//
// A report aggregates a student's checkpoint / unit-assessment / term-exam
// results into a single Quebec-evaluation-oriented artifact. It's continuously
// viewable (the "living" view) and can be snapshotted into a compliance_reports
// row for the record / export.

import { getServiceClient } from "@/lib/db";
import { getChildReport, type ChildReport } from "@/lib/db/parent-queries";
import { getRetentionSignal } from "@/lib/review";
import {
  computeCourseStatus,
  computeOverall,
  type CourseComplianceStatus,
  type OverallCompliance,
} from "@/lib/compliance/status";
import { DEMO_TERM_LABEL } from "@/lib/types";

export interface ComplianceReport {
  student: { id: string; name: string };
  podName: string | null;
  termLabel: string;
  assembledAt: string;
  overall: OverallCompliance;
  courses: Array<{
    status: CourseComplianceStatus;
    evidence: ChildReport["courses"][number];
  }>;
  /** Spaced-repetition retention (T44), when assembled with a DB (not the pure path). */
  retention?: {
    totalItems: number;
    dueNow: number;
    reviewedLast7: number;
    accuracyLast7: number | null;
  };
}

/**
 * Assemble the living report from an already-loaded ChildReport - pure, no DB.
 * Use this when the caller already holds the child report (e.g. the parent home
 * page) to avoid re-fetching it.
 */
export function assembleFromChildReport(
  child: ChildReport,
  termLabel: string = DEMO_TERM_LABEL,
): ComplianceReport {
  const courses = child.courses.map((c) => ({
    status: computeCourseStatus(c, termLabel),
    evidence: c,
  }));
  return {
    student: { id: child.child.id, name: child.child.name },
    podName: child.podName,
    termLabel,
    assembledAt: new Date().toISOString(),
    overall: computeOverall(courses.map((c) => c.status)),
    courses,
  };
}

/** Build the living report from current data - no persistence. */
export async function assembleComplianceReport(
  studentUserId: string,
  studentName: string,
  masjidId: string,
  termLabel: string = DEMO_TERM_LABEL,
): Promise<ComplianceReport> {
  const child = await getChildReport({ id: studentUserId, name: studentName }, masjidId);
  const report = assembleFromChildReport(child, termLabel);
  try {
    const r = await getRetentionSignal(studentUserId, masjidId);
    report.retention = {
      totalItems: r.totalItems,
      dueNow: r.dueNow,
      reviewedLast7: r.reviewedLast7,
      accuracyLast7: r.accuracyLast7,
    };
  } catch {
    // retention is supplementary - a lookup failure must not break the report
  }
  return report;
}

/** Assemble + persist a snapshot into compliance_reports. Returns the report + row id. */
export async function generateComplianceReport(
  studentUserId: string,
  studentName: string,
  masjidId: string,
  termLabel: string = DEMO_TERM_LABEL,
): Promise<{ report: ComplianceReport; reportId: string }> {
  const report = await assembleComplianceReport(studentUserId, studentName, masjidId, termLabel);

  const { data, error } = await getServiceClient()
    .from("compliance_reports")
    .insert({
      student_user_id: studentUserId,
      term_label: termLabel,
      report_data: report as unknown as Record<string, unknown>,
      exported: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(`generateComplianceReport: ${error.message}`);

  return { report, reportId: data.id as string };
}

export interface StoredComplianceReport {
  id: string;
  termLabel: string;
  generatedAt: string;
  exported: boolean;
  report: ComplianceReport;
}

/** True if this student record belongs to `masjidId`. Tenancy guard. */
async function studentInMasjid(studentUserId: string, masjidId: string): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from("users")
    .select("id, masjid_id")
    .eq("id", studentUserId)
    .maybeSingle();
  if (error) throw new Error(`studentInMasjid: ${error.message}`);
  return !!data && data.masjid_id === masjidId;
}

export async function getLatestStoredReport(
  studentUserId: string,
  masjidId: string,
  termLabel: string = DEMO_TERM_LABEL,
): Promise<StoredComplianceReport | null> {
  if (!(await studentInMasjid(studentUserId, masjidId))) return null;

  const { data, error } = await getServiceClient()
    .from("compliance_reports")
    .select("id, term_label, generated_at, exported, report_data")
    .eq("student_user_id", studentUserId)
    .eq("term_label", termLabel)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLatestStoredReport: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id as string,
    termLabel: data.term_label as string,
    generatedAt: data.generated_at as string,
    exported: Boolean(data.exported),
    report: data.report_data as unknown as ComplianceReport,
  };
}

export async function markReportExported(
  reportId: string,
  masjidId: string,
): Promise<void> {
  const db = getServiceClient();

  // Tenancy: the report's student must belong to the caller's masjid.
  const { data: row, error: findErr } = await db
    .from("compliance_reports")
    .select("id, student_user_id")
    .eq("id", reportId)
    .maybeSingle();
  if (findErr) throw new Error(`markReportExported: ${findErr.message}`);
  if (!row || !(await studentInMasjid(row.student_user_id as string, masjidId))) {
    throw new Error("report not found in this masjid");
  }

  const { error } = await db
    .from("compliance_reports")
    .update({ exported: true })
    .eq("id", reportId);
  if (error) throw new Error(`markReportExported: ${error.message}`);
}
