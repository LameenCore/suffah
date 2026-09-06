// Pre-publish screening for pod-board posts (T41). Deliberately conservative and
// simple: a small profanity list + a few PII patterns. A hit holds the post for
// an adult to review — it never auto-deletes, and adults always see the original
// text. This is a safety net, not a substitute for the volunteer/admin being in
// every thread.

const PROFANITY = [
  // kept short + obvious; expand via the admin/data layer later, not here
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "piss", "crap",
  "slut", "whore", "cunt", "fag", "retard", "nigger",
];

const PII_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "email", re: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i },
  { name: "phone", re: /(?:\+?\d[\s.-]?){9,}\d/ },
  { name: "url", re: /\bhttps?:\/\/\S+/i },
  // North-American street address, loose
  { name: "address", re: /\b\d{1,5}\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}\s+(?:st|street|ave|avenue|rd|road|blvd|dr|drive|cres|crescent|way|lane|ln|ct|court)\b/i },
];

export type FlagReason = "profanity" | "pii" | null;

export interface ScreenResult {
  /** true → hold the post for adult review */
  held: boolean;
  reason: FlagReason;
  /** detail for the moderation queue, e.g. "email, phone" */
  detail: string | null;
}

export function screenPost(raw: string): ScreenResult {
  const text = raw.toLowerCase();

  const profaneHit = PROFANITY.find((w) =>
    new RegExp(`(^|[^a-z])${w}([^a-z]|$)`, "i").test(text),
  );
  if (profaneHit) {
    return { held: true, reason: "profanity", detail: "language" };
  }

  const piiHits = PII_PATTERNS.filter((p) => p.re.test(raw)).map((p) => p.name);
  if (piiHits.length > 0) {
    return { held: true, reason: "pii", detail: piiHits.join(", ") };
  }

  return { held: false, reason: null, detail: null };
}

/** Mask PII in text shown to non-adults for a held post (belt-and-suspenders). */
export function maskPii(raw: string): string {
  let out = raw;
  for (const p of PII_PATTERNS) out = out.replace(new RegExp(p.re, "gi"), "…");
  return out;
}
