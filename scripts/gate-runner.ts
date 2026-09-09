import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { BATTERIES, commandFor, isBattery, isGate, type Battery, type Gate } from "./gate-list.ts";
import { BATTERY_PATH, GATES_DIR, PARAGRAPH_PATH, logPathOf, verdictPathOf } from "./gate-paths.ts";
import { numbersFor, outputsOf, scopeOf, type MutationScope } from "./gate-numbers.ts";
import { FAILED, lineFor, verdictOf, type GateVerdict, type RanVerdict } from "./gate-verdict.ts";
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

export const runGate = (
  gate: Gate,
  mutateAgainst: string | undefined,
  args: readonly string[] = []
): Promise<RanVerdict> =>
  new Promise((resolve) => {
    const named = args.length > NO_ARGUMENTS;
    const scope: MutationScope = scopeOf(gate, mutateAgainst, args);
    const startedAt = new Date();
    const chunks: string[] = [];
    let settled = false;

    for (const path of outputsOf(gate)) {
      rmSync(path, { force: true });
    }

    mkdirSync(GATES_DIR, { recursive: true });
    const log = createWriteStream(logPathOf(gate, named));

    const child = spawn(commandFor(gate, args), {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: childEnvironment(process.env, mutateAgainst),
    });

    const keep = (text: string): void => {
      chunks.push(text);
      log.write(text);
    };

    const settle = (code: number): void => {
      if (settled) {
        return;
      }

      settled = true;
      log.end();
      const verdict = verdictOf(
        gate,
        named,
        code,
        startedAt,
        new Date(),
        numbersFor(gate, scope, readOrNull),
        linesOf(chunks)
      );

      writeVerdict(verdict, named);

      if (!named) {
        rewriteParagraph();
      }

      resolve(verdict);
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", keep);
    child.stderr.on("data", keep);
    child.on("error", (error) => {
      keep(`gate-runner: could not run ${commandFor(gate, args)}: ${String(error)}\n`);
      settle(FAILED);
    });
    child.on("close", (code) => {
      settle(code ?? FAILED);
    });
  });

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

  const verdict = await runGate(gate, env[MUTATE_AGAINST], args);

  for (const line of [lineFor(verdict), ...reasonLines(verdict, root)]) {
    say(line);
  }

  return verdict.exitCode;
};

if (import.meta.main) {
  process.exit(await main(process.argv, process.env, console.log, process.cwd()));
}
