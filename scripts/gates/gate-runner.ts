import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import type { WriteStream } from "node:fs";
import { COMMANDS, describeStep, isGate, rerunCommandFor, stepsFor, type Step } from "./shared/gate-list.ts";
import type { Gate } from "./shared/gate-names.ts";
import { LOG_FILE, inRun, lockPathOf, runFolderOf } from "./shared/gate-paths.ts";
import { say } from "./shared/say.ts";
import { runIdOf } from "./runs/run-folders.ts";
import { isAlive, takeLock, type TakenLock } from "./runs/run-lock.ts";
import { refusalOf } from "./runs/lock-refusal.ts";
import { readOrNull, rewriteParagraph, tidyRunsOf, writeVerdict } from "./runs/runs-on-disk.ts";
import { numbersFor, scopeOf, type MutationScope } from "./verdict/gate-numbers.ts";
import { FAILED, PASSED, lineFor, refusedVerdict, verdictOf, type GateVerdict, type RanVerdict } from "./verdict/gate-verdict.ts";
import { reasonLines } from "./verdict/gate-summary.ts";


const MUTATE_AGAINST = "MUTATE_AGAINST";

const NO_COLOR = "NO_COLOR";

const AFTER_NODE_AND_SCRIPT = 2;

const NO_ARGUMENTS = 0;

const NODE_OPTIONS = "NODE_OPTIONS";

export const WITHOUT_EXPERIMENT_WARNINGS = "--disable-warning=ExperimentalWarning";

export const childEnvironment = (
  env: Readonly<Record<string, string | undefined>>,
  mutateAgainst: string | undefined
): Readonly<Record<string, string | undefined>> => ({
  ...env,
  [NO_COLOR]: "1",
  [NODE_OPTIONS]: [env[NODE_OPTIONS], WITHOUT_EXPERIMENT_WARNINGS].filter(Boolean).join(" "),
  ...(mutateAgainst === undefined ? {} : { [MUTATE_AGAINST]: mutateAgainst }),
});

const linesOf = (chunks: readonly string[]): readonly string[] => chunks.join("").split(/\r?\n/);

interface Capture {
  readonly log: WriteStream;
  readonly chunks: string[];
  readonly env: Readonly<Record<string, string | undefined>>;
}

const keepIn = (capture: Capture, text: string): void => {
  capture.chunks.push(text);
  capture.log.write(text);
};

export const runStep = (step: Step, capture: Capture): Promise<number> =>
  new Promise((resolve) => {
    let settled = false;

    const settle = (code: number): void => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(code);
    };

    keepIn(capture, `$ ${describeStep(step)}\n`);

    const child = spawn(process.execPath, [step.bin, ...step.args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: capture.env,
    });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (text: string) => {
      keepIn(capture, text);
    });
    child.stderr.on("data", (text: string) => {
      keepIn(capture, text);
    });
    child.on("error", (error) => {
      keepIn(capture, `gate-runner: could not run ${describeStep(step)}: ${String(error)}\n`);
      settle(FAILED);
    });
    child.on("close", (code) => {
      settle(code ?? FAILED);
    });
  });

export const runSteps = async (steps: readonly Step[], capture: Capture): Promise<number> => {
  for (const step of steps) {
    const code = await runStep(step, capture);

    if (code !== PASSED) {
      return code;
    }
  }

  return PASSED;
};

const released = (): void => undefined;

export type Held =
  | Extract<TakenLock, { readonly ok: true }>
  | { readonly ok: false; readonly notice: string };

export const holdFor = (
  gate: Gate,
  folder: string,
  args: readonly string[],
  startedAt: Date
): Held => {
  const lock = COMMANDS[gate].holds;

  if (lock === null) {
    return { ok: true, release: released };
  }

  const rerun = rerunCommandFor(gate, args);
  const taken = takeLock(
    lockPathOf(lock),
    { pid: process.pid, command: rerun, startedAt: startedAt.toISOString(), folder },
    isAlive
  );

  return taken.ok ? taken : { ok: false, notice: refusalOf(lock, taken.holder, rerun) };
};

const runInFolder = async (
  gate: Gate,
  mutateAgainst: string | undefined,
  steps: (folder: string) => readonly Step[],
  args: readonly string[],
  startedAt: Date,
  folder: string
): Promise<RanVerdict> => {
  const named = args.length > NO_ARGUMENTS;
  const scope: MutationScope = scopeOf(gate, mutateAgainst, args);

  tidyRunsOf(gate, startedAt);
  mkdirSync(folder, { recursive: true });

  const capture: Capture = {
    log: createWriteStream(inRun(folder, LOG_FILE)),
    chunks: [],
    env: childEnvironment(process.env, mutateAgainst),
  };
  const code = await runSteps(steps(folder), capture);

  capture.log.end();

  const verdict = verdictOf(
    { gate, named, folder },
    code,
    startedAt,
    new Date(),
    numbersFor(gate, scope, readOrNull, folder),
    linesOf(capture.chunks)
  );

  writeVerdict(verdict);

  if (!named) {
    rewriteParagraph();
  }

  return verdict;
};

export const runGate = async (
  gate: Gate,
  mutateAgainst: string | undefined,
  steps: (folder: string) => readonly Step[],
  args: readonly string[] = []
): Promise<GateVerdict> => {
  const startedAt = new Date();
  const folder = runFolderOf(gate, runIdOf(startedAt, process.pid));
  const held = holdFor(gate, folder, args, startedAt);

  if (!held.ok) {
    return refusedVerdict(gate, held.notice, startedAt);
  }

  try {
    return await runInFolder(gate, mutateAgainst, steps, args, startedAt, folder);
  } finally {
    held.release();
  }
};

export const exitCodeOf = (verdict: GateVerdict): number => (verdict.kind === "ran" ? verdict.exitCode : FAILED);

export const main = async (
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
  say: (line: string) => void,
  root: string
): Promise<number> => {
  const [gate, ...args] = argv.slice(AFTER_NODE_AND_SCRIPT);

  if (!isGate(gate)) {
    say(`gate-runner: "${gate ?? ""}" is not a gate this runner knows`);

    return FAILED;
  }

  const steps = stepsFor(gate, args);

  if (!steps.ok) {
    say(steps.notice);

    return FAILED;
  }

  const verdict = await runGate(gate, env[MUTATE_AGAINST], steps.steps, args);

  for (const line of [lineFor(verdict), ...reasonLines(verdict, root)]) {
    say(line);
  }

  return exitCodeOf(verdict);
};

if (import.meta.main) {
  process.exit(await main(process.argv, process.env, say, process.cwd()));
}
