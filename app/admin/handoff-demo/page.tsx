import { requireRole } from "@/lib/auth";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { HandoffDemo } from "@/components/admin/HandoffDemo";
import { getHandoffDemoState, type HandoffDemoState } from "@/lib/db/continuity-queries";

export default async function HandoffDemoPage() {
  const user = await requireRole("admin");

  let state: HandoffDemoState | null = null;
  let loadError: string | null = null;
  try {
    state = await getHandoffDemoState(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load demo state";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Live handoff simulation"
        title="Churn, performed - not described"
        lede="A repeatable on-stage sequence: a volunteer drops out mid-session, the pod keeps learning through the playground, and the replacement picks up with a generated handoff briefing."
        back={{ href: "/admin/continuity", label: "Continuity Fingerprint" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. Run <code>npm run seed</code> and <code>npm run seed:continuity</code>.
        </Card>
      ) : state ? (
        <HandoffDemo state={state} />
      ) : null}

      <RegulationNote>
        A demonstration flow over real data. The handoff briefing is a support tool for the
        incoming volunteer, not a formal student record.
      </RegulationNote>
    </div>
  );
}
