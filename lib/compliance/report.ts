// Compliance report assembly (T12) + the living status view (T20).
//
// A report aggregates a student's checkpoint / unit-assessment / term-exam
// results into a single Quebec-evaluation-oriented artifact. It's continuously
// viewable (the "living" view) and can be snapshotted into a compliance_reports
// row for the record / export.

import { getServiceClient } from "@/lib/db";
import { getChildReport, type ChildReport } from "@/lib/db/parent-queries";
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
}

/** Build the living report from current data - no persistence. */
export async function assembleComplianceReport(
  studentUserId: string,
  studentName: string,
  masjidId: string,
  termLabel: string = DEMO_TERM_LABEL,
): Promise<ComplianceReport> {
  const child = await getChildReport({ id: studentUserId, name: studentName }, masjidId);
  const courses = child.courses.map((c) => ({
    status: computeCourseStatus(c, termLabel),
    evidence: c,
  }));
  return {
    student: { id: studentUserId, name: studentName },
    podName: child.podName,
    termLabel,
    assembledAt: new Date().toISOString(),
    overall: computeOverall(courses.map((c) => c.status)),
    courses,
  };
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

export async function getLatestStoredReport(
  studentUserId: string,
  termLabel: string = DEMO_TERM_LABEL,
): Promise<StoredComplianceReport | null> {
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

export async function markReportExported(reportId: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("compliance_reports")
    .update({ exported: true })
    .eq("id", reportId);
  if (error) throw new Error(`markReportExported: ${error.message}`);
}
