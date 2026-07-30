import { beforeEach, describe, expect, it, vi } from "vitest";
import { createShutdown } from "./lifecycle.ts";


const ONCE = 1;

const NEVER = 0;

const NO_DELAY = 0;

const step = (sink: string[], label: string) =>
  vi.fn(async (): Promise<void> => {
    sink.push(label);
  });

describe("createShutdown()", () => {
  let order: string[];

  beforeEach(() => {
    order = [];
  });

  it("should run every stop it was given", async () => {
    const first = step(order, "first");
    const second = step(order, "second");

    await createShutdown([first, second])();

    expect(first).toHaveBeenCalledTimes(ONCE);
    expect(second).toHaveBeenCalledTimes(ONCE);
  });

  it("should run them in the order they were given", async () => {
    await createShutdown([step(order, "flush"), step(order, "polling")])();

    expect(order).toEqual(["flush", "polling"]);
  });

  it("should wait for a slow stop rather than racing the next one", async () => {
    const slow = vi.fn(
      (): Promise<void> =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            order.push("flush");
            resolve();
          }, NO_DELAY);
        })
    );

    await createShutdown([slow, step(order, "polling")])();

    expect(order).toEqual(["flush", "polling"]);
  });

  it("should do nothing when there is nothing to stop", async () => {
    await createShutdown([])();

    expect(order).toHaveLength(NEVER);
  });

  it("should not swallow a failure from one of the stops", async () => {
    const failing = vi.fn(async (): Promise<void> => {
      throw new Error("could not flush");
    });

    await expect(createShutdown([failing])()).rejects.toThrow("could not flush");
  });
});
