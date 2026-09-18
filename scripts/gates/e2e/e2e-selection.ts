const NOTHING = 0;

const FIRST_GROUP = 1;

const FEATURE = /^src\/features\/([^/]+)\//;

const EVERYTHING = /^(src\/(shared|main|supervisor|feature-installer)|e2e\/(harness|hub|fake-telegram|pages|bot-process|bot-log|scratch-database|world-ports)|scripts\/gates\/e2e\/)/;

const SCENARIO_DIR = "e2e/scenarios";

const A_SCENARIO = /^e2e\/scenarios\/.*\.e2e\.spec\.ts$/;

const SCENARIOS_OF: Record<string, readonly string[]> = {
  "live-game": [
    "whole-game",
    "refusing-a-lineup",
    "asking-for-names",
    "changing-the-table",
    "surviving-trouble",
    "reopening-the-last-game",
    "edge/hostile-names",
    "edge/a-table-too-big",
  ],
  "merge-names": ["merging-two-names", "the-status-report"],
  "replace-names": ["replacing-a-name-for-the-evening", "the-status-report"],
  scoresheet: ["the-stats-picture", "the-pictures-in-russian", "a-players-own-card"],
  diagnostics: ["the-status-report"],
  language: ["picking-a-language", "the-pictures-in-russian"],
};

export type E2eSelection =
  | { readonly kind: "everything" }
  | { readonly kind: "nothing" }
  | { readonly kind: "scenarios"; readonly files: readonly string[] };

const EVERY_SCENARIO: E2eSelection = { kind: "everything" };

const NO_SCENARIO: E2eSelection = { kind: "nothing" };

export const selectionFor = (changed: readonly string[]): E2eSelection => {
  const wanted = new Set<string>();

  for (const file of changed) {
    if (EVERYTHING.test(file)) {
      return EVERY_SCENARIO;
    }

    if (A_SCENARIO.test(file)) {
      wanted.add(file);
      continue;
    }

    const feature = FEATURE.exec(file)?.[FIRST_GROUP];
    const known = feature === undefined ? undefined : SCENARIOS_OF[feature];

    if (feature !== undefined && known === undefined) {
      return EVERY_SCENARIO;
    }

    for (const scenario of known ?? []) {
      wanted.add(`${SCENARIO_DIR}/${scenario}.e2e.spec.ts`);
    }
  }

  return wanted.size === NOTHING ? NO_SCENARIO : { kind: "scenarios", files: [...wanted] };
};

const everyEntryIsAString = (files: unknown): files is readonly string[] =>
  Array.isArray(files) && files.every((file) => typeof file === "string");

export const selectionIn = (json: string): E2eSelection | null => {
  let written: unknown;

  try {
    written = JSON.parse(json);
  } catch {
    return null;
  }

  const { kind, files } = (written ?? {}) as { kind?: unknown; files?: unknown };

  if (kind === "everything" || kind === "nothing") {
    return { kind };
  }

  return kind === "scenarios" && everyEntryIsAString(files) ? { kind, files } : null;
};
