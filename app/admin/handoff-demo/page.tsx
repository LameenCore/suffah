import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { RegulationNote } from "@/components/RegulationNote";
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
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/admin/continuity"
          className="text-ink-3 underline underline-offset-2 hover:text-ink "
        >
          ← Continuity Fingerprint
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Live handoff simulation</h1>
        <p className="mt-1 text-sm text-ink-3 ">
          A repeatable on-stage sequence: a volunteer drops out mid-session, the pod keeps
          learning through the playground, and the replacement volunteer picks up with a
          generated handoff briefing. This <em>performs</em> the churn-resilience claim
          instead of describing it.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-ink-2   ">
          {loadError}. Run <code>npm run seed</code> and <code>npm run seed:continuity</code>.
        </p>
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
