import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";


const BASELINE = process.env.MUTATE_AGAINST ?? "origin/main";

const STRYKER = "node_modules/@stryker-mutator/core/bin/stryker.js";

const CONFIG = "stryker.config.json";

const NOTHING = 0;

const A_SOURCE_FILE = /^src\/.*\.ts$/;

const A_TEST_FILE = /\.(spec|stub)\.ts$/;

const AN_EXCLUSION = "!";

const gitLines = (...args: readonly string[]): readonly string[] =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > NOTHING);

const changedFiles = (): readonly string[] => [
  ...gitLines("diff", "--name-only", BASELINE),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
];

const mutableChanges = (): readonly string[] => [
  ...new Set(
    changedFiles().filter((file) => A_SOURCE_FILE.test(file) && !A_TEST_FILE.test(file))
  ),
];

const exclusions = (): readonly string[] =>
  (JSON.parse(readFileSync(CONFIG, "utf8")) as { mutate: readonly string[] }).mutate.filter(
    (pattern) => pattern.startsWith(AN_EXCLUSION)
  );

const run = (): number => {
  const files = mutableChanges();

  if (files.length === NOTHING) {
    console.log(`no mutable source changed against ${BASELINE} — nothing to mutate`);

    return NOTHING;
  }

  console.log(`mutating ${String(files.length)} changed file(s):`);
  for (const file of files) {
    console.log(`  ${file}`);
  }

  const stryker = spawnSync(
    process.execPath,
    [STRYKER, "run", "--mutate", [...files, ...exclusions()].join(",")],
    { stdio: "inherit" }
  );

  return stryker.status ?? NOTHING;
};

process.exit(run());
