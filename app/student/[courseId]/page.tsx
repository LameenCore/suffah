import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getPlayground } from "@/lib/db/queries";
import { LessonView } from "@/components/student/LessonView";
import { MarkCompleteButton } from "@/components/student/MarkCompleteButton";
import { GenerateLessonPanel } from "@/components/student/GenerateLessonPanel";

export default async function CourseLessonPage({
  params,
}: PageProps<"/student/[courseId]">) {
  const { courseId } = await params;
  const user = await requireRole("student");
  const { courses } = await getPlayground(user.id, user.masjidId);

  const entry = courses.find((c) => c.course.id === courseId);
  if (!entry) notFound();

  const { course, currentNode, lessonComplete, nodePosition, totalNodes } = entry;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/student"
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Playground
        </Link>
        <span className="text-zinc-400">
          {course.name} · {course.grade_band}
          {totalNodes > 0 ? ` · node ${nodePosition} of ${totalNodes}` : ""}
        </span>
      </div>

      {!currentNode ? (
        <p className="rounded-xl border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15">
          This course has no lesson node assigned to your pod yet.
        </p>
      ) : !currentNode.lesson_content ? (
        <GenerateLessonPanel nodeId={currentNode.id} />
      ) : (
        <>
          <LessonView title={currentNode.title} lesson={currentNode.lesson_content} />
          <MarkCompleteButton nodeId={currentNode.id} completed={lessonComplete} />
        </>
      )}
    </div>
  );
}
