import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { installCrashExit } from "#shared/lifecycle/crash-exit.ts";


const CRASH_EXIT_CODE = 1;

const ONCE = 1;

const REASON = "the database file vanished";

describe("installCrashExit()", () => {
  let log: LoggerStub;
  let handlers: Map<string, (cause: unknown) => void>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    log = new LoggerStub();
    handlers = new Map();

    vi.spyOn(process, "once").mockImplementation(((event: string, handler: (cause: unknown) => void) => {
      handlers.set(event, handler);

      return process;
    }) as typeof process.once);

    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

    installCrashExit(log);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should listen for an exception nobody caught", () => {
    expect(handlers.has("uncaughtException")).toBe(true);
  });

  it("should listen for a rejection nobody handled", () => {
    expect(handlers.has("unhandledRejection")).toBe(true);
  });

  it("should log what killed the process, since the stack alone has no scope", () => {
    handlers.get("uncaughtException")?.(new Error(REASON));

    expect(log.errorSpy.mock.calls[0]?.[0]).toContain(REASON);
  });

  it("should name which kind of failure it was", () => {
    handlers.get("uncaughtException")?.(new Error(REASON));

    expect(log.errorSpy.mock.calls[0]?.[0]).toContain("uncaught exception");
  });

  it("should tell the reason apart from an exception when a promise rejected", () => {
    handlers.get("unhandledRejection")?.(REASON);

    expect(log.errorSpy.mock.calls[0]?.[0]).toContain("unhandled rejection");
  });

  it("should exit rather than carry on in an unknown state", () => {
    handlers.get("uncaughtException")?.(new Error(REASON));

    expect(exitSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should exit with a failure code, so the supervisor knows it was not asked for", () => {
    handlers.get("unhandledRejection")?.(REASON);

    expect(exitSpy).toHaveBeenCalledWith(CRASH_EXIT_CODE);
  });

  it("should log before it exits, or the reason would never reach the log", () => {
    exitSpy.mockImplementation((() => {
      expect(log.errorSpy).toHaveBeenCalledTimes(ONCE);

      return undefined;
    }) as never);

    handlers.get("uncaughtException")?.(new Error(REASON));

    expect(exitSpy).toHaveBeenCalledTimes(ONCE);
  });
});
