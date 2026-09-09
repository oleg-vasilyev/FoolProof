import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { WriteStream } from "node:fs";
import {
  BATTERIES,
  describeStep,
  isBattery,
  isGate,
  stepsFor,
  type Step,
} from "./gate-list.ts";
import type { Battery, Gate } from "./gate-names.ts";
import { BATTERY_PATH, GATES_DIR, PARAGRAPH_PATH, logPathOf, verdictPathOf } from "./gate-paths.ts";
import { numbersFor, outputsOf, scopeOf, type MutationScope } from "./gate-numbers.ts";
import { FAILED, PASSED, lineFor, verdictOf, type GateVerdict, type RanVerdict } from "./gate-verdict.ts";
import { gatesParagraph, reasonLines } from "./gate-summary.ts";


const JSON_INDENT = 2;

const MUTATE_AGAINST = "MUTATE_AGAINST";

const NO_COLOR = "NO_COLOR";

const AFTER_NODE_AND_SCRIPT = 2;

const NO_ARGUMENTS = 0;

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

export const childEnvironment = (
  env: Readonly<Record<string, string | undefined>>,
  mutateAgainst: string | undefined
): Readonly<Record<string, string | undefined>> => ({
  ...env,
  [NO_COLOR]: "1",
  ...(mutateAgainst === undefined ? {} : { [MUTATE_AGAINST]: mutateAgainst }),
});

export const writeVerdict = (verdict: GateVerdict, named = false): void => {
  writeFileSync(verdictPathOf(verdict.gate, named), JSON.stringify(verdict, null, JSON_INDENT));
};

export const forgetVerdicts = (gates: readonly Gate[]): void => {
  for (const gate of gates) {
    rmSync(verdictPathOf(gate), { force: true });
  }
};

export const verdictsOnDisk = (battery: Battery): readonly GateVerdict[] =>
  BATTERIES[battery].flatMap((gate) => {
    const verdict = parseOrNull<GateVerdict>(readOrNull(verdictPathOf(gate)));

    return verdict === null ? [] : [verdict];
  });

export const batteryOnDisk = (): Battery | null => {
  const named = readOrNull(BATTERY_PATH)?.trim();

  return isBattery(named) ? named : null;
};

export const rewriteParagraph = (): void => {
  const battery = batteryOnDisk();

  if (battery === null) {
    return;
  }

  writeFileSync(PARAGRAPH_PATH, `${gatesParagraph(verdictsOnDisk(battery), battery)}\n`);
};

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

export const runGate = async (
  gate: Gate,
  mutateAgainst: string | undefined,
  steps: readonly Step[],
  args: readonly string[] = []
): Promise<RanVerdict> => {
  const named = args.length > NO_ARGUMENTS;
  const scope: MutationScope = scopeOf(gate, mutateAgainst, args);
  const startedAt = new Date();

  for (const path of outputsOf(gate)) {
    rmSync(path, { force: true });
  }

  mkdirSync(GATES_DIR, { recursive: true });

  const capture: Capture = {
    log: createWriteStream(logPathOf(gate, named)),
    chunks: [],
    env: childEnvironment(process.env, mutateAgainst),
  };
  const code = await runSteps(steps, capture);

  capture.log.end();

  const output = linesOf(capture.chunks);
  const verdict = verdictOf(
    gate,
    named,
    code,
    startedAt,
    new Date(),
    numbersFor(gate, scope, readOrNull, output),
    output
  );

  writeVerdict(verdict, named);

  if (!named) {
    rewriteParagraph();
  }

  return verdict;
};

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

  return verdict.exitCode;
};

if (import.meta.main) {
  process.exit(await main(process.argv, process.env, console.log, process.cwd()));
}
