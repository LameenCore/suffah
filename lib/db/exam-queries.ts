// Masjid-scoped reads/writes for term exams (T09). Kept separate from queries.ts
// to keep that file from growing without bound.

import { getServiceClient } from "@/lib/db";
import { getReadClient, getWriteClient } from "@/lib/db/server";
import { unwrapRelation as unwrap } from "@/lib/db/rel";
import type { CourseName } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { TermExamContent } from "@/lib/ai/term-exam";
import type { PathwayNode } from "@/lib/db/queries";

export interface CourseRow {
  id: string;
  name: CourseName;
  grade_band: string;
}

export async function getCourseForMasjid(
  courseId: string,
  masjidId: string,
): Promise<CourseRow | null> {
  const { data, error } = await (await getReadClient())
    .from("courses")
    .select("id, name, grade_band, masjid_id")
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw new Error(`getCourseForMasjid: ${error.message}`);
  if (!data || data.masjid_id !== masjidId) return null;
  return { id: data.id as string, name: data.name as CourseName, grade_band: data.grade_band as string };
}

/** Every lesson node in a course, ordered - the material a term exam draws on. */
export async function getCourseNodes(
  courseId: string,
  masjidId: string,
  locale: Locale = "en",
): Promise<PathwayNode[]> {
  const course = await getCourseForMasjid(courseId, masjidId);
  if (!course) return [];
  const { data, error } = await (await getReadClient())
    .from("pathway_nodes")
    .select(
      "id, course_id, unit_id, sequence_order, title, lesson_content, checkpoint_content, " +
        "lesson_content_fr, checkpoint_content_fr, " +
        "course:courses!inner ( id, name, grade_band, masjid_id )",
    )
    .eq("course_id", courseId)
    .order("sequence_order", { ascending: true });
  if (error) throw new Error(`getCourseNodes: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const lessonEn = (r.lesson_content as PathwayNode["lesson_content"]) ?? null;
    const lessonFr = (r.lesson_content_fr as PathwayNode["lesson_content"]) ?? null;
    const cpEn = (r.checkpoint_content as PathwayNode["checkpoint_content"]) ?? null;
    const cpFr = (r.checkpoint_content_fr as PathwayNode["checkpoint_content"]) ?? null;
    return {
      id: r.id as string,
      course_id: r.course_id as string,
      unit_id: (r.unit_id as string | null) ?? null,
      sequence_order: r.sequence_order as number,
      title: r.title as string,
      lesson_content: locale === "fr" && lessonFr ? lessonFr : lessonEn,
      checkpoint_content: locale === "fr" && cpFr ? cpFr : cpEn,
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
  locale: Locale = "en",
): Promise<TermExamRow | null> {
  const course = await getCourseForMasjid(courseId, masjidId);
  if (!course) return null;
  const { data, error } = await (await getReadClient())
    .from("term_exams")
    .select("course_id, term_label, exam_content, exam_content_fr, generated_by")
    .eq("course_id", courseId)
    .eq("term_label", termLabel)
    .maybeSingle();
  if (error) throw new Error(`getTermExam: ${error.message}`);
  if (!data) return null;
  const en = data.exam_content as TermExamContent;
  const fr = (data.exam_content_fr as TermExamContent | null) ?? null;
  return {
    courseId: data.course_id as string,
    termLabel: data.term_label as string,
    content: locale === "fr" && fr ? fr : en,
    generatedBy: data.generated_by as string,
  };
}

export async function saveTermExamContent(
  courseId: string,
  termLabel: string,
  masjidId: string,
  content: TermExamContent,
  generatedBy: string,
  locale: Locale = "en",
): Promise<void> {
  const course = await getCourseForMasjid(courseId, masjidId);
  if (!course) throw new Error(`saveTermExamContent: course ${courseId} not in masjid ${masjidId}`);
  const db = getServiceClient();
  if (locale === "fr") {
    // The English row owns the (course, term) key; the FR copy is a column on it.
    const { data, error } = await db
      .from("term_exams")
      .update({ exam_content_fr: content })
      .eq("course_id", courseId)
      .eq("term_label", termLabel)
      .select("course_id");
    if (error) throw new Error(`saveTermExamContent (fr): ${error.message}`);
    if (!data || data.length === 0) {
      throw new Error(
        `saveTermExamContent (fr): no English term exam for ${courseId}/${termLabel} — generate the English exam first`,
      );
    }
    return;
  }
  const { error } = await db
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
  const { data, error } = await (await getReadClient())
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
  const { error } = await (await getWriteClient()).from("term_exam_results").insert({
    student_user_id: studentUserId,
    course_id: courseId,
    term_label: termLabel,
    score,
    answer_data: answerData,
  });
  if (error) throw new Error(`saveTermExamResult: ${error.message}`);
}
