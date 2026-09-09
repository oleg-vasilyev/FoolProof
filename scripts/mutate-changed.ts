import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { FAMILIES, type Family } from "./mutation-families.ts";
import type { Say } from "./tool-verdict.ts";


export const DEFAULT_BASELINE = "origin/main";

export const THE_NAMED_FILES = "the named files";

const STRYKER = "node_modules/@stryker-mutator/core/bin/stryker.js";

const NOTHING = 0;

const KILLED = 1;

const AFTER_NODE_AND_SCRIPT = 2;

const A_TEST_FILE = /\.(spec|stub)\.ts$/;

const A_GLOBBED_FOLDER = /\*\*\/\*\.ts$/;

const AN_EXCLUSION = "!";

const A_TYPESCRIPT_FILE = ".ts";

export type Patterns = (config: string) => readonly string[];

export const patternsIn = (configText: string): readonly string[] =>
  (JSON.parse(configText) as { mutate: readonly string[] }).mutate;

export const exclusionsOf = (patterns: readonly string[]): readonly string[] =>
  patterns.filter((pattern) => pattern.startsWith(AN_EXCLUSION));

export const foldersOf = (patterns: readonly string[]): readonly string[] =>
  patterns
    .filter((pattern) => !pattern.startsWith(AN_EXCLUSION))
    .map((pattern) => pattern.replace(A_GLOBBED_FOLDER, ""));

export const held = (patterns: readonly string[], file: string): boolean =>
  file.endsWith(A_TYPESCRIPT_FILE) && foldersOf(patterns).some((folder) => file.startsWith(folder));

export const subjectsOf = (changed: readonly string[]): readonly string[] =>
  [...new Set(changed)].filter((file) => !A_TEST_FILE.test(file));

export const mutateArgument = (patterns: readonly string[], files: readonly string[]): string =>
  [...files, ...exclusionsOf(patterns)].join(",");

export interface Plan {
  readonly family: Family;
  readonly files: readonly string[];
}

export const planFor = (changed: readonly string[], patterns: Patterns): readonly Plan[] =>
  FAMILIES.map((family) => ({
    family,
    files: subjectsOf(changed).filter((file) => held(patterns(family.config), file)),
  }));

export const planLines = (plan: Plan, against: string): readonly string[] =>
  plan.files.length === NOTHING
    ? [`no ${plan.family.family} changed against ${against} — nothing to mutate there`]
    : [
        `mutating ${String(plan.files.length)} changed ${plan.family.family} file(s):`,
        ...plan.files.map((file) => `  ${file}`),
      ];

export const worstOf = (statuses: readonly number[]): number =>
  statuses.find((status) => status !== NOTHING) ?? NOTHING;

export const gitLines = (...args: readonly string[]): readonly string[] =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > NOTHING);

export const changedFiles = (baseline: string): readonly string[] => [
  ...gitLines("diff", "--name-only", baseline),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
];

export const runStryker = (plan: Plan, patterns: readonly string[]): number =>
  spawnSync(
    process.execPath,
    [STRYKER, "run", plan.family.config, "--mutate", mutateArgument(patterns, plan.files)],
    { stdio: "inherit" }
  ).status ?? KILLED;

export const strayAmong = (named: readonly string[], plans: readonly Plan[]): readonly string[] =>
  named.filter((file) => !plans.some((plan) => plan.files.includes(file)));

export const mutateChanged = (
  env: Readonly<Record<string, string | undefined>>,
  say: Say,
  named: readonly string[] = []
): number => {
  const baseline = env.MUTATE_AGAINST ?? DEFAULT_BASELINE;
  const against = named.length === NOTHING ? baseline : THE_NAMED_FILES;
  const changed = named.length === NOTHING ? changedFiles(baseline) : named;
  const patterns: Patterns = (config) => patternsIn(readFileSync(config, "utf8"));
  const plans = planFor(changed, patterns);
  const stray = strayAmong(named, plans);

  if (stray.length > NOTHING) {
    say(
      `mutate-changed: no family holds ${stray.join(", ")} — name the subject, not its spec, ` +
        "under src/ or a folder stryker.scripts.json lists"
    );

    return KILLED;
  }

  const statuses = plans.map((plan) => {
    for (const line of planLines(plan, against)) {
      say(line);
    }

    return plan.files.length === NOTHING ? NOTHING : runStryker(plan, patterns(plan.family.config));
  });

  return worstOf(statuses);
};

if (import.meta.main) {
  process.exit(mutateChanged(process.env, console.log, process.argv.slice(AFTER_NODE_AND_SCRIPT)));
}
