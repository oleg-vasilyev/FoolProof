import { defineConfig } from "vitest/config";

// Coverage excludes the two files that exist only to wire things together.
// src/bot.ts cannot be imported by a test at all: its last statement is
// `await bot.start()`, so importing it would open a long polling connection.
// That is a reason to keep logic OUT of it, not a licence to hide logic there —
// the shutdown sequence it used to own now lives in features/bot/lifecycle.ts
// and is tested. What remains is a list of calls to already-tested functions.
// shared/repository/index.ts is a one-line binding.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/**/*.stub.ts", "src/bot.ts", "src/shared/repository/index.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
