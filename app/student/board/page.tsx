import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { getPodForStudent } from "@/lib/db/queries";
import { listPodThreads } from "@/lib/db/board-queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { PodBoard } from "@/components/board/PodBoard";
import { postAction, reportAction, loadThreadAction } from "./actions";

export const metadata = { title: "Pod board" };

export default async function StudentBoardPage() {
  const user = await requireRole("student");
  const { t } = await getT(user);
  const pod = await getPodForStudent(user.id, user.masjidId);

  return (
    <div className="space-y-6">
      <PageHeader kicker={t("board.kicker")} title={t("board.title")} lede={t("board.lede")} />
      {!pod ? (
        <Card className="p-6 text-sm text-ink-3">{t("board.noPod")}</Card>
      ) : (
        <PodBoard
          podId={pod.id}
          podName={pod.name}
          threads={await listPodThreads(pod.id, user)}
          createAction={postAction}
          reportAction={reportAction}
          loadThread={loadThreadAction}
        />
      )}
    </div>
  );
}
