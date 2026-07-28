import { defineConfig } from "vitest/config";

// Coverage excludes the two files that exist only to wire things together:
// src/bot.ts is the composition root (it starts long polling on import), and
// shared/repository/index.ts is a one-line binding. Neither has behaviour of
// its own to assert.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/testing/**", "src/bot.ts", "src/shared/repository/index.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
