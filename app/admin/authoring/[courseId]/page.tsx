import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
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

  const course = await getAuthoringCourse(user.masjidId, courseId).catch(() => null);
  if (!course) notFound();

  // Pull the persisted lesson/checkpoint JSON for every node so the editor can
  // show + hand-edit it. Small set (one unit per course in demo scope).
  const content: Record<string, { lesson: unknown; checkpoint: unknown }> = {};
  for (const node of course.nodes) {
    const full = await getPathwayNode(node.id, user.masjidId);
    content[node.id] = {
      lesson: full?.lesson_content ?? null,
      checkpoint: full?.checkpoint_content ?? null,
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={`Course authoring · ${course.gradeBand}`}
        title={course.name}
        lede="Units group nodes for unit assessments. Reorder or rename nodes freely; a node a pod is currently on (or that has student results) cannot be deleted. Regenerating content uses the same continuity-guarded generator the playground does."
        back={{ href: "/admin/authoring", label: "All courses" }}
      />

      {course.name === "Math" ? (
        <Card tone="mustard" className="p-4 text-xs text-ink-2">
          Math maps to the Quebec Secondary 1 mathematics program. Verify scope,
          sequence and notation against the current Progression of Learning before
          relying on this for a compliance portfolio.
        </Card>
      ) : null}

      <CourseAuthoringEditor course={course} content={content} />
    </div>
  );
}
