import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { VITEST } from "../shared/tool-binaries.ts";
import { E2E_CONFIG, E2E_SELECTION, RESULTS, inRun } from "../shared/gate-paths.ts";
import { selectionFor, type E2eSelection } from "./e2e-selection.ts";
import { say } from "../shared/say.ts";
import { folderArgumentOf } from "../runs/run-folders.ts";


const BASELINE = process.env.E2E_AGAINST ?? "origin/main";

const NOTHING = 0;

const PASSED = 0;

const FAILED = 1;

const JSON_INDENT = 2;

const AFTER_NODE_AND_SCRIPT = 2;

const gitLines = (...args: readonly string[]): readonly string[] =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > NOTHING);

const changedFiles = (): readonly string[] => [
  ...gitLines("diff", "--name-only", BASELINE),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
];

const record = (selection: E2eSelection, folder: string): void => {
  mkdirSync(folder, { recursive: true });
  writeFileSync(inRun(folder, E2E_SELECTION), JSON.stringify(selection, null, JSON_INDENT));
};

const play = (selection: E2eSelection, folder: string): number => {
  record(selection, folder);

  if (selection.kind === "nothing") {
    return PASSED;
  }

  const run = spawnSync(
    process.execPath,
    [
      VITEST,
      "run",
      "--config",
      E2E_CONFIG,
      `--outputFile.json=${inRun(folder, RESULTS)}`,
      ...(selection.kind === "scenarios" ? selection.files : []),
    ],
    { stdio: "inherit" }
  );

  return run.status ?? FAILED;
};

if (import.meta.main) {
  const argument = folderArgumentOf("e2e-changed", process.argv.slice(AFTER_NODE_AND_SCRIPT));

  if (!argument.ok) {
    say(argument.notice);
    process.exit(FAILED);
  }

  process.exit(play(selectionFor(changedFiles()), argument.folder));
}
