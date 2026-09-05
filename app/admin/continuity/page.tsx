import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { RegulationNote } from "@/components/RegulationNote";
import { ContinuityPod, type ContinuityPodData } from "@/components/admin/ContinuityPod";
import {
  listPodsForBriefing,
  listPodSessionNotes,
  getLatestBriefing,
} from "@/lib/db/continuity-queries";
import { getServiceClient } from "@/lib/db";

async function coursesForMasjid(masjidId: string) {
  const { data } = await getServiceClient()
    .from("courses")
    .select("id, name")
    .eq("masjid_id", masjidId)
    .order("name", { ascending: true });
  return (data ?? []) as { id: string; name: string }[];
}

async function volunteerName(podId: string): Promise<string | null> {
  const { data } = await getServiceClient()
    .from("pods")
    .select("volunteer:volunteers ( name )")
    .eq("id", podId)
    .maybeSingle();
  const v = data?.volunteer;
  const rec = Array.isArray(v) ? v[0] : v;
  return (rec as { name: string } | null)?.name ?? null;
}

export default async function AdminContinuityPage() {
  const user = await requireRole("admin");

  let pods: ContinuityPodData[] = [];
  let loadError: string | null = null;

  try {
    const [podRows, courses] = await Promise.all([
      listPodsForBriefing(user.masjidId),
      coursesForMasjid(user.masjidId),
    ]);
    pods = await Promise.all(
      podRows.map(async (p) => {
        const [notes, briefing, vName] = await Promise.all([
          listPodSessionNotes(p.id, user.masjidId, 25),
          getLatestBriefing(p.id, user.masjidId),
          volunteerName(p.id),
        ]);
        return {
          id: p.id,
          name: p.name,
          volunteerName: vName,
          courses,
          notes,
          briefing: briefing
            ? { content: briefing.content, source: briefing.generatedBy === "fallback" ? "fallback" : "model", generatedAt: briefing.generatedAt }
            : null,
        };
      }),
    );
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load continuity data";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/admin"
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Admin
        </Link>
        <Link
          href="/admin/pods"
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Pod assignment →
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Continuity Fingerprint</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          When a volunteer leaves, the next one gets more than &ldquo;Node 4 of Unit 2&rdquo;.
          This is an AI-generated briefing on <em>how</em> each pod has been learning —
          assembled from its progress, checkpoint history, and session notes — so churn
          becomes a knowledge handoff instead of a data-loss event.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          Continuity data is unavailable: {loadError}. Run{" "}
          <code>npm run migrate</code> and <code>npm run seed</code>.
        </p>
      ) : pods.length === 0 ? (
        <p className="rounded-xl border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15">
          No pods yet.
        </p>
      ) : (
        <div className="space-y-4">
          {pods.map((pod) => (
            <ContinuityPod key={pod.id} pod={pod} />
          ))}
        </div>
      )}

      <RegulationNote>
        A handoff briefing is a support tool for the incoming volunteer, not a formal
        student record. It is generated from in-platform activity and may be incomplete.
      </RegulationNote>
    </div>
  );
}
