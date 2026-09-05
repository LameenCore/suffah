// Masjid-scoped reads/writes for term exams (T09). Kept separate from queries.ts
// to keep that file from growing without bound.

import { getServiceClient } from "@/lib/db";
import type { CourseName } from "@/lib/types";
import type { TermExamContent } from "@/lib/ai/term-exam";
import type { PathwayNode } from "@/lib/db/queries";

function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export interface CourseRow {
  id: string;
  name: CourseName;
  grade_band: string;
}

export async function getCourseForMasjid(
  courseId: string,
  masjidId: string,
): Promise<CourseRow | null> {
  const { data, error } = await getServiceClient()
    .from("courses")
    .select("id, name, grade_band, masjid_id")
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw new Error(`getCourseForMasjid: ${error.message}`);
  if (!data || data.masjid_id !== masjidId) return null;
  return { id: data.id as string, name: data.name as CourseName, grade_band: data.grade_band as string };
}

/** Every lesson node in a course, ordered — the material a term exam draws on. */
export async function getCourseNodes(
  courseId: string,
  masjidId: string,
): Promise<PathwayNode[]> {
  const course = await getCourseForMasjid(courseId, masjidId);
  if (!course) return [];
  const { data, error } = await getServiceClient()
    .from("pathway_nodes")
    .select(
      "id, course_id, unit_id, sequence_order, title, lesson_content, checkpoint_content, " +
        "course:courses!inner ( id, name, grade_band, masjid_id )",
    )
    .eq("course_id", courseId)
    .order("sequence_order", { ascending: true });
  if (error) throw new Error(`getCourseNodes: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    return {
      id: r.id as string,
      course_id: r.course_id as string,
      unit_id: (r.unit_id as string | null) ?? null,
      sequence_order: r.sequence_order as number,
      title: r.title as string,
      lesson_content: (r.lesson_content as PathwayNode["lesson_content"]) ?? null,
      checkpoint_content: (r.checkpoint_content as PathwayNode["checkpoint_content"]) ?? null,
      course: unwrap(r.course as unknown) as PathwayNode["course"],
    };
  });
}

export interface TermExamRow {
  courseId: string;
  termLabel: string;
  content: TermExamContent;
  generatedBy: string;
}

export async function getTermExam(
  courseId: string,
  termLabel: string,
  masjidId: string,
): Promise<TermExamRow | null> {
  const course = await getCourseForMasjid(courseId, masjidId);
  if (!course) return null;
  const { data, error } = await getServiceClient()
    .from("term_exams")
    .select("course_id, term_label, exam_content, generated_by")
    .eq("course_id", courseId)
    .eq("term_label", termLabel)
    .maybeSingle();
  if (error) throw new Error(`getTermExam: ${error.message}`);
  if (!data) return null;
  return {
    courseId: data.course_id as string,
    termLabel: data.term_label as string,
    content: data.exam_content as TermExamContent,
    generatedBy: data.generated_by as string,
  };
}

export async function saveTermExamContent(
  courseId: string,
  termLabel: string,
  masjidId: string,
  content: TermExamContent,
  generatedBy: string,
): Promise<void> {
  const course = await getCourseForMasjid(courseId, masjidId);
  if (!course) throw new Error(`saveTermExamContent: course ${courseId} not in masjid ${masjidId}`);
  const { error } = await getServiceClient()
    .from("term_exams")
    .upsert(
      { course_id: courseId, term_label: termLabel, exam_content: content, generated_by: generatedBy, generated_at: new Date().toISOString() },
      { onConflict: "course_id,term_label" },
    );
  if (error) throw new Error(`saveTermExamContent: ${error.message}`);
}

export interface TermExamResultRow {
  score: number;
  answer_data: unknown;
  attempted_at: string;
}

export async function getLatestTermExamResult(
  studentUserId: string,
  courseId: string,
  termLabel: string,
): Promise<TermExamResultRow | null> {
  const { data, error } = await getServiceClient()
    .from("term_exam_results")
    .select("score, answer_data, attempted_at")
    .eq("student_user_id", studentUserId)
    .eq("course_id", courseId)
    .eq("term_label", termLabel)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLatestTermExamResult: ${error.message}`);
  return (data as TermExamResultRow | null) ?? null;
}

export async function saveTermExamResult(
  studentUserId: string,
  courseId: string,
  termLabel: string,
  score: number,
  answerData: unknown,
): Promise<void> {
  const { error } = await getServiceClient().from("term_exam_results").insert({
    student_user_id: studentUserId,
    course_id: courseId,
    term_label: termLabel,
    score,
    answer_data: answerData,
  });
  if (error) throw new Error(`saveTermExamResult: ${error.message}`);
}
