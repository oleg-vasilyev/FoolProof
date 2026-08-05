import { beforeEach, describe, expect, it, vi } from "vitest";
import { FailureKind } from "#shared/telegram/call-outcomes.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";


const FIRST_ATTEMPT = 1;

const SECOND_ATTEMPT = 2;

const THIRD_ATTEMPT = 3;

const LAST_ATTEMPT = 4;

const FIRST_DELAY_MS = 300;

const SECOND_DELAY_MS = 900;

const THIRD_DELAY_MS = 2700;

const BAD_REQUEST = 400;

const FLOOD_LIMIT = 429;

const SERVER_ERROR = 500;

const BAD_GATEWAY = 502;

const SHORT_WAIT_SECONDS = 2;

const SHORT_WAIT_MS = 2000;

const LONGEST_WAIT_SECONDS = 5;

const LONG_WAIT_SECONDS = 30;

const ONCE = 1;

const TWICE = 2;

const ALL_ATTEMPTS = 4;

const NO_DELAY = 0;

const METHOD = "editMessageText";

const PAYLOAD = { chat_id: 1, message_id: 2, text: "Game 3" };

const OK_RESPONSE = { ok: true as const, result: true };

const delaySpy = vi.fn(async (_ms: number): Promise<void> => undefined);

vi.mock("node:timers/promises", () => ({
  setTimeout: (ms: number) => delaySpy(ms),
}));

const { createApiRetry, createOutageLog, planFor } = await import("#shared/telegram/api-retry.ts");


type PrevCall = (method: string, payload: unknown, signal?: unknown) => Promise<unknown>;

type RawTransformer = (
  prev: PrevCall,
  method: string,
  payload: unknown,
  signal?: unknown
) => Promise<unknown>;

const refusal = (code: number, retryAfterSeconds?: number) => ({
  ok: false as const,
  error_code: code,
  description: "no",
  parameters: retryAfterSeconds === undefined ? undefined : { retry_after: retryAfterSeconds },
});

const callThrough = (log: LoggerStub, prev: PrevCall, signal?: { aborted: boolean }) =>
  (createApiRetry(log) as unknown as RawTransformer)(prev, METHOD, PAYLOAD, signal);

describe("planFor()", () => {
  describe("an unreachable server", () => {
    it("should retry the first failure", () => {
      expect(planFor({ kind: FailureKind.Unreachable }, FIRST_ATTEMPT).retry).toBe(true);
    });

    it("should wait before the second attempt rather than hammering", () => {
      expect(planFor({ kind: FailureKind.Unreachable }, FIRST_ATTEMPT).delayMs).toBe(FIRST_DELAY_MS);
    });

    it("should back off further with every attempt", () => {
      const waits = [SECOND_ATTEMPT, THIRD_ATTEMPT].map(
        (attempt) => planFor({ kind: FailureKind.Unreachable }, attempt).delayMs
      );

      expect(waits).toEqual([SECOND_DELAY_MS, THIRD_DELAY_MS]);
    });

    it("should stop once the attempts are spent, so a tap cannot hang forever", () => {
      expect(planFor({ kind: FailureKind.Unreachable }, LAST_ATTEMPT)).toEqual({
        retry: false,
        delayMs: NO_DELAY,
      });
    });
  });

  describe("a refusal from Telegram", () => {
    it("should retry a server error, which is never our fault", () => {
      expect(
        planFor({ kind: FailureKind.Refused, code: SERVER_ERROR, retryAfterSeconds: null }, FIRST_ATTEMPT)
          .retry
      ).toBe(true);
    });

    it("should retry anything above the server error code too", () => {
      expect(
        planFor({ kind: FailureKind.Refused, code: BAD_GATEWAY, retryAfterSeconds: null }, FIRST_ATTEMPT).retry
      ).toBe(true);
    });

    it("should retry a flood limit", () => {
      expect(
        planFor({ kind: FailureKind.Refused, code: FLOOD_LIMIT, retryAfterSeconds: null }, FIRST_ATTEMPT).retry
      ).toBe(true);
    });

    it("should wait exactly as long as Telegram asked", () => {
      expect(
        planFor(
          { kind: FailureKind.Refused, code: FLOOD_LIMIT, retryAfterSeconds: SHORT_WAIT_SECONDS },
          FIRST_ATTEMPT
        ).delayMs
      ).toBe(SHORT_WAIT_MS);
    });

    it("should still wait when Telegram asks for exactly as long as it may", () => {
      expect(
        planFor(
          { kind: FailureKind.Refused, code: FLOOD_LIMIT, retryAfterSeconds: LONGEST_WAIT_SECONDS },
          FIRST_ATTEMPT
        ).retry
      ).toBe(true);
    });

    it("should give up when Telegram asks for longer than a tap can wait", () => {
      expect(
        planFor(
          { kind: FailureKind.Refused, code: FLOOD_LIMIT, retryAfterSeconds: LONG_WAIT_SECONDS },
          FIRST_ATTEMPT
        ).retry
      ).toBe(false);
    });

    it("should never retry a bad request, which would fail identically", () => {
      expect(
        planFor({ kind: FailureKind.Refused, code: BAD_REQUEST, retryAfterSeconds: null }, FIRST_ATTEMPT).retry
      ).toBe(false);
    });
  });
});

describe("createOutageLog()", () => {
  let log: LoggerStub;

  beforeEach(() => {
    log = new LoggerStub();
  });

  it("should say the connection is gone", () => {
    createOutageLog(log).unreachable(METHOD, "fetch failed");

    expect(log.warnSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should name the method and the reason, so the line is actionable", () => {
    createOutageLog(log).unreachable(METHOD, "fetch failed");

    expect(log.warnSpy.mock.calls[0]?.[0]).toContain(METHOD);
  });

  it("should stay quiet while the outage lasts instead of logging every retry", () => {
    const outage = createOutageLog(log);

    outage.unreachable(METHOD, "fetch failed");
    outage.unreachable(METHOD, "fetch failed");

    expect(log.warnSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should announce the recovery", () => {
    const outage = createOutageLog(log);

    outage.unreachable(METHOD, "fetch failed");
    outage.reachable();

    expect(log.infoSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should say what recovered, not just print something", () => {
    const outage = createOutageLog(log);

    outage.unreachable(METHOD, "fetch failed");
    outage.reachable();

    expect(log.infoSpy.mock.calls[0]?.[0]).toContain("telegram");
  });

  it("should say nothing on a success that follows no outage", () => {
    createOutageLog(log).reachable();

    expect(log.infoSpy).not.toHaveBeenCalled();
  });

  it("should report a second outage after a recovery", () => {
    const outage = createOutageLog(log);

    outage.unreachable(METHOD, "fetch failed");
    outage.reachable();
    outage.unreachable(METHOD, "fetch failed");

    expect(log.warnSpy).toHaveBeenCalledTimes(TWICE);
  });
});

describe("createApiRetry()", () => {
  let log: LoggerStub;

  beforeEach(() => {
    vi.clearAllMocks();
    log = new LoggerStub();
  });

  it("should hand back a successful response untouched", async () => {
    const prev = vi.fn<PrevCall>().mockResolvedValue(OK_RESPONSE);

    await expect(callThrough(log, prev)).resolves.toBe(OK_RESPONSE);
  });

  it("should pass the call on unchanged", async () => {
    const prev = vi.fn<PrevCall>().mockResolvedValue(OK_RESPONSE);

    await callThrough(log, prev);

    expect(prev).toHaveBeenCalledWith(METHOD, PAYLOAD, undefined);
  });

  it("should retry after a network failure and return what the retry got", async () => {
    const prev = vi
      .fn<PrevCall>()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValue(OK_RESPONSE);

    await expect(callThrough(log, prev)).resolves.toBe(OK_RESPONSE);
  });

  it("should wait between the attempts", async () => {
    const prev = vi
      .fn<PrevCall>()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValue(OK_RESPONSE);

    await callThrough(log, prev);

    expect(delaySpy).toHaveBeenCalledWith(FIRST_DELAY_MS);
  });

  it("should give up after the last attempt and rethrow what failed", async () => {
    const boom = new Error("fetch failed");
    const prev = vi.fn<PrevCall>().mockRejectedValue(boom);

    await expect(callThrough(log, prev)).rejects.toBe(boom);
  });

  it("should have used every attempt before giving up", async () => {
    const prev = vi.fn<PrevCall>().mockRejectedValue(new Error("fetch failed"));

    await expect(callThrough(log, prev)).rejects.toThrow();

    expect(prev).toHaveBeenCalledTimes(ALL_ATTEMPTS);
  });

  it("should retry a refusal Telegram may recover from", async () => {
    const prev = vi
      .fn<PrevCall>()
      .mockResolvedValueOnce(refusal(SERVER_ERROR))
      .mockResolvedValue(OK_RESPONSE);

    await expect(callThrough(log, prev)).resolves.toBe(OK_RESPONSE);
  });

  it("should return a bad request rather than repeat it", async () => {
    const refused = refusal(BAD_REQUEST);
    const prev = vi.fn<PrevCall>().mockResolvedValue(refused);

    await expect(callThrough(log, prev)).resolves.toBe(refused);
  });

  it("should not sleep over a request that will never be retried", async () => {
    const prev = vi.fn<PrevCall>().mockResolvedValue(refusal(BAD_REQUEST));

    await callThrough(log, prev);

    expect(delaySpy).not.toHaveBeenCalled();
  });

  it("should wait as long as a flood limit asked", async () => {
    const prev = vi
      .fn<PrevCall>()
      .mockResolvedValueOnce(refusal(FLOOD_LIMIT, SHORT_WAIT_SECONDS))
      .mockResolvedValue(OK_RESPONSE);

    await callThrough(log, prev);

    expect(delaySpy).toHaveBeenCalledWith(SHORT_WAIT_MS);
  });

  it("should stop retrying once the bot is shutting down", async () => {
    const prev = vi.fn<PrevCall>().mockRejectedValue(new Error("aborted"));

    await expect(callThrough(log, prev, { aborted: true })).rejects.toThrow();

    expect(prev).toHaveBeenCalledTimes(ONCE);
  });

  it("should not report an outage that is only the shutdown", async () => {
    const prev = vi.fn<PrevCall>().mockRejectedValue(new Error("aborted"));

    await expect(callThrough(log, prev, { aborted: true })).rejects.toThrow();

    expect(log.warnSpy).not.toHaveBeenCalled();
  });

  it("should report the outage once for a call that failed repeatedly", async () => {
    const prev = vi.fn<PrevCall>().mockRejectedValue(new Error("fetch failed"));

    await expect(callThrough(log, prev)).rejects.toThrow();

    expect(log.warnSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should record which refusal it is retrying, for when a run of them matters", async () => {
    const prev = vi
      .fn<PrevCall>()
      .mockResolvedValueOnce(refusal(SERVER_ERROR))
      .mockResolvedValue(OK_RESPONSE);

    await callThrough(log, prev);

    expect(log.debugSpy.mock.calls[0]?.[0]).toContain(METHOD);
  });

  it("should announce the recovery on the call that finally lands", async () => {
    const prev = vi
      .fn<PrevCall>()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValue(OK_RESPONSE);

    await callThrough(log, prev);

    expect(log.infoSpy).toHaveBeenCalledTimes(ONCE);
  });
});
