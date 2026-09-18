import { ESLINT, STRYKER, TSC, VITEST } from "./tool-binaries.ts";
import {
  E2E_CONFIG,
  ESLINT_CONFIG,
  HARNESS_CONFIG,
  LINT_FINDINGS,
  SOURCE_STRYKER_CONFIG,
  TOOLING_STRYKER_CONFIG,
  VITEST_CONFIG,
} from "./gate-paths.ts";
import { BATTERY, GATE, type Battery, type Gate } from "./gate-names.ts";


export const THE_CHECK_GATES = [GATE.lint, GATE.typecheck, GATE.checkDocs, GATE.coverage] as const;

export const THE_PUSH_GATES = [
  GATE.lint,
  GATE.typecheck,
  GATE.e2eTypecheck,
  GATE.harness,
  GATE.checkDocs,
] as const;

export const THE_PHASE_GATES = [
  GATE.lint,
  GATE.typecheck,
  GATE.coverage,
  GATE.mutationChanged,
  GATE.e2eChanged,
] as const;

export const THE_RELEASE_GATES = [
  ...THE_PUSH_GATES,
  GATE.coverage,
  GATE.mutationChanged,
  GATE.e2e,
] as const;

export const THE_SINGLE_GATES = [GATE.test] as const;

export const THE_FULL_MUTATION = GATE.mutation;

export const ALL_GATES: readonly Gate[] = Object.values(GATE);

export const isGate = (name: string | undefined): name is Gate =>
  name !== undefined && ALL_GATES.includes(name as Gate);

export const BATTERIES: Readonly<Record<Battery, readonly Gate[]>> = {
  [BATTERY.quick]: THE_CHECK_GATES,
  [BATTERY.push]: THE_PUSH_GATES,
  [BATTERY.phase]: THE_PHASE_GATES,
  [BATTERY.release]: THE_RELEASE_GATES,
};

export const isBattery = (name: string | undefined): name is Battery =>
  name !== undefined && Object.hasOwn(BATTERIES, name);

export const STRYKER_CONFIGS = [SOURCE_STRYKER_CONFIG, TOOLING_STRYKER_CONFIG] as const;

export const LINTED_FOLDERS = ["src", "scripts", "e2e"] as const;

export interface Step {
  readonly bin: string;
  readonly args: readonly string[];
}

export interface GateCommand {
  readonly steps: readonly Step[];
  readonly takesFiles: boolean;
}

const oneStep = (bin: string, ...args: readonly string[]): GateCommand => ({
  steps: [{ bin, args }],
  takesFiles: false,
});

export const COMMANDS: Readonly<Record<Gate, GateCommand>> = {
  [GATE.lint]: oneStep(
    ESLINT,
    "--config",
    ESLINT_CONFIG,
    "--quiet",
    "--format",
    "json",
    "--output-file",
    LINT_FINDINGS,
    ...LINTED_FOLDERS
  ),
  [GATE.typecheck]: oneStep(TSC, "--noEmit", "--pretty", "false"),
  [GATE.e2eTypecheck]: {
    steps: [
      { bin: TSC, args: ["-p", "e2e", "--noEmit", "--pretty", "false"] },
      { bin: TSC, args: ["-p", "e2e/pages", "--noEmit", "--pretty", "false"] },
    ],
    takesFiles: false,
  },
  [GATE.checkDocs]: oneStep("scripts/gates/check-docs/check-docs.ts"),
  [GATE.test]: { ...oneStep(VITEST, "run", "--config", VITEST_CONFIG), takesFiles: true },
  [GATE.coverage]: oneStep(VITEST, "run", "--config", VITEST_CONFIG, "--coverage"),
  [GATE.harness]: oneStep(VITEST, "run", "--config", HARNESS_CONFIG),
  [GATE.e2e]: oneStep(VITEST, "run", "--config", E2E_CONFIG),
  [GATE.e2eChanged]: oneStep("scripts/gates/e2e/e2e-changed.ts"),
  [GATE.mutationChanged]: { ...oneStep("scripts/gates/mutation/mutate-changed.ts"), takesFiles: true },
  [GATE.mutation]: {
    steps: STRYKER_CONFIGS.map((config) => ({ bin: STRYKER, args: ["run", config] })),
    takesFiles: false,
  },
};

export type Steps =
  | { readonly ok: true; readonly steps: readonly Step[] }
  | { readonly ok: false; readonly notice: string };

const NO_FILES = 0;

const gatesTakingFiles = (): readonly Gate[] =>
  (Object.keys(COMMANDS) as Gate[]).filter((gate) => COMMANDS[gate].takesFiles);

export const stepsFor = (gate: Gate, files: readonly string[]): Steps => {
  const command = COMMANDS[gate];

  if (files.length === NO_FILES) {
    return { ok: true, steps: command.steps };
  }

  if (!command.takesFiles) {
    return {
      ok: false,
      notice: `gate-runner: ${gate} takes no files — only ${gatesTakingFiles().join(
        " and "
      )} run over the files named`,
    };
  }

  return {
    ok: true,
    steps: command.steps.map((step) => ({ bin: step.bin, args: [...step.args, ...files] })),
  };
};

export const describeStep = (step: Step): string => ["node", step.bin, ...step.args].join(" ");

export const GATE_RUNNER = "scripts/gates/gate-runner.ts";

export const rerunCommandFor = (gate: Gate): string => `node ${GATE_RUNNER} ${gate}`;
