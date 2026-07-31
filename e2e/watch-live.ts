import { spawn } from "node:child_process";
import { resolve } from "node:path";


const PACE_MS = "600";

const VITEST = resolve(import.meta.dirname, "..", "node_modules", "vitest", "vitest.mjs");

const CONFIG = resolve(import.meta.dirname, "vitest.e2e.config.ts");

const CRASHED = 1;

const run = spawn(process.execPath, [VITEST, "run", "--config", CONFIG], {
  stdio: "inherit",
  env: { ...process.env, E2E_PACE_MS: PACE_MS, E2E_OPEN: "1" },
});

run.once("exit", (code) => {
  process.exit(code ?? CRASHED);
});
