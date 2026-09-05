// Claude API wrapper — ALL LLM calls route through lib/ai/ (see docs/ARCHITECTURE.md).
// Keeps prompt templates centralized and swappable.
//
// SCOPE NOTE (Phase 1): the concrete generation/grading functions land in Phase 2:
//   - lib/ai/lesson.ts      — lesson generation
//   - lib/ai/checkpoint.ts  — checkpoint generation + objective grading
//   - lib/ai/assessment.ts  — unit assessment / term exam generation + grading
// This file will hold the shared Anthropic client once the SDK is added.

import { isAnthropicConfigured } from "@/lib/env";

/** Latest recommended model for lesson/assessment generation. */
export const LESSON_MODEL = "claude-sonnet-5";

export function assertAiConfigured(): void {
  if (!isAnthropicConfigured) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local.");
  }
}
