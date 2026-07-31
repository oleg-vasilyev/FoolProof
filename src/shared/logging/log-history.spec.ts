import { beforeEach, describe, expect, it, vi } from "vitest";


const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const KEPT = 8;

const OVER_THE_LIMIT = 12;

const FIRST = 0;

const LAST = -1;

const freshHistory = async () => {
  vi.resetModules();

  return import("#shared/logging/log-history.ts");
};

describe("log-history", () => {
  let history: Awaited<ReturnType<typeof freshHistory>>;

  beforeEach(async () => {
    history = await freshHistory();
  });

  describe("problemTally()", () => {
    it("should start with nothing to report", () => {
      expect(history.problemTally()).toEqual({ warn: NOTHING, error: NOTHING });
    });

    it("should count a warning", () => {
      history.recordProblem("warn", "no");

      expect(history.problemTally().warn).toBe(ONCE);
    });

    it("should count an error", () => {
      history.recordProblem("error", "no");

      expect(history.problemTally().error).toBe(ONCE);
    });

    it("should keep the two counts apart", () => {
      history.recordProblem("warn", "no");
      history.recordProblem("warn", "no again");
      history.recordProblem("error", "worse");

      expect(history.problemTally()).toEqual({ warn: TWICE, error: ONCE });
    });

    it("should keep counting past the number of messages it keeps", () => {
      for (let seen = NOTHING; seen < OVER_THE_LIMIT; seen += ONCE) {
        history.recordProblem("warn", `problem ${seen}`);
      }

      expect(history.problemTally().warn).toBe(OVER_THE_LIMIT);
    });
  });

  describe("problemsSeen()", () => {
    it("should be empty before anything goes wrong", () => {
      expect(history.problemsSeen()).toEqual([]);
    });

    it("should keep the message", () => {
      history.recordProblem("warn", "could not edit message 500");

      expect(history.problemsSeen()[FIRST]?.message).toBe("could not edit message 500");
    });

    it("should keep the level", () => {
      history.recordProblem("error", "no");

      expect(history.problemsSeen()[FIRST]?.level).toBe("error");
    });

    it("should timestamp the problem, since the report shows when it happened", () => {
      history.recordProblem("warn", "no");

      expect(history.problemsSeen()[FIRST]?.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should hold no more than a handful, so a long run cannot fill memory", () => {
      for (let seen = NOTHING; seen < OVER_THE_LIMIT; seen += ONCE) {
        history.recordProblem("warn", `problem ${seen}`);
      }

      expect(history.problemsSeen()).toHaveLength(KEPT);
    });

    it("should drop the oldest problem rather than the newest", () => {
      for (let seen = NOTHING; seen < OVER_THE_LIMIT; seen += ONCE) {
        history.recordProblem("warn", `problem ${seen}`);
      }

      expect(history.problemsSeen().at(LAST)?.message).toBe(`problem ${OVER_THE_LIMIT - ONCE}`);
    });

    it("should keep the order it happened in", () => {
      history.recordProblem("warn", "first");
      history.recordProblem("warn", "second");

      expect(history.problemsSeen().map((problem) => problem.message)).toEqual([
        "first",
        "second",
      ]);
    });

    it("should hand back a copy, so a caller cannot edit the history", () => {
      history.recordProblem("warn", "first");

      const taken = history.problemsSeen() as unknown as { message: string }[];
      taken.push({ message: "invented" });

      expect(history.problemsSeen()).toHaveLength(ONCE);
    });
  });
});
