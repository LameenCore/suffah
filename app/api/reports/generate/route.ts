// POST /api/reports/generate  { studentId: string }
//
// Assembles a compliance report from live result data and persists a snapshot
// row (compliance_reports). Admin only, masjid-scoped.

import { getCurrentUser } from "@/lib/auth";
import { listStudents } from "@/lib/db/admin-queries";
import { generateComplianceReport } from "@/lib/compliance/report";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "admin") {
    return Response.json({ error: "admin role required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { studentId } = (body ?? {}) as { studentId?: unknown };
  if (typeof studentId !== "string" || studentId.length === 0) {
    return Response.json({ error: "studentId is required" }, { status: 400 });
  }

  const students = await listStudents(user.masjidId);
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return Response.json({ error: "student not found in this masjid" }, { status: 404 });
  }

  try {
    const { report, reportId } = await generateComplianceReport(
      student.id,
      student.name,
      user.masjidId,
    );
    return Response.json({
      reportId,
      studentId: student.id,
      termLabel: report.termLabel,
      overall: report.overall,
      courses: report.courses.map((c) => ({
        course: c.status.courseName,
        level: c.status.level,
        signals: c.status.signals,
      })),
    });
  } catch (err) {
    console.error("[/api/reports/generate]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "report generation failed" },
      { status: 500 },
    );
  }
}
