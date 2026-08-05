import { resolve } from "node:path";
import { defineConfig } from "vitest/config";


// The harness has pure parts of its own — a chat log, a cache, a port table — and
// they had no tests because there was nowhere to put them: `npm test` must not see
// `e2e/`, and the scenario config starts a bot process for every file it loads.
// This third configuration runs those units and nothing else, with no world behind
// them.
export default defineConfig({
  test: {
    include: ["e2e/**/*.spec.ts"],
    exclude: ["e2e/**/*.e2e.spec.ts"],
    root: resolve(import.meta.dirname, ".."),
    environment: "node",
    reporters: ["default"],
  },
});
