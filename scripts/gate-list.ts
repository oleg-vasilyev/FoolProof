export const THE_CHECK_GATES = ["lint", "typecheck", "docs:check", "test:coverage"] as const;

export const THE_PUSH_GATES = [
  "lint",
  "typecheck",
  "e2e:typecheck",
  "test:e2e-harness",
  "docs:check",
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

export const THE_FULL_MUTATION = "test:mutation";

export type Gate =
  | (typeof THE_CHECK_GATES)[number]
  | (typeof THE_PUSH_GATES)[number]
  | (typeof THE_PHASE_GATES)[number]
  | (typeof THE_RELEASE_GATES)[number]
  | typeof THE_FULL_MUTATION;

export const ALL_GATES: readonly Gate[] = [
  ...new Set<Gate>([
    ...THE_CHECK_GATES,
    ...THE_PUSH_GATES,
    ...THE_PHASE_GATES,
    ...THE_RELEASE_GATES,
    THE_FULL_MUTATION,
  ]),
];

export const isGate = (name: string | undefined): name is Gate =>
  name !== undefined && ALL_GATES.includes(name as Gate);

export const BATTERIES = {
  check: THE_CHECK_GATES,
  "check:push": THE_PUSH_GATES,
  "check:phase": THE_PHASE_GATES,
  "check:release": THE_RELEASE_GATES,
} as const;

export type Battery = keyof typeof BATTERIES;

export const isBattery = (name: string | undefined): name is Battery =>
  name !== undefined && Object.hasOwn(BATTERIES, name);

export const NPM = "npm";

export const commandFor = (gate: Gate): string => `${NPM} run ${gate}`;

export const GATE_RUNNER = "scripts/gate-runner.ts";

export const rerunCommandFor = (gate: Gate): string => `node ${GATE_RUNNER} ${gate}`;
