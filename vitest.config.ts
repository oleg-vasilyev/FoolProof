import { defineConfig } from "vitest/config";

// Only shared/repository/index.ts is excluded: it is a one-line binding of the
// interface to its implementation, with no behaviour to assert.
// src/main.ts IS covered — bot.spec.ts mocks its dependencies so that importing
// the entry file wires everything up without opening a polling connection.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/**/*.stub.ts", "src/shared/repository/index.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
