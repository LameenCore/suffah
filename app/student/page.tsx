import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getPlayground } from "@/lib/db/queries";
import { RegulationNote } from "@/components/RegulationNote";

export default async function StudentHome() {
  const user = await requireRole("student");
  const { pod, courses } = await getPlayground(user.id, user.masjidId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Playground</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {pod
            ? `You're in ${pod.name}. Learn at your own pace: work through the lesson, then a checkpoint before you move on.`
            : "You're not in a pod yet. Ask the masjid admin to add you to one."}
        </p>
      </div>

      {pod ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {courses.map(({ course, currentNode, lessonComplete, nodePosition, totalNodes }) => (
            <Link
              key={course.id}
              href={`/student/${course.id}`}
              className="rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-violet-500 dark:border-white/15 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{course.name}</h2>
                <span className="text-[11px] text-zinc-400">
                  {totalNodes > 0 ? `Node ${nodePosition} / ${totalNodes}` : "-"}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {currentNode ? currentNode.title : "No lesson assigned yet"}
              </p>
              <p className="mt-3 text-xs">
                {!currentNode ? (
                  <span className="text-zinc-400">-</span>
                ) : lessonComplete ? (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Lesson complete
                  </span>
                ) : currentNode.lesson_content ? (
                  <span className="text-violet-600 dark:text-violet-400">Lesson ready</span>
                ) : (
                  <span className="text-zinc-400">Not started</span>
                )}
              </p>
            </Link>
          ))}
        </div>
      ) : null}

      <RegulationNote>
        Assessment formats and exam equivalency shown here are for the demo and must be
        verified against current Québec evaluation requirements.
      </RegulationNote>
    </div>
  );
}
