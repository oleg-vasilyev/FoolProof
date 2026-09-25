import { describe, expect, it } from "vitest";
import { GATE } from "../shared/gate-names.ts";
import {
  PASSED,
  TAIL_LINES,
  lineFor,
  refusedVerdict,
  secondsOf,
  skippedVerdict,
  verdictOf,
} from "./gate-verdict.ts";
import type { RanVerdict } from "./gate-verdict.ts";


const STARTED = new Date("2026-09-09T10:00:00.000Z");

const ENDED = new Date("2026-09-09T10:01:01.500Z");

const DURATION_MS = 61500;

const RED = 1;

const A_SIGNAL = 137;

const LONGER_THAN_THE_TAIL = TAIL_LINES + 5;

const NO_FINDINGS = { kind: "findings", findings: [] } as const;

const LINT_FOLDER = "reports/runs/lint/20260909-100000-a1";

const COVERAGE_FOLDER = "reports/runs/test-coverage/20260909-100000-b2";

const A_NOTICE = "another e2e run holds the e2e-worlds lock since 2026-09-09T09:58:00.000Z";

const output = (lines: number): readonly string[] =>
  Array.from({ length: lines }, (_, index) => `line ${String(index)}`);

const greenVerdict = (): RanVerdict =>
  verdictOf(
    { gate: GATE.lint, named: false, folder: LINT_FOLDER },
    PASSED,
    STARTED,
    ENDED,
    NO_FINDINGS,
    output(LONGER_THAN_THE_TAIL)
  );

const redVerdict = (): RanVerdict =>
  verdictOf(
    { gate: GATE.coverage, named: false, folder: COVERAGE_FOLDER },
    RED,
    STARTED,
    ENDED,
    NO_FINDINGS,
    output(LONGER_THAN_THE_TAIL)
  );

describe("verdictOf()", () => {
  it("should call exit code zero green and anything else red", () => {
    expect(greenVerdict().ok).toBe(true);
    expect(redVerdict().ok).toBe(false);
    expect(
      verdictOf({ gate: GATE.e2e, named: false, folder: LINT_FOLDER }, A_SIGNAL, STARTED, ENDED, NO_FINDINGS, []).ok
    ).toBe(false);
  });

  it("should be a ran verdict carrying the run's gate and folder, the exit code, the start and the duration as measured", () => {
    expect(redVerdict()).toMatchObject({
      kind: "ran",
      gate: GATE.coverage,
      named: false,
      folder: COVERAGE_FOLDER,
      exitCode: RED,
      startedAt: STARTED.toISOString(),
      durationMs: DURATION_MS,
    });
  });

  it("should carry whether the run was named, as the run said", () => {
    const named = verdictOf({ gate: GATE.test, named: true, folder: LINT_FOLDER }, RED, STARTED, ENDED, NO_FINDINGS, []);

    expect(named.named).toBe(true);
  });

  it("should carry the numbers it was handed", () => {
    const numbers = {
      kind: "e2e",
      selection: { kind: "everything" },
      cases: 1,
      files: 1,
      failed: 0,
      failures: [],
    } as const;

    expect(
      verdictOf({ gate: GATE.e2e, named: false, folder: LINT_FOLDER }, PASSED, STARTED, ENDED, numbers, []).numbers
    ).toBe(numbers);
  });

  it("should keep only the last lines of a red gate's output", () => {
    const tail = redVerdict().tail;

    expect(tail).toHaveLength(TAIL_LINES);
    expect(tail.at(-1)).toBe(`line ${String(LONGER_THAN_THE_TAIL - 1)}`);
  });

  it("should keep no output for a green gate, whose log is on disk anyway", () => {
    expect(greenVerdict().tail).toEqual([]);
  });
});

describe("skippedVerdict()", () => {
  it("should be its own kind, red, naming its folder and the gate that was red before it", () => {
    expect(skippedVerdict(GATE.mutationChanged, COVERAGE_FOLDER, GATE.coverage, STARTED)).toEqual({
      kind: "skipped",
      gate: GATE.mutationChanged,
      folder: COVERAGE_FOLDER,
      ok: false,
      because: GATE.coverage,
      startedAt: STARTED.toISOString(),
    });
  });
});

describe("refusedVerdict()", () => {
  it("should be its own kind, red, carrying the notice and no folder, the run never having begun", () => {
    expect(refusedVerdict(GATE.e2e, A_NOTICE, STARTED)).toEqual({
      kind: "refused",
      gate: GATE.e2e,
      ok: false,
      notice: A_NOTICE,
      startedAt: STARTED.toISOString(),
    });
  });
});

describe("secondsOf()", () => {
  it("should say the duration in seconds to one decimal", () => {
    expect(secondsOf(DURATION_MS)).toBe("61.5s");
  });
});

describe("lineFor()", () => {
  it("should say a green gate is green, how long it took, and the folder its run wrote", () => {
    expect(lineFor(greenVerdict())).toBe(`lint: green in 61.5s — ${LINT_FOLDER}/`);
  });

  it("should say a red gate is RED and point it at its run's folder", () => {
    expect(lineFor(redVerdict())).toBe(`test:coverage: RED in 61.5s — ${COVERAGE_FOLDER}/`);
  });

  it("should point a named run at its own folder, like any other", () => {
    const named = verdictOf({ gate: GATE.test, named: true, folder: LINT_FOLDER }, RED, STARTED, ENDED, NO_FINDINGS, ["x"]);

    expect(lineFor(named)).toBe(`test: RED in 61.5s — ${LINT_FOLDER}/`);
  });

  it("should say why a skipped gate did not run, rather than point at a folder it never filled", () => {
    expect(lineFor(skippedVerdict(GATE.e2eChanged, COVERAGE_FOLDER, GATE.lint, STARTED))).toBe(
      "e2e:changed: skipped, lint was red"
    );
  });

  it("should say a refused gate was refused, and pass on the notice saying why", () => {
    expect(lineFor(refusedVerdict(GATE.e2e, A_NOTICE, STARTED))).toBe(`e2e: refused — ${A_NOTICE}`);
  });
});
