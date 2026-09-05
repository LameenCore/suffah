"use server";

// Server actions for the live "empty seat" handoff simulation (T19).
// Thin orchestration over existing levers: recordDeparture / reinstateVolunteer
// (T15), setPodVolunteer (T11), generatePodBriefing (T18). Admin only.

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { recordDeparture, reinstateVolunteer } from "@/lib/db/volunteer-queries";
import { setPodVolunteer } from "@/lib/db/admin-queries";
import { getHandoffDemoState } from "@/lib/db/continuity-queries";
import { generatePodBriefing, type PodBriefing } from "@/lib/ai/continuity";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not signed in");
  if (user.role !== "admin") throw new Error("admin role required");
  return user;
}

/** Step 1 - the pod's volunteer goes offline (departs). Pod keeps pod_progress. */
export async function takeVolunteerOfflineAction(): Promise<void> {
  const user = await requireAdmin();
  const state = await getHandoffDemoState(user.masjidId);
  if (!state.pod) throw new Error("demo pod not found - run npm run seed");
  if (state.currentVolunteer) {
    await recordDeparture(user.masjidId, state.currentVolunteer.id);
    await recordAudit({
      actor: user,
      action: "volunteer.departure",
      targetType: "volunteer",
      targetId: state.currentVolunteer.id,
      metadata: { simulation: true },
    });
  }
  revalidatePath("/admin/handoff-demo");
}

/** Step 2 - assign a replacement volunteer and generate the handoff briefing. */
export async function assignReplacementAction(
  volunteerId: string,
): Promise<{ briefing: PodBriefing; source: string; generatedAt: string }> {
  const user = await requireAdmin();
  const state = await getHandoffDemoState(user.masjidId);
  if (!state.pod) throw new Error("demo pod not found - run npm run seed");

  await reinstateVolunteer(user.masjidId, volunteerId); // no-op if never departed
  await setPodVolunteer(user.masjidId, state.pod.id, volunteerId);
  const result = await generatePodBriefing(state.pod.id, user.masjidId);
  await recordAudit({
    actor: user,
    action: "pod.volunteer_set",
    targetType: "pod",
    targetId: state.pod.id,
    metadata: { volunteerId, simulation: true },
  });

  revalidatePath("/admin/handoff-demo");
  return { briefing: result.briefing, source: result.source, generatedAt: result.generatedAt };
}

/** Reset - put the pod's home volunteer back so the demo can be re-run. */
export async function resetHandoffDemoAction(): Promise<void> {
  const user = await requireAdmin();
  const state = await getHandoffDemoState(user.masjidId);
  if (!state.pod || !state.homeVolunteer) return;

  await reinstateVolunteer(user.masjidId, state.homeVolunteer.id);
  await setPodVolunteer(user.masjidId, state.pod.id, state.homeVolunteer.id);
  revalidatePath("/admin/handoff-demo");
}
