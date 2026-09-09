import type { Gate } from "./gate-list.ts";
import { logPathOf } from "./gate-paths.ts";
import type { GateNumbers } from "./gate-numbers.ts";


export interface RanVerdict {
  readonly kind: "ran";
  readonly gate: Gate;
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
  readonly ok: false;
  readonly because: Gate;
  readonly startedAt: string;
}

export type GateVerdict = RanVerdict | SkippedVerdict;

export const PASSED = 0;

export const FAILED = 1;

export const TAIL_LINES = 40;

const MS_IN_A_SECOND = 1000;

const ONE_DECIMAL = 1;

export const verdictOf = (
  gate: Gate,
  exitCode: number,
  startedAt: Date,
  endedAt: Date,
  numbers: GateNumbers,
  output: readonly string[]
): RanVerdict => {
  const ok = exitCode === PASSED;

  return {
    kind: "ran",
    gate,
    ok,
    exitCode,
    startedAt: startedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    numbers,
    tail: ok ? [] : output.slice(-TAIL_LINES),
  };
};

export const skippedVerdict = (gate: Gate, because: Gate, startedAt: Date): SkippedVerdict => ({
  kind: "skipped",
  gate,
  ok: false,
  because,
  startedAt: startedAt.toISOString(),
});

export const secondsOf = (verdict: RanVerdict): string =>
  `${(verdict.durationMs / MS_IN_A_SECOND).toFixed(ONE_DECIMAL)}s`;

export const lineFor = (verdict: GateVerdict): string => {
  switch (verdict.kind) {
    case "skipped":
      return `${verdict.gate}: skipped, ${verdict.because} was red`;

    case "ran":
      return verdict.ok
        ? `${verdict.gate}: green in ${secondsOf(verdict)}`
        : `${verdict.gate}: RED in ${secondsOf(verdict)} — ${logPathOf(verdict.gate)}`;
  }
};
