import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { STRYKER } from "../shared/tool-binaries.ts";
import { inRun } from "../shared/gate-paths.ts";
import type { Family } from "./mutation-families.ts";


const KILLED = 1;

const JSON_INDENT = 2;

const GREEN = 0;

export const worstOf = (statuses: readonly number[]): number =>
  statuses.find((status) => status !== GREEN) ?? GREEN;

export const derivedConfigPathOf = (folder: string, family: Family): string =>
  inRun(folder, `stryker-${family.family}.json`);

export const derivedConfig = (configText: string, family: Family, folder: string): string =>
  JSON.stringify(
    {
      ...(JSON.parse(configText) as Record<string, unknown>),
      tempDirName: inRun(folder, `stryker-${family.family}-tmp`),
      jsonReporter: { fileName: inRun(folder, family.report) },
      htmlReporter: { fileName: inRun(folder, `mutation-${family.family}.html`) },
    },
    null,
    JSON_INDENT
  );

export const runStryker = (family: Family, folder: string, extra: readonly string[]): number => {
  const config = derivedConfigPathOf(folder, family);

  mkdirSync(folder, { recursive: true });
  writeFileSync(config, derivedConfig(readFileSync(family.config, "utf8"), family, folder));

  return spawnSync(process.execPath, [STRYKER, "run", config, ...extra], { stdio: "inherit" }).status ?? KILLED;
};
