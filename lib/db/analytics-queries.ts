// Learning analytics for the admin dashboard (T64). Aggregate, read-only, no new
// PII — every number here is a count or a rate over the masjid's own rows. Built
// on getChildReports (fixed query count) + the compliance status engine, so the
// "at-risk" definition is exactly the one families already see.

import { listStudents } from "@/lib/db/admin-queries";
import { getServiceClient } from "@/lib/db";
import { getChildReports, type ChildReport } from "@/lib/db/parent-queries";
import { assembleFromChildReport } from "@/lib/compliance/report";
import { getMonthSpend } from "@/lib/ai/budget";
import type { ComplianceLevel } from "@/lib/compliance/status";
import { DEMO_TERM_LABEL } from "@/lib/types";

export interface CourseCompletion {
  courseId: string;
  courseName: string;
  totalNodes: number;
  enrolled: number;
  /** students whose furthest checkpoint-passed position is the final node */
  completed: number;
  completionRate: number; // 0..1
  unitAssessmentPassRate: number; // 0..1 of students who attempted
  /** histogram: index = pathway position (0 = not started), value = student count */
  dropOff: number[];
}

export interface PodCohort {
  podId: string;
  podName: string;
  students: number;
  avgProgress: number; // 0..1 across courses
  checkpointPassRate: number; // 0..1
  atRisk: number; // watch + gap
}

export interface LearningAnalytics {
  termLabel: string;
  generatedAt: string;

  students: number;
  studentsActive: number; // >=1 checkpoint attempt
  activeRate: number; // 0..1

  atRisk: Record<ComplianceLevel, number>;

  courses: CourseCompletion[];
  cohorts: PodCohort[];

  volunteers: {
    active: number;
    departed: number;
    churnRate: number; // departed / (active + departed)
    departures90d: number;
  };

  waqf: {
    principal: number;
    annualDrawCeiling: number; // principal * 4%
    sadaqahReceived: number;
    returnsDisbursed: number; // magnitude
    scholarshipsAllocated: number; // magnitude
    /** rough: (annual draw + sadaqah) / committed annual outflow */
    runwayYears: number | null;
  };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Furthest pathway position a student has *passed a checkpoint* for, per course. */
function passedPosition(report: ChildReport, courseId: string): number {
  const course = report.courses.find((c) => c.courseId === courseId);
  if (!course) return 0;
  // nodePosition is the pod's position; a student's own progress is better read
  // from how many distinct checkpoints they've passed in sequence. We only have
  // titles here, so approximate with the count of passed checkpoints (bounded by
  // total nodes) — matches how the compliance "coverage" metric reads it.
  const passed = new Set(
    course.checkpoints.filter((c) => c.passed).map((c) => c.nodeTitle),
  ).size;
  return Math.min(passed, course.totalNodes || passed);
}

export async function getLearningAnalytics(
  masjidId: string,
  termLabel: string = DEMO_TERM_LABEL,
): Promise<LearningAnalytics> {
  const db = getServiceClient();
  const roster = await listStudents(masjidId);
  const children = roster.map((s) => ({ id: s.id, name: s.name }));
  const reports = children.length ? await getChildReports(children, masjidId) : [];

  // --- at-risk (same engine families see) ---
  const atRisk: Record<ComplianceLevel, number> = { on_track: 0, watch: 0, gap: 0 };
  for (const r of reports) {
    const level = assembleFromChildReport(r, termLabel).overall.level;
    atRisk[level] += 1;
  }

  // --- active students ---
  let studentsActive = 0;
  for (const r of reports) {
    const anyAttempt = r.courses.some((c) => c.checkpoints.length > 0);
    if (anyAttempt) studentsActive += 1;
  }

  // --- per-course completion + drop-off ---
  const courseIds = new Map<string, { name: string; totalNodes: number }>();
  for (const r of reports) {
    for (const c of r.courses) {
      if (!courseIds.has(c.courseId)) {
        courseIds.set(c.courseId, { name: c.courseName, totalNodes: c.totalNodes });
      }
    }
  }
  const courses: CourseCompletion[] = [...courseIds.entries()].map(([courseId, meta]) => {
    const total = meta.totalNodes || 0;
    const dropOff = new Array(total + 1).fill(0);
    let completed = 0;
    let unitAttempted = 0;
    let unitPassed = 0;
    for (const r of reports) {
      const pos = passedPosition(r, courseId);
      dropOff[Math.min(pos, total)] += 1;
      if (total > 0 && pos >= total) completed += 1;
      const c = r.courses.find((x) => x.courseId === courseId);
      if (c && c.unitAssessments.length > 0) {
        unitAttempted += 1;
        if (c.unitAssessments.some((u) => u.passed)) unitPassed += 1;
      }
    }
    return {
      courseId,
      courseName: meta.name,
      totalNodes: total,
      enrolled: reports.length,
      completed,
      completionRate: reports.length ? clamp01(completed / reports.length) : 0,
      unitAssessmentPassRate: unitAttempted ? clamp01(unitPassed / unitAttempted) : 0,
      dropOff,
    };
  });

  // --- pod cohorts ---
  const byPod = new Map<string, { name: string; ids: string[] }>();
  for (const s of roster) {
    if (!s.podId) continue;
    const cur = byPod.get(s.podId) ?? { name: s.podName ?? "Pod", ids: [] };
    cur.ids.push(s.id);
    byPod.set(s.podId, cur);
  }
  const reportById = new Map(reports.map((r) => [r.child.id, r]));
  const cohorts: PodCohort[] = [...byPod.entries()].map(([podId, pod]) => {
    let progressSum = 0;
    let progressCount = 0;
    let cpAttempts = 0;
    let cpPassed = 0;
    let podAtRisk = 0;
    for (const id of pod.ids) {
      const r = reportById.get(id);
      if (!r) continue;
      for (const c of r.courses) {
        if (c.totalNodes > 0) {
          progressSum += passedPosition(r, c.courseId) / c.totalNodes;
          progressCount += 1;
        }
        for (const cp of c.checkpoints) {
          cpAttempts += 1;
          if (cp.passed) cpPassed += 1;
        }
      }
      const level = assembleFromChildReport(r, termLabel).overall.level;
      if (level !== "on_track") podAtRisk += 1;
    }
    return {
      podId,
      podName: pod.name,
      students: pod.ids.length,
      avgProgress: progressCount ? clamp01(progressSum / progressCount) : 0,
      checkpointPassRate: cpAttempts ? clamp01(cpPassed / cpAttempts) : 0,
      atRisk: podAtRisk,
    };
  });

  // --- volunteers ---
  const ninetyDaysAgo = new Date(Date.now() - 90 * 864e5).toISOString();
  const [volActive, volDeparted, volRecent] = await Promise.all([
    db.from("volunteers").select("id", { count: "exact", head: true })
      .eq("masjid_id", masjidId).is("left_at", null),
    db.from("volunteers").select("id", { count: "exact", head: true })
      .eq("masjid_id", masjidId).not("left_at", "is", null),
    db.from("volunteers").select("id", { count: "exact", head: true })
      .eq("masjid_id", masjidId).gte("left_at", ninetyDaysAgo),
  ]);
  const active = volActive.count ?? 0;
  const departed = volDeparted.count ?? 0;

  // --- waqf runway ---
  const { data: ledger } = await db
    .from("waqf_ledger")
    .select("amount, entry_type")
    .eq("masjid_id", masjidId);
  const led = (ledger ?? []) as { amount: number; entry_type: string }[];
  const sum = (t: string) =>
    led.filter((r) => r.entry_type === t).reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const principal = sum("principal_deposit");
  const sadaqahReceived = sum("sadaqah_received");
  const returnsDisbursed = Math.abs(sum("return_disbursed"));
  const scholarshipsAllocated = Math.abs(sum("scholarship_allocated"));
  const annualDrawCeiling = principal * 0.04;
  const committedAnnualOutflow = returnsDisbursed + scholarshipsAllocated;
  const runwayYears =
    committedAnnualOutflow > 0
      ? (annualDrawCeiling + sadaqahReceived) / committedAnnualOutflow
      : null;

  return {
    termLabel,
    generatedAt: new Date().toISOString(),
    students: reports.length,
    studentsActive,
    activeRate: reports.length ? clamp01(studentsActive / reports.length) : 0,
    atRisk,
    courses,
    cohorts,
    volunteers: {
      active,
      departed,
      churnRate: active + departed > 0 ? clamp01(departed / (active + departed)) : 0,
      departures90d: volRecent.count ?? 0,
    },
    waqf: {
      principal,
      annualDrawCeiling,
      sadaqahReceived,
      returnsDisbursed,
      scholarshipsAllocated,
      runwayYears,
    },
  };
}

/**
 * The core "mission health" metric set (T65). One object, one screen. Each field
 * has a written definition in docs/metrics.md. Derived entirely from operational
 * DB state — there is no event pipeline and no third-party tracker on a minors'
 * product; that is the deliberate privacy-respecting instrumentation choice.
 */
export interface MissionHealth {
  termLabel: string;
  generatedAt: string;
  /** mean of per-course completion rate (students at final node / enrolled) */
  completionRate: number;
  /** median days from account creation to first checkpoint *passed*; null if none */
  timeToValueDays: number | null;
  /** share of students with any checkpoint attempt in the last 30 days */
  familyRetention30d: number;
  /** watch + gap, from the compliance engine */
  atRiskCount: number;
  atRiskShare: number;
  volunteerChurnRate: number;
  /** this calendar month's AI spend / active students; null if no active students */
  aiCostPerActiveStudentUsd: number | null;
  waqfRunwayYears: number | null;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export async function getMissionHealth(
  masjidId: string,
  termLabel: string = DEMO_TERM_LABEL,
): Promise<MissionHealth> {
  const db = getServiceClient();
  const analytics = await getLearningAnalytics(masjidId, termLabel);

  const roster = await listStudents(masjidId);
  const ids = roster.map((s) => s.id);

  const [createdRes, firstPassRes, spend] = await Promise.all([
    ids.length
      ? db.from("users").select("id, created_at").in("id", ids)
      : Promise.resolve({ data: [] as { id: string; created_at: string }[] }),
    ids.length
      ? db
          .from("checkpoint_results")
          .select("student_user_id, attempted_at, passed")
          .in("student_user_id", ids)
          .eq("passed", true)
          .order("attempted_at", { ascending: true })
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    getMonthSpend(masjidId).catch(() => null),
  ]);

  const createdAt = new Map(
    ((createdRes.data ?? []) as { id: string; created_at: string }[]).map((r) => [
      r.id,
      new Date(r.created_at).getTime(),
    ]),
  );
  const firstPassAt = new Map<string, number>();
  for (const r of (firstPassRes.data ?? []) as Record<string, unknown>[]) {
    const sid = r.student_user_id as string;
    if (!firstPassAt.has(sid)) {
      firstPassAt.set(sid, new Date(r.attempted_at as string).getTime());
    }
  }
  const ttvDays: number[] = [];
  for (const [sid, first] of firstPassAt) {
    const born = createdAt.get(sid);
    if (born != null && first >= born) ttvDays.push((first - born) / 864e5);
  }

  const thirtyDaysAgo = Date.now() - 30 * 864e5;
  let activeRecent = 0;
  {
    const { data } = ids.length
      ? await db
          .from("checkpoint_results")
          .select("student_user_id, attempted_at")
          .in("student_user_id", ids)
          .gte("attempted_at", new Date(thirtyDaysAgo).toISOString())
      : { data: [] as Record<string, unknown>[] };
    activeRecent = new Set(
      ((data ?? []) as Record<string, unknown>[]).map((r) => r.student_user_id as string),
    ).size;
  }

  const completionRate =
    analytics.courses.length > 0
      ? analytics.courses.reduce((s, c) => s + c.completionRate, 0) / analytics.courses.length
      : 0;
  const atRiskCount = analytics.atRisk.watch + analytics.atRisk.gap;
  const monthUsd = spend ? spend.spentUsd : null;

  return {
    termLabel,
    generatedAt: new Date().toISOString(),
    completionRate: clamp01(completionRate),
    timeToValueDays: median(ttvDays),
    familyRetention30d: roster.length ? clamp01(activeRecent / roster.length) : 0,
    atRiskCount,
    atRiskShare: analytics.students ? clamp01(atRiskCount / analytics.students) : 0,
    volunteerChurnRate: analytics.volunteers.churnRate,
    aiCostPerActiveStudentUsd:
      monthUsd != null && analytics.studentsActive > 0
        ? monthUsd / analytics.studentsActive
        : null,
    waqfRunwayYears: analytics.waqf.runwayYears,
  };
}

/** Flatten the analytics into CSV rows for the export route. */
export function analyticsToCsv(
  a: LearningAnalytics,
  health?: MissionHealth | null,
): string {
  const rows: (string | number)[][] = [];
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  rows.push(["section", "key", "value"]);
  rows.push(["overview", "term", a.termLabel]);
  rows.push(["overview", "students", a.students]);
  rows.push(["overview", "students_active", a.studentsActive]);
  rows.push(["overview", "active_rate", a.activeRate.toFixed(3)]);
  rows.push(["overview", "on_track", a.atRisk.on_track]);
  rows.push(["overview", "watch", a.atRisk.watch]);
  rows.push(["overview", "gap", a.atRisk.gap]);
  rows.push(["volunteers", "active", a.volunteers.active]);
  rows.push(["volunteers", "departed", a.volunteers.departed]);
  rows.push(["volunteers", "churn_rate", a.volunteers.churnRate.toFixed(3)]);
  rows.push(["volunteers", "departures_90d", a.volunteers.departures90d]);
  rows.push(["waqf", "principal", a.waqf.principal]);
  rows.push(["waqf", "annual_draw_ceiling", a.waqf.annualDrawCeiling.toFixed(2)]);
  rows.push(["waqf", "sadaqah_received", a.waqf.sadaqahReceived]);
  rows.push(["waqf", "scholarships_allocated", a.waqf.scholarshipsAllocated]);
  rows.push(["waqf", "runway_years", a.waqf.runwayYears?.toFixed(2) ?? ""]);
  for (const c of a.courses) {
    rows.push([`course:${c.courseName}`, "completion_rate", c.completionRate.toFixed(3)]);
    rows.push([`course:${c.courseName}`, "completed", c.completed]);
    rows.push([`course:${c.courseName}`, "enrolled", c.enrolled]);
    rows.push([`course:${c.courseName}`, "unit_pass_rate", c.unitAssessmentPassRate.toFixed(3)]);
    rows.push([`course:${c.courseName}`, "drop_off", c.dropOff.join("|")]);
  }
  for (const p of a.cohorts) {
    rows.push([`pod:${p.podName}`, "students", p.students]);
    rows.push([`pod:${p.podName}`, "avg_progress", p.avgProgress.toFixed(3)]);
    rows.push([`pod:${p.podName}`, "checkpoint_pass_rate", p.checkpointPassRate.toFixed(3)]);
    rows.push([`pod:${p.podName}`, "at_risk", p.atRisk]);
  }
  if (health) {
    rows.push(["mission_health", "completion_rate", health.completionRate.toFixed(3)]);
    rows.push([
      "mission_health",
      "time_to_value_days",
      health.timeToValueDays?.toFixed(1) ?? "",
    ]);
    rows.push([
      "mission_health",
      "family_retention_30d",
      health.familyRetention30d.toFixed(3),
    ]);
    rows.push(["mission_health", "at_risk_count", health.atRiskCount]);
    rows.push([
      "mission_health",
      "volunteer_churn_rate",
      health.volunteerChurnRate.toFixed(3),
    ]);
    rows.push([
      "mission_health",
      "ai_cost_per_active_student_usd",
      health.aiCostPerActiveStudentUsd?.toFixed(4) ?? "",
    ]);
    rows.push([
      "mission_health",
      "waqf_runway_years",
      health.waqfRunwayYears?.toFixed(2) ?? "",
    ]);
  }
  return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
}
