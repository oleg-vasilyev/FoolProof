import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { BATTERIES, isBattery } from "../shared/gate-list.ts";
import type { Battery, Gate } from "../shared/gate-names.ts";
import { BATTERY_PATH, PARAGRAPH_PATH, VERDICT_FILE, inRun, runFolderOf, runsFolderOf } from "../shared/gate-paths.ts";
import type { GateVerdict, RanVerdict, SkippedVerdict } from "../verdict/gate-verdict.ts";
import { gatesParagraph, paragraphFileOf, stampLineOf } from "../verdict/gate-summary.ts";
import { leftoverRuns, type RunEntry } from "./run-folders.ts";
import { isAlive } from "./run-lock.ts";


const JSON_INDENT = 2;

export interface BatteryOnDisk {
  readonly battery: Battery;
  readonly startedAt: string;
}

export const readOrNull = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

const parseOrNull = <T>(text: string | null): T | null => {
  if (text === null) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

const entriesOf = (folder: string): readonly string[] => {
  try {
    return readdirSync(folder);
  } catch {
    return [];
  }
};

export const writeVerdict = (verdict: RanVerdict | SkippedVerdict): void => {
  writeFileSync(inRun(verdict.folder, VERDICT_FILE), JSON.stringify(verdict, null, JSON_INDENT));
};

const verdictIn = (folder: string): GateVerdict | null =>
  parseOrNull<GateVerdict>(readOrNull(inRun(folder, VERDICT_FILE)));

const isBare = (verdict: GateVerdict): boolean => verdict.kind !== "ran" || !verdict.named;

export const newestBareVerdict = (gate: Gate, since: string): GateVerdict | null => {
  const newestFirst = [...entriesOf(runsFolderOf(gate))].sort().reverse();

  for (const id of newestFirst) {
    const verdict = verdictIn(runFolderOf(gate, id));

    if (verdict !== null && isBare(verdict) && verdict.startedAt >= since) {
      return verdict;
    }
  }

  return null;
};

export const batteryOnDisk = (): BatteryOnDisk | null => {
  const record = parseOrNull<Partial<BatteryOnDisk>>(readOrNull(BATTERY_PATH));

  return record !== null && isBattery(record.battery) && typeof record.startedAt === "string"
    ? { battery: record.battery, startedAt: record.startedAt }
    : null;
};

export const verdictsOnDisk = (onDisk: BatteryOnDisk): readonly GateVerdict[] =>
  BATTERIES[onDisk.battery].flatMap((gate) => {
    const verdict = newestBareVerdict(gate, onDisk.startedAt);

    return verdict === null ? [] : [verdict];
  });

export const rewriteParagraph = (): void => {
  const onDisk = batteryOnDisk();

  if (onDisk === null) {
    return;
  }

  const paragraph = gatesParagraph(verdictsOnDisk(onDisk), onDisk.battery);
  const stamp = stampLineOf(readOrNull(PARAGRAPH_PATH));

  writeFileSync(
    PARAGRAPH_PATH,
    stamp === null ? paragraphFileOf(onDisk.battery, null, new Date(), paragraph) : `${stamp}\n${paragraph}\n`
  );
};

export const tidyRunsOf = (gate: Gate, now: Date): void => {
  const runs: readonly RunEntry[] = entriesOf(runsFolderOf(gate)).map((id) => {
    const verdict = verdictIn(runFolderOf(gate, id));

    return { id, finished: verdict === null ? null : { named: !isBare(verdict) } };
  });

  for (const id of leftoverRuns(runs, now, isAlive)) {
    rmSync(runFolderOf(gate, id), { recursive: true, force: true });
  }
};
