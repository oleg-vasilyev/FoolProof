import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


const BEGAN_AT = 1000;

const SHORT_MS = 400;

const LONG_MS = 2400;

const freshTiming = async () => {
  vi.resetModules();

  return import("#shared/timing/slowest-render.ts");
};

describe("slowest-render", () => {
  let timing: Awaited<ReturnType<typeof freshTiming>>;
  let now: ReturnType<typeof vi.spyOn>;

  const timeOne = (tookMs: number): void => {
    now.mockReturnValueOnce(BEGAN_AT).mockReturnValueOnce(BEGAN_AT + tookMs);

    timing.startTiming()();
  };

  beforeEach(async () => {
    timing = await freshTiming();
    now = vi.spyOn(performance, "now");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have nothing to report before anything was drawn", () => {
    expect(timing.slowestRenderMs()).toBeNull();
  });

  it("should report how long a drawing took", () => {
    timeOne(LONG_MS);

    expect(timing.slowestRenderMs()).toBe(LONG_MS);
  });

  it("should keep the slowest drawing rather than the newest", () => {
    timeOne(LONG_MS);
    timeOne(SHORT_MS);

    expect(timing.slowestRenderMs()).toBe(LONG_MS);
  });

  it("should take over when a slower drawing comes along", () => {
    timeOne(SHORT_MS);
    timeOne(LONG_MS);

    expect(timing.slowestRenderMs()).toBe(LONG_MS);
  });

  it("should measure from the start rather than from the finish", () => {
    timeOne(LONG_MS);

    expect(timing.slowestRenderMs()).not.toBe(BEGAN_AT + LONG_MS);
  });

  it("should report nothing for a drawing that was started and never finished", () => {
    now.mockReturnValue(BEGAN_AT);
    timing.startTiming();

    expect(timing.slowestRenderMs()).toBeNull();
  });
});
