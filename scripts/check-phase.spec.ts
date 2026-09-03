import { beforeEach, describe, expect, it, vi } from "vitest";


const spawnSyncSpy = vi.fn();

vi.mock("node:child_process", () => ({
  spawnSync: (...args: readonly unknown[]) => spawnSyncSpy(...args),
}));

const { THE_GATES, commandFor, runOne, walkTheGates, whatToSay } = await import(
  "./check-phase.ts"
);

const GREEN = 0;

const RED = 1;

const NEVER = 0;

const FIVE_GATES = 5;

const THE_FIRST_THREE = 3;

const THE_FIRST_TWO = 2;

const FIRST = 0;

const LAST_LINE = -1;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("THE_GATES", () => {
  it("should be the five phase gates, in the order the chain ran them", () => {
    expect(THE_GATES).toEqual([
      "lint",
      "typecheck",
      "test:coverage",
      "test:mutation:changed",
      "e2e:changed",
    ]);
  });
});

describe("commandFor", () => {
  it("should name the npm script that re-runs one gate on its own", () => {
    expect(commandFor("test:coverage")).toBe("npm run test:coverage");
  });
});

describe("walkTheGates", () => {
  it("should run every gate in order and call the run green when each returned zero", () => {
    const run = vi.fn().mockReturnValue(GREEN);

    const verdict = walkTheGates(THE_GATES, run);

    expect(verdict).toEqual({ ok: true });
    expect(run.mock.calls.map((call) => call[FIRST])).toEqual([...THE_GATES]);
  });

  it("should stop at the first red gate and name it", () => {
    const run = vi
      .fn()
      .mockReturnValueOnce(GREEN)
      .mockReturnValueOnce(GREEN)
      .mockReturnValueOnce(RED);

    const verdict = walkTheGates(THE_GATES, run);

    expect(verdict).toEqual({ ok: false, red: "test:coverage" });
    expect(run).toHaveBeenCalledTimes(THE_FIRST_THREE);
  });

  it("should read any non-zero status as red, not only one", () => {
    const run = vi.fn().mockReturnValueOnce(GREEN).mockReturnValueOnce(FIVE_GATES);

    expect(walkTheGates(THE_GATES, run)).toEqual({ ok: false, red: "typecheck" });
    expect(run).toHaveBeenCalledTimes(THE_FIRST_TWO);
  });

  it("should not touch the shell itself — the runner hands it the gate to run", () => {
    walkTheGates(THE_GATES, () => GREEN);

    expect(spawnSyncSpy).toHaveBeenCalledTimes(NEVER);
  });
});

describe("runOne", () => {
  it("should hand npm the gate through a shell, with its output left on this terminal", () => {
    spawnSyncSpy.mockReturnValue({ status: GREEN });

    expect(runOne("lint")).toBe(GREEN);
    expect(spawnSyncSpy).toHaveBeenCalledWith("npm run lint", { stdio: "inherit", shell: true });
  });

  it("should pass a red gate's status through unchanged", () => {
    spawnSyncSpy.mockReturnValue({ status: FIVE_GATES });

    expect(runOne("typecheck")).toBe(FIVE_GATES);
  });

  it("should read a gate killed by a signal, which has no status, as red", () => {
    spawnSyncSpy.mockReturnValue({ status: null });

    expect(runOne("e2e:changed")).toBe(RED);
  });
});

describe("whatToSay", () => {
  it("should end a green run with the five commands, one per line, after the rule", () => {
    const said = whatToSay({ ok: true }, THE_GATES);

    expect(said[FIRST]).toBe("check:phase: every gate is green.");
    expect(said).toContain("After an edit, re-run only the gate the edit touches:");
    expect(said.slice(-FIVE_GATES)).toEqual([
      "  npm run lint",
      "  npm run typecheck",
      "  npm run test:coverage",
      "  npm run test:mutation:changed",
      "  npm run e2e:changed",
    ]);
  });

  it("should end a red run with the one command that re-runs just that gate", () => {
    const said = whatToSay({ ok: false, red: "e2e:changed" }, THE_GATES);

    expect(said[FIRST]).toBe(
      "check:phase: npm run e2e:changed is red, and the gates after it did not run."
    );
    expect(said).toContain("Fix it, then re-run that gate alone rather than the whole chain:");
    expect(said.at(LAST_LINE)).toBe("  npm run e2e:changed");
  });

  it("should not list the other gates after a red one, so the one to re-run is unmistakable", () => {
    const said = whatToSay({ ok: false, red: "lint" }, THE_GATES).join("\n");

    expect(said).not.toContain("typecheck");
  });
});
