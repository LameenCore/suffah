import { requireRole } from "@/lib/auth";
import { getStudentTracks } from "@/lib/db/queries";
import { RegulationNote } from "@/components/RegulationNote";
import { CoursePath } from "@/components/student/CoursePath";
import { Mascot } from "@/components/ui/Mascot";
import { Crescent, Lantern, Flourish } from "@/components/ui/Motif";

export default async function StudentHome() {
  const user = await requireRole("student");
  const { pod, tracks, lessonsCompleted, checkpointsPassed } = await getStudentTracks(
    user.id,
    user.masjidId,
  );
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="geo-field pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex items-start gap-5">
          <Mascot size={92} mood="happy" className="hidden shrink-0 sm:block" />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
              As-salamu alaykum
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Welcome back, {firstName}
            </h1>
            <p className="max-w-lg text-sm text-ink-3">
              {pod
                ? `You're learning with ${pod.name}. Work through a lesson at your own pace, then a short checkpoint before the path opens up.`
                : "You're not in a pod yet. Ask the masjid admin to place you in one."}
            </p>
            {pod ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mustard-soft px-3 py-1 text-xs font-medium text-[color:var(--ink)]">
                  <Lantern className="h-3.5 w-3.5 text-mustard" />
                  {lessonsCompleted} lesson{lessonsCompleted === 1 ? "" : "s"} finished
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-teal-strong">
                  <Crescent className="h-3.5 w-3.5" />
                  {checkpointsPassed} checkpoint{checkpointsPassed === 1 ? "" : "s"} passed
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {pod ? (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">Your courses</h2>
            <Flourish className="hidden h-3 flex-1 text-terracotta/50 sm:block" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {tracks.map((track) => (
              <CoursePath key={track.course.id} track={track} />
            ))}
          </div>
        </section>
      ) : null}

      <RegulationNote>
        Assessment formats and exam equivalency shown here are for the demo and must be
        verified against current Quebec evaluation requirements.
      </RegulationNote>
    </div>
  );
}
