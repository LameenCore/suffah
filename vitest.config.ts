import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Pure-function unit tests for the core loop (T55). No DOM, no DB - these cover
// grading, the compliance-status engine, and ledger aggregation. DB-bound
// helpers are covered by scripts/check-integrity.ts + the live e2e verification;
// a real integration harness is T54.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      // Report against the app logic in lib/, not scaffolding.
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/**/index.ts", // barrel re-exports
        "lib/env.ts",
        "lib/types.ts", // type + constant declarations only
        "lib/ai/fallback-*.ts", // hand-authored static content
        "lib/db/client.ts",
        "lib/db/server.ts", // Supabase client factories
      ],
    },
  },
});
