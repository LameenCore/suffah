import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { DEMO_TERM_LABEL } from "@/lib/types";
import { getPlayground } from "@/lib/db/queries";
import { getTermExam } from "@/lib/db/exam-queries";
import { stripExamAnswers, latestTermExamGrade } from "@/lib/ai/term-exam";
import { TermExam } from "@/components/student/TermExam";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";

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
      <PageHeader
        kicker={`${entry.course.name} · ${DEMO_TERM_LABEL}`}
        title="Term exam"
        lede="Timed and cumulative, with no help mid-exam - modelled on a real school exam. The result becomes the primary artifact in your compliance record."
        back={{ href: `/student/${courseId}`, label: entry.course.name }}
      />

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
