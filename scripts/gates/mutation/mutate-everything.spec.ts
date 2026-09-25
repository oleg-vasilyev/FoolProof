import { beforeEach, describe, expect, it, vi } from "vitest";
import { FAMILIES } from "./mutation-families.ts";


const runStrykerSpy = vi.fn();

const worstOfSpy = vi.fn();

vi.mock("./stryker-run.ts", () => ({
  runStryker: (...args: readonly unknown[]) => runStrykerSpy(...args),
  worstOf: (...args: readonly unknown[]) => worstOfSpy(...args),
}));

const { mutateEverything } = await import("./mutate-everything.ts");


const A_RUN = "reports/runs/x/a-run";

const RED = 3;

const ALSO_RED = 5;

const WORST = 7;

const ONCE = 1;

const FIRST = 0;

describe("mutateEverything()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    runStrykerSpy.mockReturnValueOnce(RED).mockReturnValueOnce(ALSO_RED);
    worstOfSpy.mockReturnValue(WORST);
  });

  it("should run every family through Stryker once, into the run's folder, with nothing extra", () => {
    mutateEverything(A_RUN);

    expect(runStrykerSpy).toHaveBeenCalledTimes(FAMILIES.length);
    expect(runStrykerSpy.mock.calls).toEqual(FAMILIES.map((family) => [family, A_RUN, []]));
  });

  it("should answer whatever worstOf makes of the families' statuses, in family order", () => {
    expect(mutateEverything(A_RUN)).toBe(WORST);
    expect(worstOfSpy).toHaveBeenCalledTimes(ONCE);
    expect(worstOfSpy.mock.calls[FIRST]?.[FIRST]).toEqual([RED, ALSO_RED]);
  });
});
