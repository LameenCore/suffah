import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { HandoffDemo } from "@/components/admin/HandoffDemo";
import { getHandoffDemoState, type HandoffDemoState } from "@/lib/db/continuity-queries";

export default async function HandoffDemoPage() {
  const user = await requireRole("admin");
  const { t } = await getT(user);

  let state: HandoffDemoState | null = null;
  let loadError: string | null = null;
  try {
    state = await getHandoffDemoState(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "unknown error";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("admin.handoff.kicker")}
        title={t("admin.handoff.title")}
        lede={t("admin.handoff.lede")}
        back={{ href: "/admin/continuity", label: t("nav.continuity") }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. <code>npm run seed</code> · <code>npm run seed:continuity</code>
        </Card>
      ) : state ? (
        <HandoffDemo state={state} />
      ) : null}

      <RegulationNote>{t("admin.handoff.regulationNote")}</RegulationNote>
    </div>
  );
}
