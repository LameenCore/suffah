// Next-step recommendations (T46). Deterministic + explainable - a priority
// ladder, never an engagement-maximising ranking. Grounded in real progress +
// the skill tree (T43).

import { getServiceClient } from "@/lib/db";
import { getStudentTracks, getLatestCheckpointResult, countCheckpointAttempts } from "@/lib/db/queries";
import { getRetentionSignal } from "@/lib/review";
import { getPrereqStatus } from "@/lib/db/skill-tree-queries";

export type NextStepKind =
  | "review"
  | "finish_lesson"
  | "start_lesson"
  | "take_checkpoint"
  | "read_reteach"
  | "retry_checkpoint"
  | "blocked_prereq"
  | "caught_up";

export interface NextStep {
  kind: NextStepKind;
  /** Short imperative label for the student. */
  label: string;
  /** Where the action lives. */
  href: string;
  /** One plain sentence: why this, now. */
  why: string;
  courseName?: string;
}

/**
 * The single next thing this student should do. Priority order:
 *   1. review due  2. blocked prereq  3. read the re-teach  4. retry checkpoint
 *   5. take checkpoint  6. finish/continue the lesson  7. caught up
 */
export async function getStudentNextStep(
  studentUserId: string,
  masjidId: string,
): Promise<NextStep> {
  const [tracks, retention, prereqStatus] = await Promise.all([
    getStudentTracks(studentUserId, masjidId),
    getRetentionSignal(studentUserId, masjidId).catch(() => null),
    getPrereqStatus(studentUserId, masjidId).catch(() => null),
  ]);

  if (retention && retention.dueNow > 0) {
    return {
      kind: "review",
      label: `Do today's review (${retention.dueNow})`,
      href: "/student/review",
      why: `${retention.dueNow} question${retention.dueNow === 1 ? "" : "s"} from lessons you've passed are due for review.`,
    };
  }

  const db = getServiceClient();
  const { data: remRows } = await db
    .from("node_remediations")
    .select("pathway_node_id")
    .eq("student_user_id", studentUserId);
  const hasRemediation = new Set((remRows ?? []).map((r) => r.pathway_node_id as string));

  for (const track of tracks.tracks) {
    const node = track.currentNode;
    if (!node) continue;

    const lock = prereqStatus?.get(node.id);
    if (lock?.locked) {
      const first = lock.unmet[0];
      return {
        kind: "blocked_prereq",
        label: `Finish "${first.title}" first`,
        href: `/student/${
          tracks.tracks.find((t) => t.nodes.some((n) => n.id === first.id))?.course.id ??
          track.course.id
        }`,
        why: `"${node.title}" in ${track.course.name} builds on "${first.title}" (${first.courseName}), which isn't passed yet.`,
        courseName: track.course.name,
      };
    }

    if (track.checkpointPassed) continue; // this course's current step is done

    if (!track.lessonComplete) {
      return {
        kind: node.lesson_content ? "finish_lesson" : "start_lesson",
        label: node.lesson_content
          ? `Finish the ${track.course.name} lesson`
          : `Start the ${track.course.name} lesson`,
        href: `/student/${track.course.id}`,
        why: `You're on "${node.title}" and haven't marked the lesson complete.`,
        courseName: track.course.name,
      };
    }

    // lesson done, checkpoint not passed
    const last = await getLatestCheckpointResult(studentUserId, node.id);
    const attempts = await countCheckpointAttempts(studentUserId, node.id);
    if (last && last.passed === false && attempts >= 2 && hasRemediation.has(node.id)) {
      return {
        kind: "read_reteach",
        label: `Read the re-teach for ${track.course.name}, then retry`,
        href: `/student/${track.course.id}`,
        why: `You've missed the "${node.title}" checkpoint ${attempts} times - there's a short re-teach on exactly what tripped you up.`,
        courseName: track.course.name,
      };
    }
    if (last && last.passed === false) {
      return {
        kind: "retry_checkpoint",
        label: `Retry the ${track.course.name} checkpoint`,
        href: `/student/${track.course.id}`,
        why: `Your last attempt on "${node.title}" didn't reach 70%. Have another look at the lesson and try again.`,
        courseName: track.course.name,
      };
    }
    return {
      kind: "take_checkpoint",
      label: `Take the ${track.course.name} checkpoint`,
      href: `/student/${track.course.id}`,
      why: `You've finished the "${node.title}" lesson - the checkpoint opens the next step.`,
      courseName: track.course.name,
    };
  }

  return {
    kind: "caught_up",
    label: "You're all caught up",
    href: "/student",
    why: "Every course's current step is done. Your pod will move forward together, or do a review.",
  };
}

export interface PodFocusItem {
  studentName: string;
  focus: string;
  why: string;
}

/**
 * Per-student "focus here" for a volunteer, from failed checkpoints + prereq gaps
 * + weak retention. Deterministic; the AI briefing (T18) is the narrative version.
 */
export async function getPodFocus(podId: string, masjidId: string): Promise<PodFocusItem[]> {
  const db = getServiceClient();
  const { data: members, error } = await db
    .from("pod_students")
    .select("student:users!inner ( id, name, masjid_id )")
    .eq("pod_id", podId);
  if (error) throw new Error(`getPodFocus: ${error.message}`);

  const students = (members ?? [])
    .map((m) => {
      const s = Array.isArray(m.student) ? m.student[0] : m.student;
      return s as { id: string; name: string; masjid_id: string } | null;
    })
    .filter((s): s is { id: string; name: string; masjid_id: string } => !!s && s.masjid_id === masjidId);

  const out: PodFocusItem[] = [];
  for (const s of students) {
    const step = await getStudentNextStep(s.id, masjidId);
    // Only surface the ones a volunteer can actually help with.
    if (step.kind === "caught_up" || step.kind === "review") continue;
    out.push({
      studentName: s.name,
      focus:
        step.kind === "blocked_prereq"
          ? "Unblock a prerequisite"
          : step.kind === "read_reteach" || step.kind === "retry_checkpoint"
            ? "Work through a stuck checkpoint"
            : "Move to the checkpoint",
      why: step.why,
    });
  }
  return out;
}
