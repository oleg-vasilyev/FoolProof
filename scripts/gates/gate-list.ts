import { FAMILIES } from "./mutation-families.ts";
import { ESLINT, STRYKER, TSC, VITEST } from "./tool-binaries.ts";


export const THE_CHECK_GATES = ["lint", "typecheck", "docs-check", "test:coverage"] as const;

export const THE_PUSH_GATES = [
  "lint",
  "typecheck",
  "e2e:typecheck",
  "test:e2e-harness",
  "docs-check",
] as const;

export const THE_PHASE_GATES = [
  "lint",
  "typecheck",
  "test:coverage",
  "test:mutation:changed",
  "e2e:changed",
] as const;

export const THE_RELEASE_GATES = [
  ...THE_PUSH_GATES,
  "test:coverage",
  "test:mutation:changed",
  "e2e",
] as const;

export const THE_SINGLE_GATES = ["test"] as const;

export const THE_FULL_MUTATION = "test:mutation";

export type Gate =
  | (typeof THE_CHECK_GATES)[number]
  | (typeof THE_PUSH_GATES)[number]
  | (typeof THE_PHASE_GATES)[number]
  | (typeof THE_RELEASE_GATES)[number]
  | (typeof THE_SINGLE_GATES)[number]
  | typeof THE_FULL_MUTATION;

export const ALL_GATES: readonly Gate[] = [
  ...new Set<Gate>([
    ...THE_CHECK_GATES,
    ...THE_PUSH_GATES,
    ...THE_PHASE_GATES,
    ...THE_RELEASE_GATES,
    ...THE_SINGLE_GATES,
    THE_FULL_MUTATION,
  ]),
];

export const isGate = (name: string | undefined): name is Gate =>
  name !== undefined && ALL_GATES.includes(name as Gate);

export const BATTERIES = {
  "check:quick": THE_CHECK_GATES,
  "check:push": THE_PUSH_GATES,
  "check:phase": THE_PHASE_GATES,
  "check:release": THE_RELEASE_GATES,
} as const;

export type Battery = keyof typeof BATTERIES;

export const isBattery = (name: string | undefined): name is Battery =>
  name !== undefined && Object.hasOwn(BATTERIES, name);

export const CONFIG_DIR = "scripts/gates/config";

export const ESLINT_CONFIG = `${CONFIG_DIR}/eslint.config.js`;

export const VITEST_CONFIG = `${CONFIG_DIR}/vitest.config.ts`;

export const HARNESS_CONFIG = "e2e/vitest.harness.config.ts";

export const E2E_CONFIG = "e2e/vitest.e2e.config.ts";

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
  lint: oneStep(ESLINT, "--config", ESLINT_CONFIG, "--quiet", ...LINTED_FOLDERS),
  typecheck: oneStep(TSC, "--noEmit"),
  "e2e:typecheck": {
    steps: [
      { bin: TSC, args: ["-p", "e2e", "--noEmit"] },
      { bin: TSC, args: ["-p", "e2e/pages", "--noEmit"] },
    ],
    takesFiles: false,
  },
  "docs-check": oneStep("scripts/docs-check/check-docs.ts"),
  test: { ...oneStep(VITEST, "run", "--config", VITEST_CONFIG), takesFiles: true },
  "test:coverage": oneStep(VITEST, "run", "--config", VITEST_CONFIG, "--coverage"),
  "test:e2e-harness": oneStep(VITEST, "run", "--config", HARNESS_CONFIG),
  e2e: oneStep(VITEST, "run", "--config", E2E_CONFIG),
  "e2e:changed": oneStep("scripts/gates/e2e-changed.ts"),
  "test:mutation:changed": { ...oneStep("scripts/gates/mutate-changed.ts"), takesFiles: true },
  "test:mutation": {
    steps: FAMILIES.map((family) => ({ bin: STRYKER, args: ["run", family.config] })),
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
