import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { DEMO_TERM_LABEL } from "@/lib/types";
import { getPlayground } from "@/lib/db/queries";
import { getTermExam } from "@/lib/db/exam-queries";
import { stripExamAnswers, latestTermExamGrade } from "@/lib/ai/term-exam";
import { TermExam } from "@/components/student/TermExam";
import { RegulationNote } from "@/components/RegulationNote";

export default async function TermExamPage({ params }: PageProps<"/student/[courseId]/exam">) {
  const { courseId } = await params;
  const user = await requireRole("student");
  const { courses } = await getPlayground(user.id, user.masjidId);
  const entry = courses.find((c) => c.course.id === courseId);
  if (!entry) notFound();

  const [examRow, prior] = await Promise.all([
    getTermExam(courseId, DEMO_TERM_LABEL, user.masjidId),
    latestTermExamGrade(user.id, courseId, DEMO_TERM_LABEL),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link
          href={`/student/${courseId}`}
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← {entry.course.name}
        </Link>
        <span className="text-zinc-400">{DEMO_TERM_LABEL}</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{entry.course.name} — term exam</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Timed, cumulative, no help mid-exam — modelled on a real school exam. The result is
          the primary artifact in the compliance report.
        </p>
      </div>

      <TermExam
        courseId={courseId}
        exam={examRow ? stripExamAnswers(examRow.content) : null}
        priorResult={prior}
      />

      <RegulationNote>
        Exam format and equivalency shown here are for the demo and must be verified against
        current Québec evaluation requirements.
      </RegulationNote>
    </div>
  );
}
