import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";


const BASELINE = process.env.MUTATE_AGAINST ?? "origin/main";

const STRYKER = "node_modules/@stryker-mutator/core/bin/stryker.js";

const NOTHING = 0;

const A_TEST_FILE = /\.(spec|stub)\.ts$/;

const A_GLOBBED_FOLDER = /\*\*\/\*\.ts$/;

const AN_EXCLUSION = "!";

const A_TYPESCRIPT_FILE = ".ts";

interface Family {
  readonly what: string;
  readonly config: string;
}

const FAMILIES: readonly Family[] = [
  { what: "source", config: "stryker.config.json" },
  { what: "tooling", config: "stryker.scripts.json" },
];

const patternsOf = (config: string): readonly string[] =>
  (JSON.parse(readFileSync(config, "utf8")) as { mutate: readonly string[] }).mutate;

const exclusions = (config: string): readonly string[] =>
  patternsOf(config).filter((pattern) => pattern.startsWith(AN_EXCLUSION));

const foldersOf = (config: string): readonly string[] =>
  patternsOf(config)
    .filter((pattern) => !pattern.startsWith(AN_EXCLUSION))
    .map((pattern) => pattern.replace(A_GLOBBED_FOLDER, ""));

const holds = (config: string, file: string): boolean =>
  file.endsWith(A_TYPESCRIPT_FILE) &&
  foldersOf(config).some((folder) => file.startsWith(folder));

const gitLines = (...args: readonly string[]): readonly string[] =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > NOTHING);

const changedFiles = (): readonly string[] => [
  ...gitLines("diff", "--name-only", BASELINE),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
];

const mutate = (family: Family, files: readonly string[]): number => {
  console.log(`mutating ${String(files.length)} changed ${family.what} file(s):`);
  for (const file of files) {
    console.log(`  ${file}`);
  }

  const stryker = spawnSync(
    process.execPath,
    [STRYKER, "run", family.config, "--mutate", [...files, ...exclusions(family.config)].join(",")],
    { stdio: "inherit" }
  );

  return stryker.status ?? NOTHING;
};

const run = (): number => {
  const changed = [...new Set(changedFiles())].filter((file) => !A_TEST_FILE.test(file));

  const worked = FAMILIES.map((family) => {
    const files = changed.filter((file) => holds(family.config, file));

    if (files.length === NOTHING) {
      console.log(`no ${family.what} changed against ${BASELINE} — nothing to mutate there`);

      return NOTHING;
    }

    return mutate(family, files);
  });

  return worked.find((status) => status !== NOTHING) ?? NOTHING;
};

process.exit(run());
