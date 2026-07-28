import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerStub } from "../../testing/telegram.stub.ts";
import type { CardService } from "./cards.ts";
import { ABANDON_AFTER_SECONDS, startReaper } from "./reaper.ts";


const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const THREE_HOURS_IN_SECONDS = 3 * 60 * 60;

const ONCE = 1;

const TWICE = 2;

const NEVER = 0;

describe("startReaper()", () => {
  let cards: { sweepIdle: ReturnType<typeof vi.fn>; service: CardService };
  let log: LoggerStub;

  beforeEach(() => {
    vi.useFakeTimers();
    const sweepIdle = vi.fn().mockResolvedValue(NEVER);
    cards = { sweepIdle, service: { sweepIdle } as unknown as CardService };
    log = new LoggerStub();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should abandon a card after three quiet hours", () => {
    expect(ABANDON_AFTER_SECONDS).toBe(THREE_HOURS_IN_SECONDS);
  });

  it("should not sweep before the first interval", () => {
    startReaper(cards.service, log);

    expect(cards.sweepIdle).toHaveBeenCalledTimes(NEVER);
  });

  it("should sweep on every interval", async () => {
    startReaper(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(cards.sweepIdle).toHaveBeenCalledTimes(TWICE);
  });

  it("should pass the abandon threshold to the sweep", async () => {
    startReaper(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(cards.sweepIdle).toHaveBeenCalledWith(ABANDON_AFTER_SECONDS);
  });

  it("should stay quiet when nothing was abandoned", async () => {
    startReaper(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(log.infoSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should report what it abandoned", async () => {
    cards.sweepIdle.mockResolvedValue(ONCE);
    startReaper(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(log.infoSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should log a failed sweep instead of crashing the bot", async () => {
    cards.sweepIdle.mockRejectedValue(new Error("database is locked"));
    startReaper(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(log.errorSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should keep sweeping after a failure", async () => {
    cards.sweepIdle.mockRejectedValue(new Error("database is locked"));
    startReaper(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(cards.sweepIdle).toHaveBeenCalledTimes(TWICE);
  });

  it("should stop sweeping once cancelled", async () => {
    const stop = startReaper(cards.service, log);

    stop();
    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(cards.sweepIdle).toHaveBeenCalledTimes(NEVER);
  });
});
