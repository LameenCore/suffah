// Waqf-to-outcome linking (T21). Reads the illustrative sponsorship mapping and
// joins it to *real* learning outcomes (pod pathway position + unit assessment
// results). Everything is reported at the pod level - no student names - so this
// can face a donor.

import { getReadClient } from "@/lib/db/server";
import { unwrapRelation as rel } from "@/lib/db/rel";
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

export async function getSponsoredOutcomes(masjidId: string): Promise<SponsoredOutcome[]> {
  const db = (await getReadClient());

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

  // Resolve every sponsorship's pod/unit/course up front, then do ONE batched
  // query per related table instead of four queries per sponsorship row.
  type Resolved = {
    r: Record<string, unknown>;
    pod: { name: string; masjid_id: string };
    unit: { title: string; course_id: string };
    course: { name: CourseName } | null;
    podId: string;
    unitId: string;
  };
  const resolved: Resolved[] = [];
  for (const r of rows) {
    const pod = rel(r.pod as unknown) as { name: string; masjid_id: string } | null;
    const unit = rel(r.unit as unknown) as
      | { title: string; course_id: string; course: unknown }
      | null;
    if (!pod || pod.masjid_id !== masjidId || !unit) continue;
    resolved.push({
      r,
      pod,
      unit,
      course: rel(unit.course) as { name: CourseName } | null,
      podId: r.pod_id as string,
      unitId: r.unit_id as string,
    });
  }

  if (resolved.length === 0) return [];

  const podIds = [...new Set(resolved.map((x) => x.podId))];
  const unitIds = [...new Set(resolved.map((x) => x.unitId))];

  const [unitNodesRes, progressRes, membersRes] = await Promise.all([
    db.from("pathway_nodes").select("unit_id, sequence_order").in("unit_id", unitIds),
    db
      .from("pod_progress")
      .select("pod_id, course_id, node:pathway_nodes ( sequence_order )")
      .in("pod_id", podIds),
    db.from("pod_students").select("pod_id, student_user_id").in("pod_id", podIds),
  ]);
  if (unitNodesRes.error) throw new Error(`getSponsoredOutcomes: ${unitNodesRes.error.message}`);
  if (progressRes.error) throw new Error(`getSponsoredOutcomes: ${progressRes.error.message}`);
  if (membersRes.error) throw new Error(`getSponsoredOutcomes: ${membersRes.error.message}`);

  const seqsByUnit = new Map<string, number[]>();
  for (const n of (unitNodesRes.data ?? []) as { unit_id: string; sequence_order: number }[]) {
    const list = seqsByUnit.get(n.unit_id) ?? [];
    list.push(n.sequence_order);
    seqsByUnit.set(n.unit_id, list);
  }

  const podSeqByPodCourse = new Map<string, number>();
  for (const row of (progressRes.data ?? []) as Record<string, unknown>[]) {
    const seq =
      (rel(row.node as unknown) as { sequence_order: number } | null)?.sequence_order ?? 0;
    podSeqByPodCourse.set(`${row.pod_id as string}:${row.course_id as string}`, seq);
  }

  const studentsByPod = new Map<string, string[]>();
  for (const m of (membersRes.data ?? []) as { pod_id: string; student_user_id: string }[]) {
    const list = studentsByPod.get(m.pod_id) ?? [];
    list.push(m.student_user_id);
    studentsByPod.set(m.pod_id, list);
  }

  const allStudentIds = [...new Set([...studentsByPod.values()].flat())];
  // One row per assessment attempt (a student may have several) - grouped by unit,
  // filtered per-sponsorship to that pod's roster below. Matches the prior
  // row-counting semantics exactly.
  const uaRowsByUnit = new Map<string, { student_user_id: string; passed: boolean }[]>();
  if (allStudentIds.length > 0 && unitIds.length > 0) {
    const { data: ua, error: uaErr } = await db
      .from("unit_assessment_results")
      .select("unit_id, student_user_id, passed")
      .in("unit_id", unitIds)
      .in("student_user_id", allStudentIds);
    if (uaErr) throw new Error(`getSponsoredOutcomes: ${uaErr.message}`);
    for (const x of (ua ?? []) as {
      unit_id: string;
      student_user_id: string;
      passed: boolean;
    }[]) {
      const list = uaRowsByUnit.get(x.unit_id) ?? [];
      list.push({ student_user_id: x.student_user_id, passed: x.passed === true });
      uaRowsByUnit.set(x.unit_id, list);
    }
  }

  const out: SponsoredOutcome[] = [];
  for (const { r, pod, unit, course, podId, unitId } of resolved) {
    const seqs = seqsByUnit.get(unitId) ?? [];
    const total = seqs.length;
    const podSeq = podSeqByPodCourse.get(`${podId}:${unit.course_id}`) ?? 0;
    const completed = total === 0 ? 0 : seqs.filter((s) => s < podSeq).length;

    const studentIds = new Set(studentsByPod.get(podId) ?? []);
    const uaForPod = (uaRowsByUnit.get(unitId) ?? []).filter((x) =>
      studentIds.has(x.student_user_id),
    );
    const taken = uaForPod.length;
    const passed = uaForPod.filter((x) => x.passed).length;

    out.push({
      id: r.id as string,
      sponsorLabel: r.sponsor_label as string,
      amount: Number(r.amount),
      note: (r.note as string | null) ?? null,
      podName: pod.name,
      unitTitle: unit.title,
      courseName: course?.name ?? ("Math" as CourseName),
      unitCompletion: total === 0 ? 0 : completed / total,
      studentsInPod: studentIds.size,
      assessmentsTaken: taken,
      assessmentsPassed: passed,
    });
  }
  return out;
}
