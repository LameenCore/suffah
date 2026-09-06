// GET /api/offline/unit?courseId=...  (T61)
//
// Returns the student's CURRENT pathway node for a course, packaged for offline
// use: the persisted lesson content and the answer-stripped checkpoint. Auth-
// checked; read-only; a student only ever gets their own pod's current node.

import { getCurrentUser } from "@/lib/auth";
import { getPlayground } from "@/lib/db/queries";
import { stripAnswers } from "@/lib/ai/checkpoint";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "student") {
    return Response.json({ error: "student role required" }, { status: 403 });
  }

  const courseId = new URL(request.url).searchParams.get("courseId");
  if (!courseId) return Response.json({ error: "courseId is required" }, { status: 400 });

  try {
    const { courses } = await getPlayground(user.id, user.masjidId);
    const entry = courses.find((c) => c.course.id === courseId);
    if (!entry) return Response.json({ error: "course not found for this student" }, { status: 404 });
    if (!entry.currentNode) {
      return Response.json({ error: "no current lesson to download" }, { status: 409 });
    }

    return Response.json(
      {
        nodeId: entry.currentNode.id,
        courseId: entry.course.id,
        courseName: entry.course.name,
        title: entry.currentNode.title,
        lesson: entry.currentNode.lesson_content ?? null,
        checkpoint: entry.currentNode.checkpoint_content
          ? stripAnswers(entry.currentNode.checkpoint_content)
          : null,
        savedAt: Date.now(),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[/api/offline/unit]", err);
    const message = err instanceof Error ? err.message : "could not load unit";
    return Response.json({ error: message }, { status: 500 });
  }
}
