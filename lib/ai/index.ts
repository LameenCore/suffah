// Claude API wrapper - ALL LLM calls route through lib/ai/ (see docs/ARCHITECTURE.md).
// Keeps prompt templates centralized and swappable.
//
// The three AI call types, matching the three-tier assessment structure:
//   - lib/ai/lesson.ts      - lesson generation (Phase 2)                ✅
//   - lib/ai/checkpoint.ts  - checkpoint generation + objective grading (Phase 2)
//   - lib/ai/assessment.ts  - unit assessment / term exam (Phase 3)

export { getAnthropic, LESSON_MODEL, AiNotConfiguredError } from "@/lib/ai/client";
export {
  generateLessonForNode,
  type LessonBody,
  type LessonContent,
  type LessonSource,
  type GenerateLessonResult,
} from "@/lib/ai/lesson";
export {
  generateCheckpointForNode,
  gradeCheckpoint,
  stripAnswers,
  type CheckpointBody,
  type CheckpointContent,
  type CheckpointQuestion,
  type CheckpointForStudent,
  type CheckpointGrade,
  type QuestionGrade,
  type GenerateCheckpointResult,
} from "@/lib/ai/checkpoint";
export {
  generateUnitAssessment,
  gradeUnitAssessment,
  stripAssessmentAnswers,
  buildAssessmentPrompt,
  type AssessmentBody,
  type AssessmentContent,
  type AssessmentForStudent,
  type AssessmentGrade,
  type AssessmentKind,
  type GenerateAssessmentResult,
} from "@/lib/ai/assessment";
export {
  type Question,
  type QuestionForStudent,
  gradeQuestions,
} from "@/lib/ai/questions";
export {
  generatePodBriefing,
  fallbackBriefing,
  type PodBriefing,
  type BriefingSource,
  type GenerateBriefingResult,
} from "@/lib/ai/continuity";
export {
  generateTermExam,
  gradeTermExam,
  stripExamAnswers,
  latestTermExamGrade,
  type TermExamContent,
  type TermExamForStudent,
  type TermExamGrade,
  type GenerateTermExamResult,
} from "@/lib/ai/term-exam";
