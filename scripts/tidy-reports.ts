import { readFileSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";


export const REPORTS_DIR = "reports";

export const OWNER_FILES: readonly string[] = [
  "vitest.config.ts",
  "stryker.config.json",
  "stryker.scripts.json",
  "scripts/drawn-into.ts",
  ".claude/agents/deep-checkup.md",
];

const REPORTS_ENTRY = /reports\/([A-Za-z0-9._-]+)/g;

const NAMES_NOTHING = 0;

export const namedIn = (text: string): readonly string[] =>
  [...text.matchAll(REPORTS_ENTRY)].flatMap(([, entry]) => (entry === undefined ? [] : [entry]));

export const strayIn = (
  entries: readonly string[],
  owned: readonly string[]
): readonly string[] => entries.filter((entry) => !owned.includes(entry));

export const ownedOrRefuse = (file: string, named: readonly string[]): readonly string[] => {
  if (named.length === NAMES_NOTHING) {
    throw new Error(
      `${file} names no ${REPORTS_DIR}/ entry any more — tidy-reports would delete what it writes, ` +
        "so fix the path here before running it again"
    );
  }

  return named;
};

const ownedBy = (file: string): readonly string[] =>
  ownedOrRefuse(file, namedIn(readFileSync(resolve(rootDir, file), "utf8")));

export const tidyReports = (): void => {
  const owned = [...new Set(OWNER_FILES.flatMap(ownedBy))];
  const directory = resolve(rootDir, REPORTS_DIR);
  const stray = strayIn(readdirSync(directory), owned);

  for (const entry of stray) {
    rmSync(resolve(directory, entry), { recursive: true, force: true });
    console.log(`removed ${REPORTS_DIR}/${entry}`);
  }

  console.log(`${REPORTS_DIR}/: ${String(stray.length)} removed, ${String(owned.length)} owned`);
};
