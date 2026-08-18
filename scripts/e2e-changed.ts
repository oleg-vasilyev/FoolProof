import { execFileSync, spawnSync } from "node:child_process";


const BASELINE = process.env.E2E_AGAINST ?? "origin/main";

const VITEST = "node_modules/vitest/vitest.mjs";

const NOTHING = 0;

const FEATURE = /^src\/features\/([^/]+)\//;

const EVERYTHING = /^(src\/(shared|main|supervisor|feature-installer)|e2e\/(harness|hub|fake-telegram|pages|bot-process|scratch-database|world-ports))/;

const SCENARIO_DIR = "e2e/scenarios";

const A_SCENARIO = /^e2e\/scenarios\/.*\.e2e\.spec\.ts$/;

const SCENARIOS_OF: Record<string, readonly string[]> = {
  "live-game": [
    "whole-game",
    "refusing-a-lineup",
    "asking-for-names",
    "changing-the-table",
    "surviving-trouble",
    "edge/hostile-names",
    "edge/a-table-too-big",
  ],
  "merge-names": ["merging-two-names"],
  scoresheet: ["the-stats-picture", "the-pictures-in-russian", "a-players-own-card"],
  diagnostics: ["the-status-report"],
  language: ["picking-a-language", "the-pictures-in-russian"],
};

const gitLines = (...args: readonly string[]): readonly string[] =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > NOTHING);

const changedFiles = (): readonly string[] => [
  ...gitLines("diff", "--name-only", BASELINE),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
];

const scenariosFor = (changed: readonly string[]): readonly string[] | null => {
  const wanted = new Set<string>();

  for (const file of changed) {
    if (EVERYTHING.test(file)) {
      return null;
    }

    if (A_SCENARIO.test(file)) {
      wanted.add(file);
      continue;
    }

    const feature = FEATURE.exec(file)?.[1];
    const known = feature === undefined ? undefined : SCENARIOS_OF[feature];

    if (feature !== undefined && known === undefined) {
      return null;
    }

    for (const scenario of known ?? []) {
      wanted.add(`${SCENARIO_DIR}/${scenario}.e2e.spec.ts`);
    }
  }

  return [...wanted];
};

const play = (files: readonly string[] | null): number => {
  if (files !== null && files.length === NOTHING) {
    console.log(`nothing a scenario covers changed against ${BASELINE} — nothing to play`);

    return NOTHING;
  }

  console.log(files === null ? "playing every scenario" : `playing ${String(files.length)}:`);
  for (const file of files ?? []) {
    console.log(`  ${file}`);
  }

  const run = spawnSync(
    process.execPath,
    [VITEST, "run", "--config", "e2e/vitest.e2e.config.ts", ...(files ?? [])],
    { stdio: "inherit" }
  );

  return run.status ?? NOTHING;
};

process.exit(play(scenariosFor(changedFiles())));
