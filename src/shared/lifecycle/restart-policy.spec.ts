import { describe, expect, it } from "vitest";
import {
  describeDeath,
  planRestart,
  NO_RUNS,
  type Death,
  type RestartHistory,
} from "#shared/lifecycle/restart-policy.ts";


const CLEAN_EXIT = 0;

const CRASH_EXIT = 1;

const NO_FAILURES = 0;

const FIRST_FAILURE = 1;

const SECOND_FAILURE = 2;

const SIXTH_FAILURE = 6;

const SEVENTH_FAILURE = 7;

const FIRST_DELAY_MS = 1000;

const SECOND_DELAY_MS = 2000;

const LONGEST_DELAY_MS = 60_000;

const NO_DELAY = 0;

const JUST_STARTED_MS = 500;

const RAN_A_WHILE_MS = 120_000;

const STABLE_AFTER_MS = 60_000;

const ONE_MS = 1;

const RUNNING = false;

const STOPPING = true;

const crashed = (over: Partial<Death> = {}): Death => ({
  code: CRASH_EXIT,
  signal: null,
  upMs: JUST_STARTED_MS,
  ...over,
});

const after = (failures: number, everRan = true): RestartHistory => ({ failures, everRan });

describe("NO_RUNS", () => {
  it("should start a supervisor session with nothing to hold against the bot", () => {
    expect(NO_RUNS.failures).toBe(NO_FAILURES);
  });

  it("should claim no working run yet, which is what earns the give-up", () => {
    expect(NO_RUNS.everRan).toBe(false);
  });
});

describe("planRestart()", () => {
  describe("when the bot was asked to stop", () => {
    it("should not restart it", () => {
      expect(planRestart(crashed(), NO_RUNS, STOPPING).restart).toBe(false);
    });

    it("should say the stop was the reason", () => {
      const plan = planRestart(crashed(), NO_RUNS, STOPPING);

      expect(plan.restart ? null : plan.reason).toBe("stopped");
    });

    it("should not restart even a crash, since the evening is over", () => {
      expect(planRestart(crashed({ signal: "SIGKILL" }), NO_RUNS, STOPPING).restart).toBe(false);
    });

    it("should leave the history alone, having decided nothing about it", () => {
      expect(planRestart(crashed(), after(SECOND_FAILURE), STOPPING).history).toEqual(
        after(SECOND_FAILURE)
      );
    });
  });

  describe("when the bot exited cleanly", () => {
    it("should take that as the shutdown it was", () => {
      expect(planRestart(crashed({ code: CLEAN_EXIT }), NO_RUNS, RUNNING).restart).toBe(false);
    });

    it("should wait for nothing, having nothing to wait for", () => {
      expect(planRestart(crashed({ code: CLEAN_EXIT }), NO_RUNS, RUNNING).delayMs).toBe(NO_DELAY);
    });
  });

  describe("when a bot that had been working died", () => {
    it("should restart it", () => {
      expect(planRestart(crashed(), after(FIRST_FAILURE), RUNNING).restart).toBe(true);
    });

    it("should restart one killed by a signal, which has no exit code at all", () => {
      expect(planRestart(crashed({ code: null, signal: "SIGKILL" }), after(FIRST_FAILURE), RUNNING)
        .restart).toBe(true);
    });

    it("should come back quickly the first time", () => {
      expect(planRestart(crashed(), NO_RUNS, RUNNING).delayMs).toBe(FIRST_DELAY_MS);
    });

    it("should count the failure", () => {
      expect(planRestart(crashed(), NO_RUNS, RUNNING).history.failures).toBe(FIRST_FAILURE);
    });

    it("should wait longer when it died again right away", () => {
      expect(planRestart(crashed(), after(FIRST_FAILURE), RUNNING).delayMs).toBe(SECOND_DELAY_MS);
    });

    it("should keep counting a run of failures", () => {
      expect(planRestart(crashed(), after(FIRST_FAILURE), RUNNING).history.failures).toBe(
        SECOND_FAILURE
      );
    });

    it("should stop growing the wait, so a fix is never more than a minute away", () => {
      expect(planRestart(crashed(), after(SEVENTH_FAILURE), RUNNING).delayMs).toBe(LONGEST_DELAY_MS);
    });

    it("should already be capped where the growth would overshoot", () => {
      expect(planRestart(crashed(), after(SIXTH_FAILURE), RUNNING).delayMs).toBe(LONGEST_DELAY_MS);
    });

    it("should keep restarting a bot that has worked before, however often it dies", () => {
      expect(planRestart(crashed(), after(SEVENTH_FAILURE), RUNNING).restart).toBe(true);
    });
  });

  describe("when the bot had been up for a while", () => {
    const afterLongRun = crashed({ upMs: RAN_A_WHILE_MS });

    it("should treat the crash as the first one, not the next in a run", () => {
      expect(planRestart(afterLongRun, after(SEVENTH_FAILURE), RUNNING).history.failures).toBe(
        FIRST_FAILURE
      );
    });

    it("should come back quickly rather than serve out an old backoff", () => {
      expect(planRestart(afterLongRun, after(SEVENTH_FAILURE), RUNNING).delayMs).toBe(
        FIRST_DELAY_MS
      );
    });

    it("should remember that this bot did run, so it is never given up on", () => {
      expect(planRestart(afterLongRun, NO_RUNS, RUNNING).history.everRan).toBe(true);
    });

    it("should count the very moment it becomes a working run as one", () => {
      expect(planRestart(crashed({ upMs: STABLE_AFTER_MS }), NO_RUNS, RUNNING).history.everRan)
        .toBe(true);
    });

    it("should not count the instant before that", () => {
      expect(
        planRestart(crashed({ upMs: STABLE_AFTER_MS - ONE_MS }), NO_RUNS, RUNNING).history.everRan
      ).toBe(false);
    });
  });

  describe("when the bot has never managed to run", () => {
    const neverRan = (failures: number) => after(failures, false);

    it("should keep trying while there is reason to hope", () => {
      expect(planRestart(crashed(), neverRan(SECOND_FAILURE), RUNNING).restart).toBe(true);
    });

    it("should give up once the tries are spent, rather than loop on a broken setup", () => {
      expect(planRestart(crashed(), neverRan(SIXTH_FAILURE), RUNNING).restart).toBe(false);
    });

    it("should say it could not start, which is a different problem from a crash", () => {
      const plan = planRestart(crashed(), neverRan(SIXTH_FAILURE), RUNNING);

      expect(plan.restart ? null : plan.reason).toBe("cannot-start");
    });

    it("should still be trying on the last try it has", () => {
      expect(planRestart(crashed(), neverRan(SECOND_FAILURE + SECOND_FAILURE), RUNNING).restart)
        .toBe(true);
    });

    it("should not carry an old failure run into a bot that did start", () => {
      expect(planRestart(crashed({ upMs: RAN_A_WHILE_MS }), neverRan(SIXTH_FAILURE), RUNNING)
        .restart).toBe(true);
    });
  });
});

describe("describeDeath()", () => {
  it("should name the exit code when there is one", () => {
    expect(describeDeath(crashed())).toContain(String(CRASH_EXIT));
  });

  it("should say it was an exit code, not something else", () => {
    expect(describeDeath(crashed())).toContain("exit code");
  });

  it("should name the signal instead when one killed it", () => {
    expect(describeDeath(crashed({ signal: "SIGKILL" }))).toContain("SIGKILL");
  });

  it("should not mention an exit code that a signal made meaningless", () => {
    expect(describeDeath(crashed({ code: null, signal: "SIGKILL" }))).not.toContain("exit code");
  });
});
