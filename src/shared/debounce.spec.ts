import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncer } from "#shared/debounce.ts";


const DELAY_MS = 350;

const JUST_BEFORE_MS = 349;

const ONCE = 1;

const TWICE = 2;

const NEVER = 0;

const createRun = () => vi.fn(async (_value: string): Promise<void> => undefined);

describe("createDebouncer()", () => {
  let run: ReturnType<typeof createRun>;

  beforeEach(() => {
    vi.useFakeTimers();
    run = createRun();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not run before the delay elapses", () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "first");
    vi.advanceTimersByTime(JUST_BEFORE_MS);

    expect(run).toHaveBeenCalledTimes(NEVER);
  });

  it("should run once the delay elapses", () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "first");
    vi.advanceTimersByTime(DELAY_MS);

    expect(run).toHaveBeenCalledTimes(ONCE);
    expect(run).toHaveBeenCalledWith("first");
  });

  it("should collapse rapid taps into a single run", () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "first");
    debouncer.schedule("a", "second");
    debouncer.schedule("a", "third");
    vi.advanceTimersByTime(DELAY_MS);

    expect(run).toHaveBeenCalledTimes(ONCE);
  });

  it("should keep only the newest value", () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "stale");
    debouncer.schedule("a", "fresh");
    vi.advanceTimersByTime(DELAY_MS);

    expect(run).toHaveBeenCalledWith("fresh");
  });

  it("should restart the delay on every schedule", () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "first");
    vi.advanceTimersByTime(JUST_BEFORE_MS);
    debouncer.schedule("a", "second");
    vi.advanceTimersByTime(JUST_BEFORE_MS);

    expect(run).toHaveBeenCalledTimes(NEVER);
  });

  it("should keep separate keys independent", () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "for-a");
    debouncer.schedule("b", "for-b");
    vi.advanceTimersByTime(DELAY_MS);

    expect(run).toHaveBeenCalledTimes(TWICE);
  });

  it("should drop a cancelled entry without running it", () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "first");
    debouncer.cancel("a");
    vi.advanceTimersByTime(DELAY_MS);

    expect(run).toHaveBeenCalledTimes(NEVER);
  });

  it("should ignore cancelling a key that was never scheduled", () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    expect(() => debouncer.cancel("missing")).not.toThrow();
  });

  it("should run immediately when flushed", async () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "first");
    await debouncer.flush("a");

    expect(run).toHaveBeenCalledTimes(ONCE);
  });

  it("should not run again after a flush", async () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "first");
    await debouncer.flush("a");
    vi.advanceTimersByTime(DELAY_MS);

    expect(run).toHaveBeenCalledTimes(ONCE);
  });

  it("should ignore flushing a key that was never scheduled", async () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    await debouncer.flush("missing");

    expect(run).toHaveBeenCalledTimes(NEVER);
  });

  it("should flush every pending key", async () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "for-a");
    debouncer.schedule("b", "for-b");
    await debouncer.flushAll();

    expect(run).toHaveBeenCalledTimes(TWICE);
  });

  it("should leave nothing pending after flushing all", async () => {
    const debouncer = createDebouncer<string>(DELAY_MS, run);

    debouncer.schedule("a", "for-a");
    await debouncer.flushAll();
    vi.advanceTimersByTime(DELAY_MS);

    expect(run).toHaveBeenCalledTimes(ONCE);
  });
});
