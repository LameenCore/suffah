// POST /api/exams/generate  { courseId: string, termLabel?: string, force?: boolean }

import { getCurrentUser } from "@/lib/auth";
import { enforceAiRateLimit } from "@/lib/ratelimit";
import { DEMO_TERM_LABEL } from "@/lib/types";
import { generateTermExam } from "@/lib/ai/term-exam";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "student" && user.role !== "admin") {
    return Response.json({ error: "role not permitted" }, { status: 403 });
  }

  const limited = enforceAiRateLimit("term_exam", user);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { courseId, termLabel, force } = (body ?? {}) as {
    courseId?: unknown;
    termLabel?: unknown;
    force?: unknown;
  };
  if (typeof courseId !== "string" || courseId.length === 0) {
    return Response.json({ error: "courseId is required" }, { status: 400 });
  }
  const term = typeof termLabel === "string" && termLabel ? termLabel : DEMO_TERM_LABEL;

  try {
    const r = await generateTermExam(courseId, term, user.masjidId, {
      force: force === true && user.role === "admin",
      actorUserId: user.id,
    });
    return Response.json({
      courseId,
      termLabel: term,
      source: r.source,
      questionCount: r.content.questions.length,
      durationSeconds: r.content.durationSeconds,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "CourseNotFoundError") {
      return Response.json({ error: err.message }, { status: 404 });
    }
    console.error("[/api/exams/generate]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "term exam generation failed" },
      { status: 500 },
    );
  }
}
