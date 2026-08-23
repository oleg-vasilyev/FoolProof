import { defineConfig } from "vitest/config";

// Only shared/repository/repository-instance.ts is excluded: it is a one-line
// binding of the contract to its implementation, with no behaviour to assert.
// src/main.ts IS covered — main.spec.ts mocks its dependencies so that importing
// the entry file wires everything up without opening a polling connection.
// scripts/ is run by the suite but not measured by coverage or mutation: a dev
// utility is judged by whether its own reasoning is right, and the parts of it
// that reason — a trigger, a lane, a PNG header — are pure functions taking their
// subject as an argument, so their specs never touch the disk.
// Every artefact a check produces goes under reports/, which is gitignored whole.
// Exclusions name the file, not its folder (src/**/name.ts): a rule tied to a path
// stops matching the moment the file moves, and says nothing when it does. Unique
// basenames are a project rule, so a basename glob cannot catch a second file.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "scripts/**/*.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "reports/coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/**/*.stub.ts", "src/**/repository-instance.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
