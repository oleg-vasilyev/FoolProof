import { beforeEach, describe, expect, it, vi } from "vitest";


const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const freshTally = async () => {
  vi.resetModules();

  return import("#shared/telegram/api-call-tally.ts");
};

describe("api-call-tally", () => {
  let tally: Awaited<ReturnType<typeof freshTally>>;

  beforeEach(async () => {
    tally = await freshTally();
  });

  it("should start with nothing to report", () => {
    expect(tally.callTally()).toEqual({
      retried: NOTHING,
      rateLimit: NOTHING,
      refusal: NOTHING,
    });
  });

  it("should count a retried call", () => {
    tally.recordCallTrouble("retried");

    expect(tally.callTally().retried).toBe(ONCE);
  });

  it("should count a rate limit", () => {
    tally.recordCallTrouble("rateLimit");

    expect(tally.callTally().rateLimit).toBe(ONCE);
  });

  it("should count a refusal", () => {
    tally.recordCallTrouble("refusal");

    expect(tally.callTally().refusal).toBe(ONCE);
  });

  it("should keep the three counts apart", () => {
    tally.recordCallTrouble("retried");
    tally.recordCallTrouble("retried");
    tally.recordCallTrouble("refusal");

    expect(tally.callTally()).toEqual({
      retried: TWICE,
      rateLimit: NOTHING,
      refusal: ONCE,
    });
  });

  it("should hand back a copy, so a reader cannot reset the run's counts", () => {
    tally.recordCallTrouble("retried");

    const taken = tally.callTally() as { retried: number };
    taken.retried = NOTHING;

    expect(tally.callTally().retried).toBe(ONCE);
  });
});
