import { Bot, GrammyError, InputFile } from "grammy";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { createApiRetry } from "#shared/telegram/api-retry.ts";


const FAKE_TOKEN = "424242:AAHfake-token-for-tests";

const CHAT_ID = -100777;

const GREETING = "the bot says something";

const MESSAGE_ID = 4242;

const ONCE = 1;

const TWICE = 2;

const FLOOD_LIMIT = 429;

const BAD_REQUEST = 400;

const LONGER_THAN_WE_WAIT_SECONDS = 60;

const PIXEL = Uint8Array.of(137, 80, 78, 71);

const SENT = { ok: true, result: { message_id: MESSAGE_ID } };

const refusalOf = (code: number, retryAfterSeconds: number | null): unknown => ({
  ok: false,
  error_code: code,
  description: "the fake wire is refusing",
  ...(retryAfterSeconds === null ? {} : { parameters: { retry_after: retryAfterSeconds } }),
});

describe("the retry transformer on a real grammY client", () => {
  let bot: Bot;
  let log: LoggerStub;
  let wireSpy: Mock<(method: string) => Promise<unknown>>;

  beforeEach(() => {
    log = new LoggerStub();
    wireSpy = vi.fn();
    wireSpy.mockResolvedValue(SENT);

    bot = new Bot(FAKE_TOKEN);

    bot.api.config.use((_prev, method) => wireSpy(method) as never);
    bot.api.config.use(createApiRetry(log));
  });

  it("should retry a call the network threw on, and hand back the answer that followed", async () => {
    wireSpy.mockRejectedValueOnce(new Error("socket hang up"));

    const message = await bot.api.sendMessage(CHAT_ID, GREETING);

    expect(wireSpy).toHaveBeenCalledTimes(TWICE);
    expect(message.message_id).toBe(MESSAGE_ID);
  });

  it("should retry a flood limit, which arrives resolved rather than thrown", async () => {
    wireSpy.mockResolvedValueOnce(refusalOf(FLOOD_LIMIT, null));

    const message = await bot.api.sendMessage(CHAT_ID, GREETING);

    expect(wireSpy).toHaveBeenCalledTimes(TWICE);
    expect(message.message_id).toBe(MESSAGE_ID);
  });

  it("should let a refusal it cannot mend reach the caller as a thrown error", async () => {
    wireSpy.mockResolvedValue(refusalOf(BAD_REQUEST, null));

    await expect(bot.api.sendMessage(CHAT_ID, GREETING)).rejects.toBeInstanceOf(GrammyError);
    expect(wireSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should give up rather than sleep longer than Telegram is worth waiting for", async () => {
    wireSpy.mockResolvedValue(refusalOf(FLOOD_LIMIT, LONGER_THAN_WE_WAIT_SECONDS));

    await expect(bot.api.sendMessage(CHAT_ID, GREETING)).rejects.toBeInstanceOf(GrammyError);
    expect(wireSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should cover an upload too, which no call site could have wrapped itself", async () => {
    wireSpy.mockRejectedValueOnce(new Error("socket hang up"));

    await bot.api.sendPhoto(CHAT_ID, new InputFile(PIXEL, "card.png"));

    expect(wireSpy).toHaveBeenCalledTimes(TWICE);
    expect(wireSpy).toHaveBeenLastCalledWith("sendPhoto");
  });
});
