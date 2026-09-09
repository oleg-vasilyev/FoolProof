import { describe, expect, it } from "vitest";
import { PASSED, TAIL_LINES, lineFor, secondsOf, skippedVerdict, verdictOf } from "./gate-verdict.ts";
import type { RanVerdict } from "./gate-verdict.ts";


const STARTED = new Date("2026-09-09T10:00:00.000Z");

const ENDED = new Date("2026-09-09T10:01:01.500Z");

const DURATION_MS = 61500;

const RED = 1;

const A_SIGNAL = 137;

const LONGER_THAN_THE_TAIL = TAIL_LINES + 5;

const NONE = { kind: "none" } as const;

const output = (lines: number): readonly string[] =>
  Array.from({ length: lines }, (_, index) => `line ${String(index)}`);

const greenVerdict = (): RanVerdict =>
  verdictOf("lint", false, PASSED, STARTED, ENDED, NONE, output(LONGER_THAN_THE_TAIL));

const redVerdict = (): RanVerdict =>
  verdictOf("test:coverage", false, RED, STARTED, ENDED, NONE, output(LONGER_THAN_THE_TAIL));

describe("verdictOf()", () => {
  it("should call exit code zero green and anything else red", () => {
    expect(greenVerdict().ok).toBe(true);
    expect(redVerdict().ok).toBe(false);
    expect(verdictOf("e2e", false, A_SIGNAL, STARTED, ENDED, NONE, []).ok).toBe(false);
  });

  it("should be a ran verdict carrying the exit code, the start and the duration as measured", () => {
    expect(redVerdict()).toMatchObject({
      kind: "ran",
      gate: "test:coverage",
      exitCode: RED,
      startedAt: STARTED.toISOString(),
      durationMs: DURATION_MS,
    });
  });

  it("should carry the numbers it was handed", () => {
    const numbers = { kind: "e2e", cases: 1, files: 1, failed: 0, failures: [] } as const;

    expect(verdictOf("e2e", false, PASSED, STARTED, ENDED, numbers, []).numbers).toBe(numbers);
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
  it("should be its own kind, red, naming the gate that was red before it", () => {
    expect(skippedVerdict("test:mutation:changed", "test:coverage", STARTED)).toEqual({
      kind: "skipped",
      gate: "test:mutation:changed",
      ok: false,
      because: "test:coverage",
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
  it("should say a green gate is green and how long it took", () => {
    expect(lineFor(greenVerdict())).toBe("lint: green in 61.5s");
  });

  it("should point a red gate at its log", () => {
    expect(lineFor(redVerdict())).toBe("test:coverage: RED in 61.5s — reports/gates/test-coverage.log");
  });

  it("should say why a skipped gate did not run, rather than point at a log it never wrote", () => {
    expect(lineFor(skippedVerdict("e2e:changed", "lint", STARTED))).toBe(
      "e2e:changed: skipped, lint was red"
    );
  });
});

describe("lineFor(), a named run", () => {
  it("should point a red named run at its own log, not the bare gate's", () => {
    const named = verdictOf("test", true, RED, STARTED, ENDED, NONE, ["x"]);

    expect(named.named).toBe(true);
    expect(lineFor(named)).toBe("test: RED in 61.5s — reports/gates/test.named.log");
  });
});
