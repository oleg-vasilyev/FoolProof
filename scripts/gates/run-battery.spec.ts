import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMANDS } from "./gate-list.ts";
import { BATTERY, GATE } from "./gate-names.ts";
import type { GateVerdict } from "./gate-verdict.ts";


const ROOT = "D:/Temp/FoolProof";

const runGateSpy = vi.fn();

const forgetVerdictsSpy = vi.fn();

const writeVerdictSpy = vi.fn();

const skippedVerdictSpy = vi.fn();

const summaryLinesSpy = vi.fn();

const gatesParagraphSpy = vi.fn();

const execFileSyncSpy = vi.fn();

const mkdirSyncSpy = vi.fn();

const writeFileSyncSpy = vi.fn();

vi.mock("./gate-runner.ts", () => ({
  runGate: (gate: unknown, mutateAgainst: unknown, steps: unknown) => runGateSpy(gate, mutateAgainst, steps),
  forgetVerdicts: (gates: unknown) => forgetVerdictsSpy(gates),
  writeVerdict: (verdict: unknown) => writeVerdictSpy(verdict),
}));

vi.mock("./gate-verdict.ts", () => ({
  PASSED: 0,
  FAILED: 1,
  skippedVerdict: (gate: unknown, because: unknown, at: unknown) => skippedVerdictSpy(gate, because, at),
}));

vi.mock("./gate-summary.ts", () => ({
  summaryLines: (verdicts: unknown, root: unknown) => summaryLinesSpy(verdicts, root),
  gatesParagraph: (verdicts: unknown, battery: unknown) => gatesParagraphSpy(verdicts, battery),
}));

vi.mock("node:child_process", () => ({
  execFileSync: (...args: readonly unknown[]) => execFileSyncSpy(...args),
}));

vi.mock("node:fs", () => ({
  mkdirSync: (...args: readonly unknown[]) => mkdirSyncSpy(...args),
  writeFileSync: (...args: readonly unknown[]) => writeFileSyncSpy(...args),
}));

const {
  NEEDS_THE_SUITE,
  THE_SUITE,
  baselineFromGit,
  gitLine,
  releaseBaseline,
  runBattery,
  walkTheGates,
  whatToSay,
} = await import("./run-battery.ts");


const FIRST = 0;

const SECOND = 1;

const NEVER = 0;

const ONCE = 1;

const GREEN = 0;

const RED = 1;

const verdictFor = (gate: GateVerdict["gate"], ok: boolean): GateVerdict =>
  ({ kind: "ran", gate, ok }) as GateVerdict;

const SKIPPED = { kind: "skipped", gate: GATE.mutationChanged, ok: false } as unknown as GateVerdict;

const GIT_OPTIONS = { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] };

const skip = vi.fn();

const tagOnHead = (tags: string, previous: string): void => {
  execFileSyncSpy.mockReset();
  execFileSyncSpy.mockReturnValueOnce(tags).mockReturnValueOnce(previous);
};

beforeEach(() => {
  vi.clearAllMocks();
  execFileSyncSpy.mockReset();

  runGateSpy.mockImplementation((gate: GateVerdict["gate"]) => Promise.resolve(verdictFor(gate, true)));
  skip.mockReturnValue(SKIPPED);
  skippedVerdictSpy.mockReturnValue(SKIPPED);
  summaryLinesSpy.mockReturnValue(["a summary line"]);
  gatesParagraphSpy.mockReturnValue("Gates: a paragraph.");
});

describe("THE_SUITE and NEEDS_THE_SUITE", () => {
  it("should make only the mutation runs wait on a green suite, since Stryker's dry run needs one", () => {
    expect(THE_SUITE).toBe(GATE.coverage);
    expect(NEEDS_THE_SUITE).toEqual([GATE.mutationChanged, GATE.mutation]);
  });
});

describe("walkTheGates()", () => {
  it("should run every gate in order and collect one verdict each", async () => {
    const gates = [GATE.lint, GATE.typecheck, GATE.coverage] as const;

    const verdicts = await walkTheGates(gates, runGateSpy, skip);

    expect(runGateSpy.mock.calls.map((call) => call[FIRST])).toEqual([...gates]);
    expect(verdicts.map((verdict) => verdict.gate)).toEqual([...gates]);
  });

  it("should carry on past a red gate, so one run reports every gate", async () => {
    runGateSpy.mockImplementation((gate: GateVerdict["gate"]) =>
      Promise.resolve(verdictFor(gate, gate !== GATE.lint))
    );

    const verdicts = await walkTheGates([GATE.lint, GATE.typecheck, GATE.e2eChanged], runGateSpy, skip);

    expect(verdicts.map((verdict) => verdict.ok)).toEqual([false, true, true]);
  });

  it("should skip a mutation run after a red suite, through the skip it was handed, instead of running it", async () => {
    runGateSpy.mockImplementation((gate: GateVerdict["gate"]) =>
      Promise.resolve(verdictFor(gate, gate !== GATE.coverage))
    );

    const verdicts = await walkTheGates(
      [GATE.coverage, GATE.mutationChanged, GATE.e2eChanged],
      runGateSpy,
      skip
    );

    expect(skip).toHaveBeenCalledWith(GATE.mutationChanged, GATE.coverage);
    expect(runGateSpy.mock.calls.map((call) => call[FIRST])).toEqual([GATE.coverage, GATE.e2eChanged]);
    expect(verdicts[SECOND]).toBe(SKIPPED);
  });

  it("should still play the scenarios after a red suite — they drive a real bot, not the units", async () => {
    runGateSpy.mockImplementation((gate: GateVerdict["gate"]) =>
      Promise.resolve(verdictFor(gate, gate !== GATE.coverage))
    );

    await walkTheGates([GATE.coverage, GATE.e2e], runGateSpy, skip);

    expect(runGateSpy).toHaveBeenCalledWith(GATE.e2e);
    expect(skip).toHaveBeenCalledTimes(NEVER);
  });

  it("should look for the suite itself, not for whichever gate was red first", async () => {
    runGateSpy.mockImplementation((gate: GateVerdict["gate"]) =>
      Promise.resolve(verdictFor(gate, gate !== GATE.lint))
    );

    await walkTheGates([GATE.lint, GATE.coverage, GATE.mutationChanged], runGateSpy, skip);

    expect(runGateSpy).toHaveBeenCalledWith(GATE.mutationChanged);
    expect(skip).toHaveBeenCalledTimes(NEVER);
  });

  it("should not skip a mutation run when the suite was never in the list", async () => {
    await walkTheGates([GATE.mutation], runGateSpy, skip);

    expect(runGateSpy).toHaveBeenCalledWith(GATE.mutation);
  });
});

describe("releaseBaseline()", () => {
  it("should take the previous tag when HEAD carries a release tag", () => {
    expect(releaseBaseline(["v1.21.0"], "v1.20.1")).toEqual({ ok: true, tag: "v1.20.1" });
  });

  it("should accept a release tag beside an unrelated one, needing only one that is a release", () => {
    expect(releaseBaseline(["archive-2026", "v1.21.0"], "v1.20.1")).toEqual({ ok: true, tag: "v1.20.1" });
  });

  it("should not take a tag that merely contains a v and a digit as a release", () => {
    expect(releaseBaseline(["archive-v1"], "v1.20.1").ok).toBe(false);
  });

  it("should refuse when HEAD carries no v* tag, saying so and naming npm version", () => {
    const baseline = releaseBaseline(["", "some-other-tag"], "v1.20.1");

    expect(baseline.ok).toBe(false);
    expect(baseline.ok ? "" : baseline.notice).toContain("HEAD carries no v* tag");
    expect(baseline.ok ? "" : baseline.notice).toContain("npm version");
  });

  it("should refuse when there is no previous tag to measure against, whether git said nothing or failed", () => {
    for (const previous of ["", null]) {
      const baseline = releaseBaseline(["v1.0.0"], previous);

      expect(baseline.ok).toBe(false);
      expect(baseline.ok ? "" : baseline.notice).toContain("no previous v* tag");
    }
  });
});

describe("gitLine() and baselineFromGit()", () => {
  it("should ask git with its complaints silenced and hand back the trimmed line", () => {
    execFileSyncSpy.mockReturnValue("v1.20.1\n");

    expect(gitLine("describe", "--tags")).toBe("v1.20.1");
    expect(execFileSyncSpy).toHaveBeenCalledWith("git", ["describe", "--tags"], GIT_OPTIONS);
  });

  it("should say null when git refuses, so the caller can refuse in words", () => {
    execFileSyncSpy.mockImplementation(() => {
      throw new Error("fatal: No tags can describe");
    });

    expect(gitLine("describe")).toBeNull();
  });

  it("should read the tags on HEAD and the previous release tag only, in that order, and judge them", () => {
    tagOnHead("v1.21.0\nother\n", "v1.20.1\n");

    expect(baselineFromGit()).toEqual({ ok: true, tag: "v1.20.1" });
    expect(execFileSyncSpy.mock.calls.map((call) => call[SECOND])).toEqual([
      ["tag", "--points-at", "HEAD"],
      ["describe", "--tags", "--abbrev=0", "--match", "v*", "HEAD^"],
    ]);
  });

  it("should refuse rather than throw when git can name no tag at all", () => {
    execFileSyncSpy.mockImplementation(() => {
      throw new Error("fatal");
    });

    expect(baselineFromGit().ok).toBe(false);
  });
});

describe("whatToSay()", () => {
  it("should give the summary, a blank line, then the paragraph a commit message pastes", () => {
    const verdicts = [verdictFor(GATE.lint, true)];

    expect(whatToSay(verdicts, BATTERY.phase, ROOT)).toEqual(["a summary line", "", "Gates: a paragraph."]);
    expect(summaryLinesSpy).toHaveBeenCalledWith(verdicts, ROOT);
    expect(gatesParagraphSpy).toHaveBeenCalledWith(verdicts, BATTERY.phase);
  });
});

describe("runBattery()", () => {
  const say = vi.fn();

  it("should refuse a name that is no battery, listing the four, before running anything", async () => {
    const status = await runBattery(["node", "run-battery.ts", "nonsense"], say, ROOT);

    expect(status).toBe(RED);
    expect(say.mock.calls[FIRST]?.[FIRST]).toContain("check:quick, check:push, check:phase, check:release");
    expect(runGateSpy).toHaveBeenCalledTimes(NEVER);
    expect(forgetVerdictsSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should forget its gates' old verdicts and write its name down before the first gate runs", async () => {
    await runBattery(["node", "run-battery.ts", BATTERY.push], say, ROOT);

    expect(forgetVerdictsSpy).toHaveBeenCalledWith([GATE.lint, GATE.typecheck, GATE.e2eTypecheck, GATE.harness, GATE.docsCheck]);
    expect(mkdirSyncSpy).toHaveBeenCalledWith("reports/gates", { recursive: true });
    expect(writeFileSyncSpy).toHaveBeenNthCalledWith(ONCE, "reports/gates/battery.txt", "check:push\n");
    expect(forgetVerdictsSpy.mock.invocationCallOrder[FIRST] ?? 0).toBeLessThan(
      runGateSpy.mock.invocationCallOrder[FIRST] ?? 0
    );
  });

  it("should walk the named battery with no baseline and exit green when every gate is", async () => {
    const status = await runBattery(["node", "run-battery.ts", BATTERY.push], say, ROOT);

    expect(status).toBe(GREEN);
    expect(runGateSpy.mock.calls.map((call) => call[FIRST])).toEqual([
      GATE.lint,
      GATE.typecheck,
      GATE.e2eTypecheck,
      GATE.harness,
      GATE.docsCheck,
    ]);
    expect(runGateSpy).toHaveBeenCalledWith(GATE.lint, undefined, COMMANDS[GATE.lint].steps);
    expect(execFileSyncSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should write a skipped gate's verdict to disk too, so a single re-run reads the whole battery", async () => {
    runGateSpy.mockImplementation((gate: GateVerdict["gate"]) =>
      Promise.resolve(verdictFor(gate, gate !== GATE.coverage))
    );

    await runBattery(["node", "run-battery.ts", BATTERY.phase], say, ROOT);

    expect(skippedVerdictSpy).toHaveBeenCalledWith(GATE.mutationChanged, GATE.coverage, expect.any(Date));
    expect(writeVerdictSpy).toHaveBeenCalledWith(SKIPPED);
  });

  it("should walk the release gates against the previous tag when the battery is the release", async () => {
    tagOnHead("v1.21.0\n", "v1.20.1\n");

    await runBattery(["node", "run-battery.ts", BATTERY.release], say, ROOT);

    expect(runGateSpy.mock.calls.map((call) => call[FIRST])).toEqual([
      GATE.lint,
      GATE.typecheck,
      GATE.e2eTypecheck,
      GATE.harness,
      GATE.docsCheck,
      GATE.coverage,
      GATE.mutationChanged,
      GATE.e2e,
    ]);
    expect(runGateSpy).toHaveBeenCalledWith(GATE.mutationChanged, "v1.20.1", COMMANDS[GATE.mutationChanged].steps);
    expect(gatesParagraphSpy).toHaveBeenCalledWith(expect.anything(), BATTERY.release);
  });

  it("should refuse a release with no tag on HEAD before touching the folder", async () => {
    tagOnHead("\n", "v1.20.1\n");

    const status = await runBattery(["node", "run-battery.ts", BATTERY.release], say, ROOT);

    expect(status).toBe(RED);
    expect(say.mock.calls[FIRST]?.[FIRST]).toContain("HEAD carries no v* tag");
    expect(runGateSpy).toHaveBeenCalledTimes(NEVER);
    expect(forgetVerdictsSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should write the paragraph last and say the summary, then exit red on any red gate", async () => {
    runGateSpy.mockImplementation((gate: GateVerdict["gate"]) =>
      Promise.resolve(verdictFor(gate, gate !== GATE.typecheck))
    );

    const status = await runBattery(["node", "run-battery.ts", BATTERY.phase], say, ROOT);

    expect(status).toBe(RED);
    expect(writeFileSyncSpy).toHaveBeenLastCalledWith("reports/gates/gates-paragraph.txt", "Gates: a paragraph.\n");
    expect(say.mock.calls.map((call) => call[FIRST])).toEqual(["a summary line", "", "Gates: a paragraph."]);
  });
});
