import { ESLINT, VITEST } from "./tool-binaries.ts";
import {
  COVERAGE_FOLDER,
  E2E_CONFIG,
  ESLINT_CONFIG,
  HARNESS_CONFIG,
  LINT_FINDINGS,
  RESULTS,
  VITEST_CONFIG,
  inRun,
} from "./gate-paths.ts";
import { BATTERY, GATE, LOCK, type Battery, type Gate, type Lock } from "./gate-names.ts";


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

export const LINTED_FOLDERS = ["src", "scripts", "e2e"] as const;

export interface Step {
  readonly bin: string;
  readonly args: readonly string[];
}

export interface GateCommand {
  readonly steps: (folder: string) => readonly Step[];
  readonly takesFiles: boolean;
  readonly holds: Lock | null;
}

const oneStep = (bin: string, args: (folder: string) => readonly string[]): GateCommand => ({
  steps: (folder) => [{ bin, args: args(folder) }],
  takesFiles: false,
  holds: null,
});

const resultsInto = (folder: string): string => `--outputFile.json=${inRun(folder, RESULTS)}`;

const suiteRun = (folder: string): readonly string[] => ["run", "--config", VITEST_CONFIG, resultsInto(folder)];

export const COMMANDS: Readonly<Record<Gate, GateCommand>> = {
  [GATE.lint]: oneStep(ESLINT, (folder) => [
    "--config",
    ESLINT_CONFIG,
    "--quiet",
    "--format",
    "json",
    "--output-file",
    inRun(folder, LINT_FINDINGS),
    ...LINTED_FOLDERS,
  ]),
  [GATE.typecheck]: oneStep("scripts/gates/typecheck/typecheck.ts", (folder) => [folder]),
  [GATE.e2eTypecheck]: oneStep("scripts/gates/typecheck/e2e-typecheck.ts", (folder) => [folder]),
  [GATE.checkDocs]: oneStep("scripts/gates/check-docs/check-docs.ts", (folder) => [folder]),
  [GATE.test]: { ...oneStep(VITEST, suiteRun), takesFiles: true },
  [GATE.coverage]: oneStep(VITEST, (folder) => [
    ...suiteRun(folder),
    "--coverage",
    `--coverage.reportsDirectory=${inRun(folder, COVERAGE_FOLDER)}`,
  ]),
  [GATE.harness]: oneStep(VITEST, (folder) => ["run", "--config", HARNESS_CONFIG, resultsInto(folder)]),
  [GATE.e2e]: {
    ...oneStep(VITEST, (folder) => ["run", "--config", E2E_CONFIG, resultsInto(folder)]),
    holds: LOCK.e2eWorlds,
  },
  [GATE.e2eChanged]: { ...oneStep("scripts/gates/e2e/e2e-changed.ts", (folder) => [folder]), holds: LOCK.e2eWorlds },
  [GATE.mutationChanged]: {
    ...oneStep("scripts/gates/mutation/mutate-changed.ts", (folder) => [folder]),
    takesFiles: true,
  },
  [GATE.mutation]: oneStep("scripts/gates/mutation/mutate-everything.ts", (folder) => [folder]),
};

export type Steps =
  | { readonly ok: true; readonly steps: (folder: string) => readonly Step[] }
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
    steps: (folder) => command.steps(folder).map((step) => ({ bin: step.bin, args: [...step.args, ...files] })),
  };
};

export const describeStep = (step: Step): string => ["node", step.bin, ...step.args].join(" ");

export const GATE_RUNNER = "scripts/gates/gate-runner.ts";

export const rerunCommandFor = (gate: Gate, files: readonly string[] = []): string =>
  ["node", GATE_RUNNER, gate, ...files].join(" ");
