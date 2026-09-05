// POST /api/demo/reset
//
// Resets the volatile walkthrough state (progress, results, snapshots, the
// continuity trail, the volunteer handoff) to the seeded starting point. No AI
// content is regenerated, so it returns in well under a second.
//
// Guarded twice: the caller must be an admin AND NEXT_PUBLIC_SUFFA_DEMO_MODE must
// be on. It only ever touches the single demo masjid's fixtures.

import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { resetWalkthroughState } from "@/lib/demo/reset";

export async function POST() {
  if (!env.demoMode) {
    return Response.json({ error: "demo mode is not enabled" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "admin") {
    return Response.json({ error: "admin role required" }, { status: 403 });
  }

  try {
    const summary = await resetWalkthroughState(user.masjidId);
    return Response.json(summary);
  } catch (err) {
    console.error("[/api/demo/reset]", err);
    const message = err instanceof Error ? err.message : "reset failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
