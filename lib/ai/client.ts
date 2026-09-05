// Shared Anthropic client. Every LLM call in the app goes through lib/ai/*,
// and every lib/ai/* module gets its client from here (see docs/ARCHITECTURE.md).
//
// Not constructed at module load: `next build` and the Phase 1 dashboards must
// work with no ANTHROPIC_API_KEY set. Call getAnthropic() only from a code path
// that actually needs the model, and be ready for it to throw.
//
// A hard per-request timeout + no retries: during a live demo a slow model call
// must fail fast so the caller's try/catch can drop to the hand-authored
// fallback, rather than leaving a spinner hanging on screen.

import Anthropic from "@anthropic-ai/sdk";
import { env, isAnthropicConfigured } from "@/lib/env";

let client: Anthropic | null = null;

/** The model used for lesson / assessment generation. */
export const LESSON_MODEL = "claude-sonnet-5";

/** Per-request ceiling. Past this the SDK aborts and throws -> fallback path. */
export const AI_REQUEST_TIMEOUT_MS = 30_000;

export class AiNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set. Add it to .env.local to use AI generation.");
    this.name = "AiNotConfiguredError";
  }
}

export function getAnthropic(): Anthropic {
  if (!isAnthropicConfigured) throw new AiNotConfiguredError();
  client ??= new Anthropic({
    apiKey: env.anthropicApiKey,
    timeout: AI_REQUEST_TIMEOUT_MS,
    maxRetries: 0, // fail fast in the demo; re-run the gen:* scripts on a blip
  });
  return client;
}
