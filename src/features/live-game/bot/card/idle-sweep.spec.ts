import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import type { CardService } from "#live-game/bot/card/card-service.ts";
import { ABANDON_AFTER_SECONDS, startIdleSweep } from "#live-game/bot/card/idle-sweep.ts";


const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const THREE_HOURS_IN_SECONDS = 3 * 60 * 60;

const ONCE = 1;

const TWICE = 2;

const NEVER = 0;

describe("startIdleSweep()", () => {
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
    startIdleSweep(cards.service, log);

    expect(cards.sweepIdle).toHaveBeenCalledTimes(NEVER);
  });

  it("should sweep on every interval", async () => {
    startIdleSweep(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(cards.sweepIdle).toHaveBeenCalledTimes(TWICE);
  });

  it("should pass the abandon threshold to the sweep", async () => {
    startIdleSweep(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(cards.sweepIdle).toHaveBeenCalledWith(ABANDON_AFTER_SECONDS);
  });

  it("should stay quiet when nothing was abandoned", async () => {
    startIdleSweep(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(log.infoSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should report what it abandoned", async () => {
    cards.sweepIdle.mockResolvedValue(ONCE);
    startIdleSweep(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(log.infoSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should log a failed sweep instead of crashing the bot", async () => {
    cards.sweepIdle.mockRejectedValue(new Error("database is locked"));
    startIdleSweep(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(log.errorSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should keep sweeping after a failure", async () => {
    cards.sweepIdle.mockRejectedValue(new Error("database is locked"));
    startIdleSweep(cards.service, log);

    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(cards.sweepIdle).toHaveBeenCalledTimes(TWICE);
  });

  it("should stop sweeping once cancelled", async () => {
    const stop = startIdleSweep(cards.service, log);

    stop();
    await vi.advanceTimersByTimeAsync(SWEEP_INTERVAL_MS);

    expect(cards.sweepIdle).toHaveBeenCalledTimes(NEVER);
  });
});
