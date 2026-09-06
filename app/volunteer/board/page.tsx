import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import {
  getVolunteerContext,
  listVolunteerPodRefs,
} from "@/lib/db/volunteer-portal-queries";
import { listPodThreads } from "@/lib/db/board-queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { PodBoard } from "@/components/board/PodBoard";
import { postAction, reportAction, loadThreadAction } from "./actions";

export const metadata = { title: "Pod board" };

export default async function VolunteerBoardPage() {
  const user = await requireRole("volunteer");
  const { t } = await getT(user);
  const vc = await getVolunteerContext(user.id, user.masjidId);
  const pods = vc ? await listVolunteerPodRefs(vc.volunteerId, user.masjidId) : [];

  return (
    <div className="space-y-6">
      <PageHeader kicker={t("board.kicker")} title={t("board.title")} lede={t("board.ledeVolunteer")} />
      {pods.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">{t("board.noPod")}</Card>
      ) : (
        <div className="space-y-8">
          {await Promise.all(
            pods.map(async (pod) => (
              <section key={pod.id} className="space-y-3">
                {pods.length > 1 ? (
                  <h2 className="font-display text-lg font-semibold text-ink">{pod.name}</h2>
                ) : null}
                <PodBoard
                  podId={pod.id}
                  podName={pod.name}
                  threads={await listPodThreads(pod.id, user)}
                  createAction={postAction}
                  reportAction={reportAction}
                  loadThread={loadThreadAction}
                />
              </section>
            )),
          )}
        </div>
      )}
    </div>
  );
}
