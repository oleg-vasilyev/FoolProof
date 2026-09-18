import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { VITEST } from "../shared/tool-binaries.ts";
import { E2E_CONFIG, E2E_SELECTION } from "../shared/gate-paths.ts";
import { selectionFor, type E2eSelection } from "./e2e-selection.ts";


const BASELINE = process.env.E2E_AGAINST ?? "origin/main";

const NOTHING = 0;

const PASSED = 0;

const FAILED = 1;

const JSON_INDENT = 2;

const gitLines = (...args: readonly string[]): readonly string[] =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > NOTHING);

const changedFiles = (): readonly string[] => [
  ...gitLines("diff", "--name-only", BASELINE),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
];

const record = (selection: E2eSelection): void => {
  mkdirSync(dirname(E2E_SELECTION), { recursive: true });
  writeFileSync(E2E_SELECTION, JSON.stringify(selection, null, JSON_INDENT));
};

const play = (selection: E2eSelection): number => {
  record(selection);

  if (selection.kind === "nothing") {
    return PASSED;
  }

  const run = spawnSync(
    process.execPath,
    [VITEST, "run", "--config", E2E_CONFIG, ...(selection.kind === "scenarios" ? selection.files : [])],
    { stdio: "inherit" }
  );

  return run.status ?? FAILED;
};

if (import.meta.main) {
  process.exit(play(selectionFor(changedFiles())));
}
