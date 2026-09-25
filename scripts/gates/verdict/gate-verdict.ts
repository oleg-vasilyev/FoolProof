import type { Gate } from "../shared/gate-names.ts";
import type { GateNumbers } from "./gate-numbers.ts";


export interface RanVerdict {
  readonly kind: "ran";
  readonly gate: Gate;
  readonly named: boolean;
  readonly folder: string;
  readonly ok: boolean;
  readonly exitCode: number;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly numbers: GateNumbers;
  readonly tail: readonly string[];
}

export interface SkippedVerdict {
  readonly kind: "skipped";
  readonly gate: Gate;
  readonly folder: string;
  readonly ok: false;
  readonly because: Gate;
  readonly startedAt: string;
}

export interface RefusedVerdict {
  readonly kind: "refused";
  readonly gate: Gate;
  readonly ok: false;
  readonly notice: string;
  readonly startedAt: string;
}

export type GateVerdict = RanVerdict | SkippedVerdict | RefusedVerdict;

export const PASSED = 0;

export const FAILED = 1;

export const TAIL_LINES = 40;

const MS_IN_A_SECOND = 1000;

const ONE_DECIMAL = 1;

export interface RunOfAGate {
  readonly gate: Gate;
  readonly named: boolean;
  readonly folder: string;
}

export const verdictOf = (
  run: RunOfAGate,
  exitCode: number,
  startedAt: Date,
  endedAt: Date,
  numbers: GateNumbers,
  output: readonly string[]
): RanVerdict => {
  const ok = exitCode === PASSED;

  return {
    kind: "ran",
    gate: run.gate,
    named: run.named,
    folder: run.folder,
    ok,
    exitCode,
    startedAt: startedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    numbers,
    tail: ok ? [] : output.slice(-TAIL_LINES),
  };
};

export const skippedVerdict = (gate: Gate, folder: string, because: Gate, startedAt: Date): SkippedVerdict => ({
  kind: "skipped",
  gate,
  folder,
  ok: false,
  because,
  startedAt: startedAt.toISOString(),
});

export const refusedVerdict = (gate: Gate, notice: string, startedAt: Date): RefusedVerdict => ({
  kind: "refused",
  gate,
  ok: false,
  notice,
  startedAt: startedAt.toISOString(),
});

export const secondsOf = (durationMs: number): string =>
  `${(durationMs / MS_IN_A_SECOND).toFixed(ONE_DECIMAL)}s`;

export const lineFor = (verdict: GateVerdict): string => {
  switch (verdict.kind) {
    case "skipped":
      return `${verdict.gate}: skipped, ${verdict.because} was red`;

    case "refused":
      return `${verdict.gate}: refused — ${verdict.notice}`;

    case "ran":
      return `${verdict.gate}: ${verdict.ok ? "green" : "RED"} in ${secondsOf(verdict.durationMs)} — ${verdict.folder}/`;
  }
};
