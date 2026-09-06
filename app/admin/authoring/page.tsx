import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listAuthoringCourses, type AuthoringCourse } from "@/lib/db/authoring-queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdoptCurriculumButton } from "@/components/admin/AdoptCurriculumButton";

function courseStats(c: AuthoringCourse) {
  const lessons = c.nodes.filter((n) => n.hasLesson).length;
  const checkpoints = c.nodes.filter((n) => n.hasCheckpoint).length;
  return { lessons, checkpoints };
}

export default async function AuthoringIndexPage() {
  const user = await requireRole("admin");

  let courses: AuthoringCourse[] = [];
  let loadError: string | null = null;
  try {
    courses = await listAuthoringCourses(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load courses";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Course authoring"
        title="Courses, units & pathway nodes"
        lede="Add or fix a course's units and lesson nodes without a seed script. Editing lesson or checkpoint content is safe for a pod mid-way through - the node keeps its id and the pod's position is untouched."
        back={{ href: "/admin", label: "Overview" }}
      />

      <Card tone="mustard" className="p-4 text-xs text-ink-2">
        Curriculum scope and evaluation formats are a compliance matter. Verify any
        Math node against the current Quebec Secondary 1 Progression of Learning
        before relying on it for a home-instruction portfolio.
      </Card>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. Run <code>npm run migrate</code> and <code>npm run seed</code>.
        </Card>
      ) : courses.length === 0 ? (
        <Card className="space-y-3 p-6 text-sm text-ink-3">
          <p>No courses yet. Start from the shared curriculum:</p>
          <AdoptCurriculumButton />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const { lessons, checkpoints } = courseStats(c);
            return (
              <Card key={c.id} as="article" className="flex flex-col gap-3 p-5">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">{c.name}</h2>
                  <p className="text-xs text-ink-4">{c.gradeBand}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="teal">{c.units.length} unit{c.units.length === 1 ? "" : "s"}</Badge>
                  <Badge tone="teal">{c.nodes.length} node{c.nodes.length === 1 ? "" : "s"}</Badge>
                  <Badge tone={lessons === c.nodes.length ? "success" : "mustard"}>
                    {lessons}/{c.nodes.length} lessons
                  </Badge>
                  <Badge tone={checkpoints === c.nodes.length ? "success" : "mustard"}>
                    {checkpoints}/{c.nodes.length} checkpoints
                  </Badge>
                </div>
                <Link
                  href={`/admin/authoring/${c.id}`}
                  className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-teal px-4 py-2 text-xs font-medium text-white hover:bg-teal-strong"
                >
                  Edit course
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
