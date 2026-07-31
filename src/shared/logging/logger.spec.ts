import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LogHistoryStub } from "#shared/logging/log-history.stub.ts";


const ONCE = 1;

const NEVER = 0;

const history = new LogHistoryStub();

vi.mock("#shared/logging/log-history.ts", () => history.module);

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
    vi.clearAllMocks();

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

  describe("what /status will be able to report", () => {
    it("should record a warning, so a phone can be told about it later", async () => {
      const log = await loggerWithLevel("info");

      log.warn("could not edit message 500");

      expect(history.levelGiven()).toBe("warn");
    });

    it("should record an error the same way", async () => {
      const log = await loggerWithLevel("info");

      log.error("the database is gone");

      expect(history.levelGiven()).toBe("error");
    });

    it("should keep the scope in the recorded message, since the report has no other clue", async () => {
      const log = await loggerWithLevel("info");

      log.warn("no");

      expect(history.messageGiven()).toBe("scope: no");
    });

    it("should not record ordinary progress as a problem", async () => {
      const log = await loggerWithLevel("info");

      log.info("listening");

      expect(history.recordProblemSpy).not.toHaveBeenCalled();
    });

    it("should record a warning the log level would have hidden", async () => {
      const log = await loggerWithLevel("error");

      log.warn("no");

      expect(history.recordProblemSpy).toHaveBeenCalledTimes(ONCE);
      expect(warnSpy).toHaveBeenCalledTimes(NEVER);
    });
  });
});
