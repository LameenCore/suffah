// POST /api/lessons/generate  { nodeId: string, force?: boolean }
//
// Generates (or returns the already-persisted) lesson for a pathway node and
// writes it to the DB before responding - never raw model output straight to the
// client (see .claude/skills/api-design.md). Role- and masjid-scoped at the
// handler, not just the UI.

import { getCurrentUser } from "@/lib/auth";
import { generateLessonForNode } from "@/lib/ai/lesson";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "not signed in" }, { status: 401 });
  }
  // Students generate a lesson as they reach a node; admins can pre-generate.
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
    const result = await generateLessonForNode(nodeId, user.masjidId, {
      force: force === true,
    });
    return Response.json({
      nodeId: result.node.id,
      title: result.node.title,
      course: result.node.course.name,
      sequenceOrder: result.node.sequence_order,
      source: result.source,
      regenerated: result.regenerated,
      lesson: result.lesson,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "NodeNotFoundError") {
      return Response.json({ error: err.message }, { status: 404 });
    }
    console.error("[/api/lessons/generate]", err);
    const message = err instanceof Error ? err.message : "lesson generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
