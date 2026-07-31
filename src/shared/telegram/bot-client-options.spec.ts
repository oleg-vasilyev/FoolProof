import { beforeEach, describe, expect, it } from "vitest";
import { botClientOptions } from "#shared/telegram/bot-client-options.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";


const NEVER = 0;

const FAKE_ROOT = "http://127.0.0.1:8081";

describe("botClientOptions()", () => {
  let log: LoggerStub;

  beforeEach(() => {
    log = new LoggerStub();
  });

  it("should give grammY nothing to override when no root is set", () => {
    expect(botClientOptions({}, log)).toBeUndefined();
  });

  it("should say nothing when the bot is talking to Telegram itself", () => {
    botClientOptions({}, log);

    expect(log.warnSpy.mock.calls).toHaveLength(NEVER);
  });

  it("should point the client at the root it was given", () => {
    expect(botClientOptions({ BOT_API_ROOT: FAKE_ROOT }, log)?.client?.apiRoot).toBe(FAKE_ROOT);
  });

  it("should warn loudly, because a run pointed elsewhere is not a real run", () => {
    botClientOptions({ BOT_API_ROOT: FAKE_ROOT }, log);

    expect(log.warnSpy).toHaveBeenCalledWith(expect.stringContaining(FAKE_ROOT));
  });

  it("should say in the warning that nothing reaches a real chat", () => {
    botClientOptions({ BOT_API_ROOT: FAKE_ROOT }, log);

    expect(log.warnSpy).toHaveBeenCalledWith(expect.stringContaining("real chat"));
  });
});
