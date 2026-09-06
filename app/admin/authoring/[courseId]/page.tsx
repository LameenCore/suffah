import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { getAuthoringCourse } from "@/lib/db/authoring-queries";
import { getPathwayNode } from "@/lib/db/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { CourseAuthoringEditor } from "@/components/admin/CourseAuthoringEditor";

export default async function AuthoringCoursePage({
  params,
}: PageProps<"/admin/authoring/[courseId]">) {
  const { courseId } = await params;
  const user = await requireRole("admin");
  const { locale, t } = await getT(user);

  const course = await getAuthoringCourse(user.masjidId, courseId).catch(() => null);
  if (!course) notFound();

  // Pull the persisted lesson/checkpoint JSON for every node so the editor can
  // show + hand-edit it. Small set (one unit per course in demo scope).
  const content: Record<string, { lesson: unknown; checkpoint: unknown }> = {};
  for (const node of course.nodes) {
    const full = await getPathwayNode(node.id, user.masjidId, locale);
    content[node.id] = {
      lesson: full?.lesson_content ?? null,
      checkpoint: full?.checkpoint_content ?? null,
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("admin.authoring.courseKicker", { grade: course.gradeBand })}
        title={course.name}
        lede={t("admin.authoring.courseLede")}
        back={{ href: "/admin/authoring", label: t("admin.authoring.courseBack") }}
      />

      {course.name === "Math" ? (
        <Card tone="mustard" className="p-4 text-xs text-ink-2">
          {t("admin.authoring.mathNote")}
        </Card>
      ) : null}

      <CourseAuthoringEditor course={course} content={content} />
    </div>
  );
}
