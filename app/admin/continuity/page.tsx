import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
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
  const { t } = await getT(user);

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
    loadError = err instanceof Error ? err.message : "unknown error";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("nav.continuity")}
        title={t("admin.continuity.title")}
        lede={t("admin.continuity.lede")}
        back={{ href: "/admin", label: t("nav.overview") }}
        actions={
          <ButtonLink href="/admin/handoff-demo" variant="soft" size="sm">
            {t("admin.continuity.liveHandoff")}
          </ButtonLink>
        }
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.continuity.unavailable", { error: loadError })}{" "}
          <code>npm run migrate</code> · <code>npm run seed</code>
        </Card>
      ) : pods.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">{t("admin.continuity.noPods")}</Card>
      ) : (
        <div className="space-y-4">
          {pods.map((pod) => (
            <div key={pod.id} className="space-y-2">
              {focusByPod[pod.id]?.length ? (
                <Card tone="teal" className="p-4">
                  <p className="text-sm font-medium text-ink">
                    {t("admin.continuity.focusThisSession", { pod: pod.name })}
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-ink-2">
                    {focusByPod[pod.id].map((f, i) => (
                      <li key={i}>
                        <span className="font-medium">{f.studentName}:</span> {f.focus}.{" "}
                        <span className="text-ink-4">{f.why}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-xs text-ink-4">
                    {t("admin.continuity.focusDeterministic")}
                  </p>
                </Card>
              ) : null}
              <ContinuityPod pod={pod} />
            </div>
          ))}
        </div>
      )}

      <RegulationNote>{t("admin.continuity.regulationNote")}</RegulationNote>
    </div>
  );
}
