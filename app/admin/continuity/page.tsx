import { requireRole } from "@/lib/auth";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ContinuityPod, type ContinuityPodData } from "@/components/admin/ContinuityPod";
import {
  listPodsForBriefing,
  listPodSessionNotes,
  getLatestBriefing,
} from "@/lib/db/continuity-queries";
import { getPodFocus, type PodFocusItem } from "@/lib/recommendations";
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
  let focusByPod: Record<string, PodFocusItem[]> = {};
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
    focusByPod = Object.fromEntries(
      await Promise.all(
        pods.map(async (p) => [p.id, await getPodFocus(p.id, user.masjidId).catch(() => [])]),
      ),
    );
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load continuity data";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Continuity Fingerprint"
        title="How each pod is learning"
        lede={
          "When a volunteer leaves, the next one gets more than “Node 4 of Unit 2”. This briefing captures how a pod has been learning - assembled from its progress, checkpoint history, and session notes - so churn becomes a knowledge handoff, not a data-loss event."
        }
        back={{ href: "/admin", label: "Overview" }}
        actions={
          <ButtonLink href="/admin/handoff-demo" variant="soft" size="sm">
            Live handoff simulation
          </ButtonLink>
        }
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          Continuity data is unavailable: {loadError}. Run <code>npm run migrate</code> and{" "}
          <code>npm run seed</code>.
        </Card>
      ) : pods.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">No pods yet.</Card>
      ) : (
        <div className="space-y-4">
          {pods.map((pod) => (
            <div key={pod.id} className="space-y-2">
              {focusByPod[pod.id]?.length ? (
                <Card tone="teal" className="p-4">
                  <p className="text-sm font-medium text-ink">Focus this session - {pod.name}</p>
                  <ul className="mt-1 space-y-1 text-sm text-ink-2">
                    {focusByPod[pod.id].map((f, i) => (
                      <li key={i}>
                        <span className="font-medium">{f.studentName}:</span> {f.focus}.{" "}
                        <span className="text-ink-4">{f.why}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-xs text-ink-4">
                    Deterministic - from checkpoint history + the skill tree, not a model.
                  </p>
                </Card>
              ) : null}
              <ContinuityPod pod={pod} />
            </div>
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
