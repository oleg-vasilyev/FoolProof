import { spawnSync } from "node:child_process";


const PASSED = 0;

const FAILED = 1;

const NPM = "npm";

const INDENTED = "  ";

export const THE_GATES = [
  "lint",
  "typecheck",
  "test:coverage",
  "test:mutation:changed",
  "e2e:changed",
] as const;

export type Gate = (typeof THE_GATES)[number];

export type GateVerdict = { readonly ok: true } | { readonly ok: false; readonly red: Gate };

export const commandFor = (gate: Gate): string => `${NPM} run ${gate}`;

export const walkTheGates = (
  gates: readonly Gate[],
  run: (gate: Gate) => number
): GateVerdict => {
  const red = gates.find((gate) => run(gate) !== PASSED);

  return red === undefined ? { ok: true } : { ok: false, red };
};

export const whatToSay = (verdict: GateVerdict, gates: readonly Gate[]): readonly string[] =>
  verdict.ok
    ? [
        "check:phase: every gate is green.",
        "After an edit, re-run only the gate the edit touches:",
        ...gates.map((gate) => `${INDENTED}${commandFor(gate)}`),
      ]
    : [
        `check:phase: ${commandFor(verdict.red)} is red, and the gates after it did not run.`,
        "Fix it, then re-run that gate alone rather than the whole chain:",
        `${INDENTED}${commandFor(verdict.red)}`,
      ];

export const runOne = (gate: Gate): number =>
  spawnSync(commandFor(gate), { stdio: "inherit", shell: true }).status ?? FAILED;

if (import.meta.main) {
  const verdict = walkTheGates(THE_GATES, runOne);

  for (const line of whatToSay(verdict, THE_GATES)) {
    console.log(line);
  }

  process.exit(verdict.ok ? PASSED : FAILED);
}
