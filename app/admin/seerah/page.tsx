import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getPathwayNode } from "@/lib/db/queries";
import {
  listContributions,
  listSeerahNodes,
  type Contribution,
  type SeerahNodeRow,
} from "@/lib/db/contribution-queries";
import { SeerahContributions } from "@/components/admin/SeerahContributions";
import type { LessonContent } from "@/lib/ai/lesson";

export default async function AdminSeerahPage({
  searchParams,
}: PageProps<"/admin/seerah">) {
  const user = await requireRole("admin");
  const sp = await searchParams;
  const wanted = typeof sp.node === "string" ? sp.node : undefined;

  let nodes: SeerahNodeRow[] = [];
  let loadError: string | null = null;
  try {
    nodes = await listSeerahNodes(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load Seerah lessons";
  }

  const selected =
    nodes.find((n) => n.id === wanted) ??
    nodes.find((n) => n.pendingContributions > 0) ??
    nodes[0] ??
    null;

  let contributions: Contribution[] = [];
  let lesson: LessonContent | null = null;
  if (selected && !loadError) {
    try {
      [contributions, lesson] = await Promise.all([
        listContributions(selected.id, user.masjidId),
        getPathwayNode(selected.id, user.masjidId).then(
          (n) => (n?.lesson_content as LessonContent | null) ?? null,
        ),
      ]);
    } catch (err) {
      loadError = err instanceof Error ? err.message : "could not load the lesson";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/admin"
          className="text-ink-3 underline underline-offset-2 hover:text-ink "
        >
          ← Admin
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seerah - community input</h1>
        <p className="mt-1 text-sm text-ink-3 ">
          Seerah has no external curriculum vendor. The masjid&apos;s scholars and elders
          annotate the lesson draft; their notes are folded into the next version
          of the lesson.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-ink-2   ">
          Unavailable: {loadError}. Configure Supabase, run the seed, and generate the
          Seerah lessons (`npm run gen:lessons`).
        </p>
      ) : nodes.length === 0 ? (
        <p className="rounded-xl border border-border p-6 text-sm text-ink-3 ">
          No Seerah lesson nodes found.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="space-y-1">
            {nodes.map((n) => (
              <Link
                key={n.id}
                href={`/admin/seerah?node=${n.id}`}
                className={`block rounded-lg border px-3 py-2 text-sm ${
                  selected?.id === n.id
                    ? "border-emerald-400 bg-success-soft  "
                    : "border-border hover:bg-surface-2  "
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {n.sequenceOrder}. {n.title}
                  </span>
                  {n.pendingContributions > 0 && (
                    <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-2 dark:bg-amber-900/40 ">
                      {n.pendingContributions}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-ink-4">
                  {n.hasLesson ? `lesson v${n.version}` : "no lesson yet"}
                </div>
              </Link>
            ))}
          </nav>

          <div className="space-y-4">
            {selected && lesson ? (
              <>
                <section className="rounded-xl border border-border bg-surface p-4  ">
                  <h2 className="font-medium">Current draft</h2>
                  <p className="mt-1 text-sm text-ink-2 ">
                    {lesson.summary}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-ink-3 ">
                    {lesson.sections.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden>·</span>
                        {s.heading}
                      </li>
                    ))}
                  </ul>
                </section>

                <SeerahContributions
                  nodeId={selected.id}
                  nodeTitle={selected.title}
                  version={selected.version}
                  contributions={contributions}
                />
              </>
            ) : selected ? (
              <p className="rounded-xl border border-border p-6 text-sm text-ink-3 ">
                This node has no generated lesson yet. Run{" "}
                <code>npm run gen:lessons</code> first.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
