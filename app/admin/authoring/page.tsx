import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
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
  const { t } = await getT(user);

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
        kicker={t("admin.authoring.kicker")}
        title={t("admin.authoring.title")}
        lede={t("admin.authoring.lede")}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      <Card tone="mustard" className="p-4 text-xs text-ink-2">
        {t("admin.authoring.complianceNote")}
      </Card>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.authoring.unavailable", {
            detail: loadError,
            cmd1: "npm run migrate",
            cmd2: "npm run seed",
          })}
        </Card>
      ) : courses.length === 0 ? (
        <Card className="space-y-3 p-6 text-sm text-ink-3">
          <p>{t("admin.authoring.emptyIntro")}</p>
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
                  <Badge tone="teal">
                    {t(c.units.length === 1 ? "admin.authoring.unitOne" : "admin.authoring.unitMany", {
                      n: c.units.length,
                    })}
                  </Badge>
                  <Badge tone="teal">
                    {t(c.nodes.length === 1 ? "admin.authoring.nodeOne" : "admin.authoring.nodeMany", {
                      n: c.nodes.length,
                    })}
                  </Badge>
                  <Badge tone={lessons === c.nodes.length ? "success" : "mustard"}>
                    {t("admin.authoring.lessonsBadge", { done: lessons, total: c.nodes.length })}
                  </Badge>
                  <Badge tone={checkpoints === c.nodes.length ? "success" : "mustard"}>
                    {t("admin.authoring.checkpointsBadge", {
                      done: checkpoints,
                      total: c.nodes.length,
                    })}
                  </Badge>
                </div>
                <Link
                  href={`/admin/authoring/${c.id}`}
                  className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-teal px-4 py-2 text-xs font-medium text-white hover:bg-teal-strong"
                >
                  {t("admin.authoring.editCourse")}
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
