import { requireRole } from "@/lib/auth";
import { getStudentTracks } from "@/lib/db/queries";
import Link from "next/link";
import { getConsistency } from "@/lib/db/consistency-queries";
import { getRetentionSignal, seedReviewItems } from "@/lib/review";
import { RegulationNote } from "@/components/RegulationNote";
import { Card } from "@/components/ui/Card";
import { CoursePath } from "@/components/student/CoursePath";
import { ConsistencyStrip } from "@/components/student/ConsistencyStrip";
import { Mascot } from "@/components/ui/Mascot";
import { Crescent, Lantern, Flourish } from "@/components/ui/Motif";
import { getT } from "@/lib/i18n";

export default async function StudentHome() {
  const user = await requireRole("student");
  const { t } = await getT(user);
  const { pod, tracks, lessonsCompleted, checkpointsPassed } = await getStudentTracks(
    user.id,
    user.masjidId,
  );
  const consistency = await getConsistency(user.id, user.masjidId);
  await seedReviewItems(user.id, user.masjidId).catch(() => {});
  const retention = await getRetentionSignal(user.id, user.masjidId).catch(() => null);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="geo-field pointer-events-none absolute inset-0 opacity-30" aria-hidden />
        <div className="relative flex items-start gap-5">
          <Mascot size={92} mood="happy" className="hidden shrink-0 sm:block" />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
              {t("student.greeting")}
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink">
              {t("student.welcomeBack", { name: firstName })}
            </h1>
            <p className="max-w-lg text-sm text-ink-3">
              {pod
                ? t("student.inPod", { pod: pod.name })
                : t("student.noPod")}
            </p>
            {pod ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mustard-soft px-3 py-1 text-xs font-medium text-[color:var(--ink)]">
                  <Lantern className="h-3.5 w-3.5 text-mustard" />
                  {t("student.lessonsFinished", { count: lessonsCompleted })}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-teal-strong">
                  <Crescent className="h-3.5 w-3.5" />
                  {t("student.checkpointsPassed", { count: checkpointsPassed })}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {pod ? (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">{t("student.yourCourses")}</h2>
            <Flourish className="hidden h-3 flex-1 text-terracotta/50 sm:block" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {tracks.map((track) => (
              <CoursePath key={track.course.id} track={track} />
            ))}
          </div>
        </section>
      ) : null}

      {pod && retention && retention.dueNow > 0 ? (
        <Card as="section" tone="teal" className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">{t("student.reviewReady")}</h3>
            <p className="mt-0.5 text-sm text-ink-2">
              {t("student.reviewReadyBody", { count: retention.dueNow })}
            </p>
          </div>
          <Link
            href="/student/review"
            className="shrink-0 rounded-full bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-strong"
          >
            {t("student.startReview")}
          </Link>
        </Card>
      ) : null}

      {pod ? <ConsistencyStrip consistency={consistency} audience="student" /> : null}

      <RegulationNote>{t("student.regulationNote")}</RegulationNote>
    </div>
  );
}
