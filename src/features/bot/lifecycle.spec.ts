import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardService } from "./cards.ts";
import { createShutdown } from "./lifecycle.ts";


const ONCE = 1;

const makeStep = (sink: string[], label: string) =>
  vi.fn((): void => {
    sink.push(label);
  });

const makeAsyncStep = (sink: string[], label: string) =>
  vi.fn(async (): Promise<void> => {
    sink.push(label);
  });

describe("createShutdown()", () => {
  let order: string[];
  let stopReaper: ReturnType<typeof makeStep>;
  let cardsShutdown: ReturnType<typeof makeAsyncStep>;
  let stopPolling: ReturnType<typeof makeAsyncStep>;
  let shutdown: () => Promise<void>;

  beforeEach(() => {
    order = [];
    stopReaper = makeStep(order, "reaper");
    cardsShutdown = makeAsyncStep(order, "flush");
    stopPolling = makeAsyncStep(order, "polling");

    shutdown = createShutdown({
      stopReaper,
      cards: { shutdown: cardsShutdown } as unknown as CardService,
      stopPolling,
    });
  });

  it("should stop the idle sweep", async () => {
    await shutdown();

    expect(stopReaper).toHaveBeenCalledTimes(ONCE);
  });

  it("should flush pending edits so the last tap is not lost", async () => {
    await shutdown();

    expect(cardsShutdown).toHaveBeenCalledTimes(ONCE);
  });

  it("should stop polling", async () => {
    await shutdown();

    expect(stopPolling).toHaveBeenCalledTimes(ONCE);
  });

  it("should stop the sweep before flushing, so it cannot queue more work", async () => {
    await shutdown();

    expect(order.indexOf("reaper")).toBeLessThan(order.indexOf("flush"));
  });

  it("should flush before dropping the connection that carries the edits", async () => {
    await shutdown();

    expect(order.indexOf("flush")).toBeLessThan(order.indexOf("polling"));
  });

  it("should run the three steps in order", async () => {
    await shutdown();

    expect(order).toEqual(["reaper", "flush", "polling"]);
  });

  it("should wait for the flush rather than racing it", async () => {
    const slowFlush = vi.fn(
      (): Promise<void> =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            order.push("flush");
            resolve();
          }, 0);
        })
    );

    await createShutdown({
      stopReaper,
      cards: { shutdown: slowFlush } as unknown as CardService,
      stopPolling,
    })();

    expect(order).toEqual(["reaper", "flush", "polling"]);
  });
});
