"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { generateComplianceReport, markReportExported } from "@/lib/compliance/report";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

export async function generateSnapshotAction(
  studentId: string,
  studentName: string,
): Promise<{ reportId: string }> {
  const user = await requireAdmin();
  const { reportId } = await generateComplianceReport(studentId, studentName, user.masjidId);
  revalidatePath("/admin/compliance");
  return { reportId };
}

export async function markExportedAction(reportId: string): Promise<void> {
  const user = await requireAdmin();
  await markReportExported(reportId, user.masjidId);
  revalidatePath("/admin/compliance");
}
