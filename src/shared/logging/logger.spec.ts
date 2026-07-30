import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


const ONCE = 1;

const NEVER = 0;

const loggerWithLevel = async (level: string | undefined) => {
  vi.resetModules();

  if (level === undefined) {
    delete process.env.LOG_LEVEL;
  } else {
    process.env.LOG_LEVEL = level;
  }

  const { createLogger } = await import("#shared/logging/logger.ts");

  return createLogger("scope");
};

describe("createLogger()", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOG_LEVEL;
  });

  it("should default to info and print it", async () => {
    const log = await loggerWithLevel(undefined);

    log.info("hello");

    expect(logSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should swallow debug at the default level", async () => {
    const log = await loggerWithLevel(undefined);

    log.debug("noise");

    expect(logSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should print debug once the level allows it", async () => {
    const log = await loggerWithLevel("debug");

    log.debug("detail");

    expect(logSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should send warnings to console.warn", async () => {
    const log = await loggerWithLevel("info");

    log.warn("careful");

    expect(warnSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should send errors to console.error", async () => {
    const log = await loggerWithLevel("info");

    log.error("broken");

    expect(errorSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should suppress everything below the threshold", async () => {
    const log = await loggerWithLevel("error");

    log.debug("a");
    log.info("b");
    log.warn("c");

    expect(logSpy).toHaveBeenCalledTimes(NEVER);
    expect(warnSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should still print at the threshold itself", async () => {
    const log = await loggerWithLevel("error");

    log.error("boom");

    expect(errorSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should fall back to info when the level is nonsense", async () => {
    const log = await loggerWithLevel("banana");

    log.info("hello");

    expect(logSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should accept an upper case level", async () => {
    const log = await loggerWithLevel("DEBUG");

    log.debug("detail");

    expect(logSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should tag the line with the level and scope", async () => {
    const log = await loggerWithLevel("info");

    log.info("hello");

    expect(logSpy.mock.calls[0]?.[0]).toContain("INFO  scope: hello");
  });

  it("should stamp the line with an ISO timestamp", async () => {
    const log = await loggerWithLevel("info");

    log.info("hello");

    expect(logSpy.mock.calls[0]?.[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
