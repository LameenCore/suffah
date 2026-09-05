// Waqf-to-outcome linking (T21). Reads the illustrative sponsorship mapping and
// joins it to *real* learning outcomes (pod pathway position + unit assessment
// results). Everything is reported at the pod level - no student names - so this
// can face a donor.

import { getServiceClient } from "@/lib/db";
import type { CourseName } from "@/lib/types";

export interface SponsoredOutcome {
  id: string;
  sponsorLabel: string;
  amount: number;
  note: string | null;
  podName: string;
  unitTitle: string;
  courseName: CourseName;
  /** 0–1: fraction of the unit's pathway nodes the pod has moved past. */
  unitCompletion: number;
  /** Pod size (for "x of y students"). */
  studentsInPod: number;
  assessmentsTaken: number;
  assessmentsPassed: number;
}

function rel<T>(v: T | T[] | null | undefined): T | null {
  return v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function getSponsoredOutcomes(masjidId: string): Promise<SponsoredOutcome[]> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("sponsorships")
    .select(
      "id, sponsor_label, amount, note, pod_id, unit_id, " +
        "pod:pods!inner ( name, masjid_id ), " +
        "unit:units!inner ( title, course_id, course:courses!inner ( name ) )",
    )
    .eq("masjid_id", masjidId)
    .order("amount", { ascending: false });
  if (error) throw new Error(`getSponsoredOutcomes: ${error.message}`);

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const out: SponsoredOutcome[] = [];
  for (const r of rows) {
    const pod = rel(r.pod as unknown) as { name: string; masjid_id: string } | null;
    const unit = rel(r.unit as unknown) as
      | { title: string; course_id: string; course: unknown }
      | null;
    if (!pod || pod.masjid_id !== masjidId || !unit) continue;
    const course = rel(unit.course) as { name: CourseName } | null;

    const podId = r.pod_id as string;
    const unitId = r.unit_id as string;

    // Unit's pathway nodes.
    const { data: unitNodes, error: nErr } = await db
      .from("pathway_nodes")
      .select("sequence_order")
      .eq("unit_id", unitId)
      .order("sequence_order", { ascending: true });
    if (nErr) throw new Error(`getSponsoredOutcomes: ${nErr.message}`);
    const seqs = (unitNodes ?? []).map((n) => n.sequence_order as number);
    const total = seqs.length;

    // Pod's current node in this unit's course.
    const { data: pp, error: ppErr } = await db
      .from("pod_progress")
      .select("node:pathway_nodes ( sequence_order )")
      .eq("pod_id", podId)
      .eq("course_id", unit.course_id)
      .maybeSingle();
    if (ppErr) throw new Error(`getSponsoredOutcomes: ${ppErr.message}`);
    const podSeq =
      (rel(pp?.node as unknown) as { sequence_order: number } | null)?.sequence_order ?? 0;
    const completed = total === 0 ? 0 : seqs.filter((s) => s < podSeq).length;

    // Pod roster (count only) + unit assessment results for those students.
    const { data: members, error: mErr } = await db
      .from("pod_students")
      .select("student_user_id")
      .eq("pod_id", podId);
    if (mErr) throw new Error(`getSponsoredOutcomes: ${mErr.message}`);
    const studentIds = (members ?? []).map((m) => m.student_user_id as string);

    let taken = 0;
    let passed = 0;
    if (studentIds.length > 0) {
      const { data: ua, error: uaErr } = await db
        .from("unit_assessment_results")
        .select("passed")
        .eq("unit_id", unitId)
        .in("student_user_id", studentIds);
      if (uaErr) throw new Error(`getSponsoredOutcomes: ${uaErr.message}`);
      taken = (ua ?? []).length;
      passed = (ua ?? []).filter((x) => x.passed === true).length;
    }

    out.push({
      id: r.id as string,
      sponsorLabel: r.sponsor_label as string,
      amount: Number(r.amount),
      note: (r.note as string | null) ?? null,
      podName: pod.name,
      unitTitle: unit.title,
      courseName: course?.name ?? ("Math" as CourseName),
      unitCompletion: total === 0 ? 0 : completed / total,
      studentsInPod: studentIds.length,
      assessmentsTaken: taken,
      assessmentsPassed: passed,
    });
  }
  return out;
}
