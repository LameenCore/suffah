// POST /api/exams/grade  { courseId: string, termLabel?: string, answers: Record<string,string> }

import { getCurrentUser } from "@/lib/auth";
import { DEMO_TERM_LABEL } from "@/lib/types";
import { gradeTermExam } from "@/lib/ai/term-exam";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "student") {
    return Response.json({ error: "only a student can submit an exam" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { courseId, termLabel, answers } = (body ?? {}) as {
    courseId?: unknown;
    termLabel?: unknown;
    answers?: unknown;
  };
  if (typeof courseId !== "string" || courseId.length === 0) {
    return Response.json({ error: "courseId is required" }, { status: 400 });
  }
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    return Response.json({ error: "answers must be an object" }, { status: 400 });
  }
  const term = typeof termLabel === "string" && termLabel ? termLabel : DEMO_TERM_LABEL;
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) normalized[k] = String(v);

  try {
    const grade = await gradeTermExam(courseId, term, user.id, user.masjidId, normalized);
    return Response.json(grade);
  } catch (err) {
    if (err instanceof Error && err.name === "TermExamMissingError") {
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("[/api/exams/grade]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "grading failed" },
      { status: 500 },
    );
  }
}
