import { resolve } from "node:path";
import { defineConfig } from "vitest/config";


// The e2e run is deliberately a separate configuration from vitest.config.ts:
// these specs start a real bot process and a real database, so they must never
// be picked up by `npm test`, by coverage, or by Stryker. The only overlap is
// the runner itself, which the project already depends on.
//
// One world per worker: each worker owns a port, a bot process and a database
// file, so files can run at the same time and each has a browser tab of its own.
// Inside a file the cases share one chat and run in order, which is what makes a
// scenario a scenario.
//
// `isolate: false` is load-bearing rather than a speed tweak. With isolation the
// module registry is rebuilt per file, so the world — and its listening port —
// would be built again for every scenario: the chat would lose its history and
// two consecutive files would race for the same port. Isolation between scenarios
// comes from wiping the database and restarting the bot, not from the runner.
const TIMEOUT_MS = 60000;

const MOST_ACTIONS_IN_A_CASE = 40;

const NO_PACE = 0;

// Watching a run adds a pause after every action, so a case that fits easily at
// full speed would otherwise hit the timeout at watching speed.
const caseTimeoutMs =
  TIMEOUT_MS + Number(process.env.E2E_PACE_MS ?? String(NO_PACE)) * MOST_ACTIONS_IN_A_CASE;

export default defineConfig({
  test: {
    include: ["e2e/**/*.e2e.spec.ts"],
    root: resolve(import.meta.dirname, ".."),
    environment: "node",
    globalSetup: ["e2e/harness/watch-hub.ts"],
    fileParallelism: true,
    maxWorkers: 4,
    isolate: false,
    sequence: { concurrent: false },
    testTimeout: caseTimeoutMs,
    hookTimeout: caseTimeoutMs,
    reporters: ["verbose"],
  },
});
