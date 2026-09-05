// In-memory sliding-window rate limiter (T34).
//
// Scope note: this is per-process. On Vercel/serverless each instance keeps its
// own counters, so the effective limit is (configured limit x live instances) -
// fine as a cost guard for a pilot, not a hard security control. The production
// swap is Upstash Redis (@upstash/ratelimit) behind this same checkRateLimit()
// signature; nothing else changes.

interface Window {
  hits: number[];
}

const buckets = new Map<string, Window>();

export interface RateLimitRule {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Requests remaining in the current window (0 when blocked). */
  remaining: number;
  /** When blocked: ms until the oldest hit ages out and a slot frees up. */
  retryAfterMs: number;
}

/**
 * Record a hit against `key` and report whether it is within `rule`.
 * Call once per request you want to limit.
 */
export function checkRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const cutoff = now - rule.windowMs;

  const bucket = buckets.get(key) ?? { hits: [] };
  // Drop hits outside the window.
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= rule.limit) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return { ok: false, remaining: 0, retryAfterMs: Math.max(0, oldest + rule.windowMs - now) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: rule.limit - bucket.hits.length, retryAfterMs: 0 };
}

/** Test/maintenance helper - forget all counters. */
export function resetRateLimits(): void {
  buckets.clear();
}

// --- HTTP glue ------------------------------------------------------------------

/** Default limits for the AI generation endpoints. */
export const AI_GENERATE_RULES = {
  perUser: { limit: 8, windowMs: 60_000 } satisfies RateLimitRule,
  perMasjid: { limit: 40, windowMs: 60_000 } satisfies RateLimitRule,
};

function aiRateLimitCheck(
  feature: string,
  actor: { id: string; masjidId: string },
): RateLimitResult | null {
  const user = checkRateLimit(`ai:${feature}:user:${actor.id}`, AI_GENERATE_RULES.perUser);
  const masjid = checkRateLimit(`ai:${feature}:masjid:${actor.masjidId}`, AI_GENERATE_RULES.perMasjid);
  return !user.ok ? user : !masjid.ok ? masjid : null;
}

/**
 * Enforce per-user AND per-masjid limits for a generation API route. Returns a
 * 429 Response when either is exceeded, or null when the request may proceed.
 */
export function enforceAiRateLimit(
  feature: string,
  actor: { id: string; masjidId: string },
): Response | null {
  const blocked = aiRateLimitCheck(feature, actor);
  if (!blocked) return null;
  const retryAfter = Math.ceil(blocked.retryAfterMs / 1000);
  return Response.json(
    { error: "rate limit exceeded - slow down", retryAfterSeconds: retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterMs: number) {
    super("You're doing that too fast - wait a moment and try again.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  }
}

/** Same limits as {@link enforceAiRateLimit}, for Server Actions - throws instead. */
export function assertAiRateLimit(
  feature: string,
  actor: { id: string; masjidId: string },
): void {
  const blocked = aiRateLimitCheck(feature, actor);
  if (blocked) throw new RateLimitError(blocked.retryAfterMs);
}
