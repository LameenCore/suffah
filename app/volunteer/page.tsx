import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { RegulationNote } from "@/components/RegulationNote";
import { VolunteerPod } from "@/components/volunteer/VolunteerPod";
import {
  getVolunteerContext,
  getVolunteerPodViews,
  type VolunteerPodView,
} from "@/lib/db/volunteer-portal-queries";

export default async function VolunteerHome() {
  const user = await requireRole("volunteer");
  const { t } = await getT(user);

  let pods: VolunteerPodView[] = [];
  let loadError: string | null = null;
  try {
    const ctx = await getVolunteerContext(user.id, user.masjidId);
    if (ctx) pods = await getVolunteerPodViews(ctx.volunteerId, user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load your pods";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("volunteer.kicker")}
        title={t("volunteer.title")}
        lede={t("volunteer.lede")}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}.
        </Card>
      ) : pods.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">{t("volunteer.noPods")}</Card>
      ) : (
        <div className="space-y-4">
          {pods.map((pod) => (
            <VolunteerPod key={pod.id} pod={pod} />
          ))}
        </div>
      )}

      <RegulationNote>{t("volunteer.regulationNote")}</RegulationNote>
    </div>
  );
}
