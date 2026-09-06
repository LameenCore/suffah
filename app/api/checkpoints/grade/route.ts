// POST /api/checkpoints/grade  { nodeId: string, answers: Record<string, string> }
//
// Grades a submitted checkpoint, persists the attempt to checkpoint_results, and
// advances the pod on a pass. Returns the persisted grade, not raw model output.

import { getCurrentUser } from "@/lib/auth";
import { isLessonComplete } from "@/lib/db/queries";
import { gradeCheckpoint } from "@/lib/ai/checkpoint";
import { getLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "student") {
    return Response.json({ error: "only a student can submit a checkpoint" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { nodeId, answers } = (body ?? {}) as { nodeId?: unknown; answers?: unknown };
  if (typeof nodeId !== "string" || nodeId.length === 0) {
    return Response.json({ error: "nodeId is required" }, { status: 400 });
  }
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    return Response.json({ error: "answers must be an object" }, { status: 400 });
  }
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) normalized[k] = String(v);

  try {
    if (!(await isLessonComplete(user.id, nodeId))) {
      return Response.json(
        { error: "finish the lesson before submitting the checkpoint" },
        { status: 409 },
      );
    }
    const grade = await gradeCheckpoint(nodeId, user.id, user.masjidId, normalized, await getLocale(user));
    return Response.json(grade);
  } catch (err) {
    if (err instanceof Error && err.name === "NodeNotFoundError") {
      return Response.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof Error && err.name === "CheckpointMissingError") {
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("[/api/checkpoints/grade]", err);
    const message = err instanceof Error ? err.message : "grading failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
