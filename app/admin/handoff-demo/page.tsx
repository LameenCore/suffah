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
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Continuity Fingerprint
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Live handoff simulation</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A repeatable on-stage sequence: a volunteer drops out mid-session, the pod keeps
          learning through the AI playground, and the replacement volunteer picks up with a
          generated handoff briefing. This <em>performs</em> the churn-resilience claim
          instead of describing it.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
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
