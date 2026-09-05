import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Pure-function unit tests for the core loop (T55). No DOM, no DB - these cover
// grading, the compliance-status engine, and ledger aggregation.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
