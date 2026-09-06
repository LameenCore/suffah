/**
 * Verify the FR catalogue has every key the EN catalogue has (T59).
 *
 *   npm run check:i18n
 *
 * Exit 1 on any missing or extra key. Wire into CI alongside lint.
 */

import { en } from "@/lib/i18n/messages/en";
import { fr } from "@/lib/i18n/messages/fr";

function flatten(obj: unknown, prefix = ""): string[] {
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      flatten(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

const enKeys = new Set(flatten(en));
const frKeys = new Set(flatten(fr));

const missing = [...enKeys].filter((k) => !frKeys.has(k));
const extra = [...frKeys].filter((k) => !enKeys.has(k));

if (missing.length === 0 && extra.length === 0) {
  console.log(`i18n catalogues in sync (${enKeys.size} keys).`);
  process.exit(0);
}

if (missing.length) {
  console.error(`FR is missing ${missing.length} key(s):`);
  for (const k of missing) console.error(`  - ${k}`);
}
if (extra.length) {
  console.error(`FR has ${extra.length} key(s) not in EN:`);
  for (const k of extra) console.error(`  + ${k}`);
}
process.exit(1);
