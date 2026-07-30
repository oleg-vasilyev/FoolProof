import { defineConfig } from "vitest/config";

// Only shared/repository/repository-instance.ts is excluded: it is a one-line
// binding of the contract to its implementation, with no behaviour to assert.
// src/main.ts IS covered — main.spec.ts mocks its dependencies so that importing
// the entry file wires everything up without opening a polling connection.
// Every artefact a check produces goes under reports/, which is gitignored whole.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "reports/coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.stub.ts",
        "src/shared/repository/repository-instance.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
