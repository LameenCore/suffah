// POST /api/checkpoints/generate  { nodeId: string, force?: boolean }
//
// Generates (or returns the persisted) checkpoint for a node. Writes to the DB
// before responding. Role- and masjid-scoped at the handler.

import { getCurrentUser } from "@/lib/auth";
import { generateCheckpointForNode } from "@/lib/ai/checkpoint";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "student" && user.role !== "admin") {
    return Response.json({ error: "role not permitted" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { nodeId, force } = (body ?? {}) as { nodeId?: unknown; force?: unknown };
  if (typeof nodeId !== "string" || nodeId.length === 0) {
    return Response.json({ error: "nodeId is required" }, { status: 400 });
  }

  try {
    const result = await generateCheckpointForNode(nodeId, user.masjidId, {
      force: force === true,
    });
    return Response.json({
      nodeId: result.node.id,
      title: result.node.title,
      course: result.node.course.name,
      source: result.source,
      regenerated: result.regenerated,
      questionCount: result.checkpoint.questions.length,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "NodeNotFoundError") {
      return Response.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof Error && err.name === "LessonMissingError") {
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("[/api/checkpoints/generate]", err);
    const message = err instanceof Error ? err.message : "checkpoint generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
