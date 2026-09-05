/**
 * Data-integrity check. Catches corruption that foreign keys do NOT enforce:
 * cross-tenant references, pods over the hard cap, ledger sign errors, results
 * with no pod context, mis-linked progress nodes.
 *
 *   npm run check:integrity
 *
 * Exit 0 = all clear. Exit 1 = at least one FAIL (wire into CI / a nightly job).
 * Read-only, with one exception: check 11 attempts an UPDATE + DELETE on
 * audit_log to prove the append-only trigger rejects them - both writes fail by
 * design, so nothing is mutated.
 */

import { getServiceClient } from "@/lib/db";
import { POD_MAX_STUDENTS } from "@/lib/types";

type Row = Record<string, unknown>;

/** Supabase types an embedded to-one relation as an array in some versions. */
function deep(v: unknown): unknown {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

let failures = 0;

function report(name: string, bad: Row[], describe: (r: Row) => string) {
  if (bad.length === 0) {
    console.log(`  ok    ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${name} - ${bad.length} row(s)`);
  for (const r of bad.slice(0, 10)) console.log(`          ${describe(r)}`);
  if (bad.length > 10) console.log(`          ... and ${bad.length - 10} more`);
}

async function main() {
  const db = getServiceClient();
  console.log("Data-integrity check\n");

  // --- 1. Pods over the hard student cap -------------------------------------
  {
    const { data: pods, error } = await db.from("pods").select("id, name, max_students");
    if (error) throw new Error(error.message);
    const bad: Row[] = [];
    for (const p of pods ?? []) {
      const { count } = await db
        .from("pod_students")
        .select("id", { count: "exact", head: true })
        .eq("pod_id", p.id as string);
      const cap = Math.min((p.max_students as number) ?? POD_MAX_STUDENTS, POD_MAX_STUDENTS);
      if ((count ?? 0) > cap) bad.push({ ...p, count });
    }
    report("pod student count <= cap", bad, (r) => `${r.name}: ${r.count} > ${r.max_students}`);
  }

  // --- 2. pod_progress node belongs to the pod_progress course --------------
  {
    const { data, error } = await db
      .from("pod_progress")
      .select("pod_id, course_id, current_node_id, node:pathway_nodes ( id, course_id )");
    if (error) throw new Error(error.message);
    const bad = (data ?? []).filter((r) => {
      const node = Array.isArray(r.node) ? r.node[0] : r.node;
      return node && (node as Row).course_id !== r.course_id;
    });
    report("pod_progress.current_node in the right course", bad as Row[], (r) => `pod ${r.pod_id} course ${r.course_id}`);
  }

  // --- 3. pathway_nodes.unit_id in the same course -------------------------
  {
    const { data, error } = await db
      .from("pathway_nodes")
      .select("id, course_id, unit_id, unit:units ( id, course_id )");
    if (error) throw new Error(error.message);
    const bad = (data ?? []).filter((r) => {
      const u = Array.isArray(r.unit) ? r.unit[0] : r.unit;
      return u && (u as Row).course_id !== r.course_id;
    });
    report("pathway_node.unit in the same course", bad as Row[], (r) => `node ${r.id}`);
  }

  // --- 4. Cross-tenant pod membership -------------------------------------
  {
    const { data, error } = await db
      .from("pod_students")
      .select("pod_id, student_user_id, pod:pods!inner ( masjid_id ), student:users!inner ( masjid_id, role )");
    if (error) throw new Error(error.message);
    const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
    const bad = (data ?? []).filter((r) => {
      const pod = one(r.pod) as Row;
      const stu = one(r.student) as Row;
      return pod.masjid_id !== stu.masjid_id || stu.role !== "student";
    });
    report("pod members: same masjid + role=student", bad as Row[], (r) => `pod ${r.pod_id} student ${r.student_user_id}`);
  }

  // --- 5. Results reference an in-tenant node/course --------------------
  {
    const { data, error } = await db
      .from("checkpoint_results")
      .select(
        "id, node:pathway_nodes!inner ( course:courses!inner ( masjid_id ) ), " +
          "student:users!inner ( masjid_id )",
      );
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Row[];
    const bad = rows.filter((r) => {
      const node = deep(r.node) as Row | null;
      const course = node ? (deep(node.course) as Row | null) : null;
      const student = deep(r.student) as Row | null;
      return !course || !student || course.masjid_id !== student.masjid_id;
    });
    report("checkpoint_results: student + node same masjid", bad, (r) => `result ${r.id}`);
  }

  // --- 6. parent_children / family_fee_status point at real students ----
  {
    const { data, error } = await db
      .from("parent_children")
      .select("parent_user_id, student_user_id, p:users!parent_children_parent_user_id_fkey ( role ), s:users!parent_children_student_user_id_fkey ( role )");
    if (error) throw new Error(error.message);
    const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
    const bad = (data ?? []).filter((r) => (one(r.p) as Row)?.role !== "parent" || (one(r.s) as Row)?.role !== "student");
    report("parent_children: roles are parent -> student", bad as Row[], (r) => `${r.parent_user_id} -> ${r.student_user_id}`);
  }

  // --- 7. Departed volunteer still assigned to a pod ------------------
  {
    const { data, error } = await db
      .from("pods")
      .select("id, name, volunteer_id, volunteer:volunteers ( left_at )")
      .not("volunteer_id", "is", null);
    if (error) throw new Error(error.message);
    const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
    const bad = (data ?? []).filter((r) => (one(r.volunteer) as Row)?.left_at != null);
    report("no pod assigned to a departed volunteer", bad as Row[], (r) => `${r.name}`);
  }

  // --- 8. Waqf ledger sign convention -------------------------------
  {
    const { data, error } = await db.from("waqf_ledger").select("id, entry_type, amount, note");
    if (error) throw new Error(error.message);
    const bad = (data ?? []).filter((r) => {
      const a = Number(r.amount);
      const inflow = r.entry_type === "principal_deposit" || r.entry_type === "sadaqah_received";
      const outflow = r.entry_type === "return_disbursed" || r.entry_type === "scholarship_allocated";
      return (inflow && a <= 0) || (outflow && a >= 0);
    });
    report("waqf_ledger sign convention (in > 0, out < 0)", bad as Row[], (r) => `${r.entry_type} ${r.amount} - ${r.note}`);
  }

  // --- 9. Term/unit results for a student in no pod -----------------
  {
    const { data: members } = await db.from("pod_students").select("student_user_id");
    const inPod = new Set((members ?? []).map((m) => m.student_user_id as string));
    const { data: ua } = await db.from("unit_assessment_results").select("id, student_user_id");
    const { data: te } = await db.from("term_exam_results").select("id, student_user_id");
    const bad = [...(ua ?? []), ...(te ?? [])].filter((r) => !inPod.has(r.student_user_id as string));
    report("assessment/exam results only for pod members", bad as Row[], (r) => `result ${r.id} student ${r.student_user_id}`);
  }

  // --- 10. compliance_reports for a real student ----------------
  {
    const { data, error } = await db
      .from("compliance_reports")
      .select("id, student_user_id, s:users ( role )");
    if (error) throw new Error(error.message);
    const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
    const bad = (data ?? []).filter((r) => (one(r.s) as Row)?.role !== "student");
    report("compliance_reports point at a student", bad as Row[], (r) => `report ${r.id}`);
  }

  // --- 11. audit_log is append-only (T35) --------------------------
  // Negative check: an UPDATE and a DELETE must both be rejected by the DB
  // trigger. Nothing is actually mutated - the writes fail by design.
  {
    const { data } = await db.from("audit_log").select("id").limit(1);
    const id = data?.[0]?.id as string | undefined;
    if (!id) {
      console.log("  skip  audit_log append-only (no rows to probe)");
    } else {
      const upd = await db.from("audit_log").update({ action: "__probe__" }).eq("id", id);
      const del = await db.from("audit_log").delete().eq("id", id);
      const bad: Row[] = [];
      if (!upd.error) bad.push({ op: "UPDATE", note: "was allowed" });
      if (!del.error) bad.push({ op: "DELETE", note: "was allowed" });
      report("audit_log is append-only (UPDATE/DELETE rejected)", bad, (r) => `${r.op} ${r.note}`);
    }
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
