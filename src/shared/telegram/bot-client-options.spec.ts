import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";


const env = new EnvStub();

vi.mock("#shared/config/env.ts", () => env.module);

const { botClientOptions } = await import("#shared/telegram/bot-client-options.ts");

const NEVER = 0;

const FAKE_ROOT = "http://127.0.0.1:8081";

describe("botClientOptions()", () => {
  let log: LoggerStub;

  beforeEach(() => {
    vi.clearAllMocks();

    env.optionalEnvSpy.mockReturnValue(null);
    log = new LoggerStub();
  });

  it("should ask for the root by name, so an empty one counts as none", () => {
    botClientOptions(env.loaded, log);

    expect(env.optionalEnvSpy).toHaveBeenCalledWith(env.loaded, "BOT_API_ROOT");
  });

  it("should give grammY nothing to override when no root is set", () => {
    expect(botClientOptions(env.loaded, log)).toBeUndefined();
  });

  it("should say nothing when the bot is talking to Telegram itself", () => {
    botClientOptions(env.loaded, log);

    expect(log.warnSpy.mock.calls).toHaveLength(NEVER);
  });

  it("should point the client at the root it was given", () => {
    env.optionalEnvSpy.mockReturnValue(FAKE_ROOT);

    expect(botClientOptions(env.loaded, log)?.client?.apiRoot).toBe(FAKE_ROOT);
  });

  it("should warn loudly, because a run pointed elsewhere is not a real run", () => {
    env.optionalEnvSpy.mockReturnValue(FAKE_ROOT);

    botClientOptions(env.loaded, log);

    expect(log.warnSpy).toHaveBeenCalledWith(expect.stringContaining(FAKE_ROOT));
  });

  it("should say in the warning that nothing reaches a real chat", () => {
    env.optionalEnvSpy.mockReturnValue(FAKE_ROOT);

    botClientOptions(env.loaded, log);

    expect(log.warnSpy).toHaveBeenCalledWith(expect.stringContaining("real chat"));
  });
});
