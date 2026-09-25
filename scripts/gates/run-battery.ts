import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { BATTERIES, COMMANDS, isBattery } from "./shared/gate-list.ts";
import { BATTERY, GATE, LOCK, type Battery, type Gate } from "./shared/gate-names.ts";
import { BATTERY_PATH, PARAGRAPH_PATH, lockPathOf, runFolderOf } from "./shared/gate-paths.ts";
import { say } from "./shared/say.ts";
import { runIdOf } from "./runs/run-folders.ts";
import { isAlive, takeLock } from "./runs/run-lock.ts";
import { refusalOf } from "./runs/lock-refusal.ts";
import { runGate } from "./gate-runner.ts";
import { writeVerdict } from "./runs/runs-on-disk.ts";
import { FAILED, PASSED, skippedVerdict, type GateVerdict } from "./verdict/gate-verdict.ts";
import { gatesParagraph, paragraphFileOf, summaryLines } from "./verdict/gate-summary.ts";


const NOTHING = 0;

const A_RELEASE_TAG = /^v\d/;

const RELEASING: Battery = BATTERY.release;

export const THE_SUITE: Gate = GATE.coverage;

export const NEEDS_THE_SUITE: readonly Gate[] = [GATE.mutationChanged, GATE.mutation];

export type Baseline =
  | { readonly ok: true; readonly tag: string }
  | { readonly ok: false; readonly notice: string };

export const releaseBaseline = (tagsAtHead: readonly string[], previousTag: string | null): Baseline => {
  if (!tagsAtHead.some((tag) => A_RELEASE_TAG.test(tag))) {
    return {
      ok: false,
      notice:
        "check:release: HEAD carries no v* tag — the release check mutates what changed since the " +
        "previous tag, and that needs npm version to have put the new tag on HEAD first",
    };
  }

  if (previousTag === null || previousTag.length === NOTHING) {
    return { ok: false, notice: "check:release: no previous v* tag to measure the diff against" };
  }

  return { ok: true, tag: previousTag };
};

export const walkTheGates = async (
  gates: readonly Gate[],
  run: (gate: Gate) => Promise<GateVerdict>,
  skip: (gate: Gate, because: Gate) => GateVerdict
): Promise<readonly GateVerdict[]> => {
  const verdicts: GateVerdict[] = [];

  for (const gate of gates) {
    const suite = verdicts.find((verdict) => verdict.gate === THE_SUITE);
    const blocked = NEEDS_THE_SUITE.includes(gate) && suite !== undefined && !suite.ok;

    verdicts.push(blocked ? skip(gate, THE_SUITE) : await run(gate));
  }

  return verdicts;
};

export const whatToSay = (
  verdicts: readonly GateVerdict[],
  battery: Battery,
  root: string
): readonly string[] => [
  ...summaryLines(verdicts, root),
  "",
  gatesParagraph(verdicts, battery),
];

export const gitLine = (...args: readonly string[]): string | null => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};

export const baselineFromGit = (): Baseline =>
  releaseBaseline(
    (gitLine("tag", "--points-at", "HEAD") ?? "").split("\n"),
    gitLine("describe", "--tags", "--abbrev=0", "--match", "v*", "HEAD^")
  );

const skipOnDisk = (gate: Gate, because: Gate): GateVerdict => {
  const now = new Date();
  const folder = runFolderOf(gate, runIdOf(now, process.pid));
  const verdict = skippedVerdict(gate, folder, because, now);

  mkdirSync(folder, { recursive: true });
  writeVerdict(verdict);

  return verdict;
};

export const commandOf = (battery: Battery): string => `npm run ${battery}`;

const walkHolding = async (battery: Battery, mutateAgainst: string | undefined): Promise<readonly GateVerdict[]> => {
  writeFileSync(BATTERY_PATH, JSON.stringify({ battery, startedAt: new Date().toISOString() }));

  const verdicts = await walkTheGates(
    BATTERIES[battery],
    (gate) => runGate(gate, mutateAgainst, COMMANDS[gate].steps),
    skipOnDisk
  );

  writeFileSync(
    PARAGRAPH_PATH,
    paragraphFileOf(battery, gitLine("rev-parse", "HEAD"), new Date(), gatesParagraph(verdicts, battery))
  );

  return verdicts;
};

export const runBattery = async (
  argv: readonly string[],
  say: (line: string) => void,
  root: string
): Promise<number> => {
  const battery = argv.at(-1);

  if (!isBattery(battery)) {
    say(`run-battery: "${battery ?? ""}" is not a battery — one of ${Object.keys(BATTERIES).join(", ")}`);

    return FAILED;
  }

  const baseline = battery === RELEASING ? baselineFromGit() : null;

  if (baseline !== null && !baseline.ok) {
    say(baseline.notice);

    return FAILED;
  }

  const holder = {
    pid: process.pid,
    command: commandOf(battery),
    startedAt: new Date().toISOString(),
    folder: null,
  };
  const held = takeLock(lockPathOf(LOCK.battery), holder, isAlive);

  if (!held.ok) {
    say(`${battery}: refused — ${refusalOf(LOCK.battery, held.holder, commandOf(battery))}`);

    return FAILED;
  }

  const mutateAgainst = baseline?.ok === true ? baseline.tag : undefined;
  const verdicts = await walkHolding(battery, mutateAgainst).finally(held.release);

  for (const line of whatToSay(verdicts, battery, root)) {
    say(line);
  }

  return verdicts.every((verdict) => verdict.ok) ? PASSED : FAILED;
};

if (import.meta.main) {
  process.exit(await runBattery(process.argv, say, process.cwd()));
}
