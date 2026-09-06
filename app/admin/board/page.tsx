import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { listModerationQueue } from "@/lib/db/board-queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegulationNote } from "@/components/RegulationNote";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export const metadata = { title: "Board moderation" };

export default async function AdminBoardPage() {
  const user = await requireRole("admin");
  const { t } = await getT(user);
  const items = await listModerationQueue(user.masjidId);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("moderation.kicker")}
        title={t("moderation.title")}
        lede={t("moderation.lede")}
        back={{ href: "/admin", label: t("nav.overview") }}
      />
      <RegulationNote>{t("moderation.safetyNote")}</RegulationNote>
      <ModerationQueue items={items} />
    </div>
  );
}
