import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getPlayground, getLatestCheckpointResult } from "@/lib/db/queries";
import { getPrereqStatus } from "@/lib/db/skill-tree-queries";
import { stripAnswers } from "@/lib/ai/checkpoint";
import { LessonView } from "@/components/student/LessonView";
import { TutorPanel } from "@/components/student/TutorPanel";
import { MarkCompleteButton } from "@/components/student/MarkCompleteButton";
import { GenerateLessonPanel } from "@/components/student/GenerateLessonPanel";
import { Checkpoint } from "@/components/student/Checkpoint";
import { ButtonLink } from "@/components/ui/Button";

export default async function CourseLessonPage({
  params,
}: PageProps<"/student/[courseId]">) {
  const { courseId } = await params;
  const user = await requireRole("student");
  const { courses } = await getPlayground(user.id, user.masjidId);

  const entry = courses.find((c) => c.course.id === courseId);
  if (!entry) notFound();

  const { course, currentNode, lessonComplete, nodePosition, totalNodes } = entry;

  const priorPassed = currentNode
    ? (await getLatestCheckpointResult(user.id, currentNode.id))?.passed === true
    : false;

  // Skill tree (T43): is the current node locked behind an unmet prerequisite?
  const lock = currentNode
    ? (await getPrereqStatus(user.id, user.masjidId).catch(() => null))?.get(currentNode.id) ??
      null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/student"
          className="inline-flex items-center gap-1 text-sm text-ink-3 transition-colors hover:text-teal"
        >
          <span aria-hidden>&larr;</span> All courses
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-4">
            {course.name}
            {totalNodes > 0 ? ` · step ${nodePosition} of ${totalNodes}` : ""}
          </span>
          <ButtonLink href={`/student/${course.id}/exam`} variant="ghost" size="sm">
            Term exam
          </ButtonLink>
        </div>
      </div>

      {!currentNode ? (
        <p className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-sm text-ink-3">
          Your pod isn&apos;t on this course yet. Ask the masjid to place it.
        </p>
      ) : lock?.locked ? (
        <div className="rounded-[var(--radius-lg)] border border-mustard/40 bg-mustard-soft p-6 text-sm">
          <p className="font-display text-base font-semibold text-ink">
            Locked for now
          </p>
          <p className="mt-1 text-ink-2">
            Finish{" "}
            {lock.unmet.map((u, i) => (
              <span key={u.id}>
                {i > 0 ? " and " : ""}
                <span className="font-medium">
                  &ldquo;{u.title}&rdquo;
                </span>{" "}
                <span className="text-ink-4">({u.courseName})</span>
              </span>
            ))}{" "}
            first - it&apos;s what this lesson builds on.
          </p>
        </div>
      ) : !currentNode.lesson_content ? (
        <GenerateLessonPanel nodeId={currentNode.id} />
      ) : (
        <div className="space-y-6">
          <LessonView title={currentNode.title} lesson={currentNode.lesson_content} />

          <TutorPanel nodeId={currentNode.id} />

          {!lessonComplete ? (
            <MarkCompleteButton nodeId={currentNode.id} completed={false} />
          ) : (
            <>
              <MarkCompleteButton nodeId={currentNode.id} completed />
              <Checkpoint
                nodeId={currentNode.id}
                checkpoint={
                  currentNode.checkpoint_content
                    ? stripAnswers(currentNode.checkpoint_content)
                    : null
                }
                priorPassed={priorPassed}
                isLastNode={nodePosition >= totalNodes}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
