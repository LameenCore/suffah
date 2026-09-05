// POST /api/continuity/briefing  { podId: string }
//
// Generates + persists a handoff briefing (Continuity Fingerprint) for a pod.
// Admin only, masjid-scoped.

import { getCurrentUser } from "@/lib/auth";
import { generatePodBriefing } from "@/lib/ai/continuity";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "admin") {
    return Response.json({ error: "admin role required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { podId } = (body ?? {}) as { podId?: unknown };
  if (typeof podId !== "string" || podId.length === 0) {
    return Response.json({ error: "podId is required" }, { status: 400 });
  }

  try {
    const result = await generatePodBriefing(podId, user.masjidId);
    return Response.json({
      podId,
      source: result.source,
      generatedAt: result.generatedAt,
      briefing: result.briefing,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "PodNotFoundError") {
      return Response.json({ error: err.message }, { status: 404 });
    }
    console.error("[/api/continuity/briefing]", err);
    const message = err instanceof Error ? err.message : "briefing generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
