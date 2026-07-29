import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Bot } from "grammy";
import { cardRecordOf, playerIdOf } from "../../shared/repository/records.stub.ts";
import { RepositoryStub } from "../../shared/repository/repository.stub.ts";
import { LoggerStub } from "../../shared/logger.stub.ts";
import { encodeCallback } from "../render/callback.ts";
import type { CardService } from "./cards.ts";
import { createBot } from "./router.ts";
import { botInfoStub, callbackUpdate, messageUpdate, PROMPT_MESSAGE_ID } from "./updates.stub.ts";


const FAKE_TOKEN = "424242:AAHfake-token-for-tests";

const THREE = ["Oleg", "Anya", "Roma"];

const PROMPT_TEXT = "Who is playing? Send the names in seating order.";

const ONCE = 1;

const NEVER = 0;

const FIRST_VERSION = 0;

interface ApiCall {
  readonly method: string;
  readonly payload: Record<string, unknown>;
}

describe("the bot, driven end to end", () => {
  let repo: RepositoryStub;
  let log: LoggerStub;
  let bot: Bot;
  let cards: CardService;
  let calls: ApiCall[];

  const callsTo = (method: string): readonly ApiCall[] =>
    calls.filter((call) => call.method === method);

  const lastCallTo = (method: string): ApiCall | undefined =>
    callsTo(method)[callsTo(method).length - 1];

  beforeEach(() => {
    repo = new RepositoryStub();
    log = new LoggerStub();
    calls = [];

    const bundle = createBot(FAKE_TOKEN, { repo, log, botInfo: botInfoStub });
    bot = bundle.bot;
    cards = bundle.cards;

    bot.api.config.use((_prev, method, payload) => {
      calls.push({ method, payload: payload as Record<string, unknown> });

      if (method === "sendMessage") {
        return Promise.resolve({
          ok: true,
          result: { message_id: PROMPT_MESSAGE_ID },
        } as never);
      }

      return Promise.resolve({ ok: true, result: true } as never);
    });
  });

  afterEach(async () => {
    await cards.shutdown();
  });

  describe("middleware order", () => {
    it("should still answer a command after the text filter was registered", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await bot.handleUpdate(messageUpdate("/help"));

      expect(lastCallTo("sendMessage")?.payload.text).toContain("Durak");
    });

    it("should let ordinary chatter fall through without a reply", async () => {
      await bot.handleUpdate(messageUpdate("just talking"));

      expect(callsTo("sendMessage")).toHaveLength(NEVER);
    });
  });

  describe("opening a card", () => {
    it("should reach the repository from a command with names", async () => {
      await bot.handleUpdate(messageUpdate("/game Oleg, Anya, Roma"));

      expect(repo.openGameSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should strip the @botname suffix Telegram appends in groups", async () => {
      await bot.handleUpdate(messageUpdate("/game@foolproof_bot Oleg, Anya"));

      expect(repo.openGameSpy).toHaveBeenCalledTimes(ONCE);
    });
  });

  describe("the force_reply prompt", () => {
    const answerPrompt = (text: string) =>
      bot.handleUpdate(
        messageUpdate(text, { messageId: PROMPT_MESSAGE_ID, text: PROMPT_TEXT, fromBot: true })
      );

    it("should open a card from a reply to the prompt", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await answerPrompt("Oleg, Anya, Roma");

      expect(repo.openGameSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should never delete a prompt that was answered", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await answerPrompt("Oleg, Anya");

      expect(callsTo("deleteMessage")).toHaveLength(NEVER);
    });

    it("should delete a prompt that was left standing", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await bot.handleUpdate(messageUpdate("/game"));

      expect(lastCallTo("deleteMessage")?.payload.message_id).toBe(PROMPT_MESSAGE_ID);
    });
  });

  describe("a tap on the card", () => {
    it("should survive the round trip through the callback codec", async () => {
      repo.cardByIdSpy.mockReturnValue(
        cardRecordOf(THREE, { state: "RECORDING", starter_player_id: playerIdOf(0) })
      );

      await bot.handleUpdate(
        callbackUpdate(
          encodeCallback({ gameId: 1, action: "pick", slot: 2, version: FIRST_VERSION })
        )
      );

      expect(repo.appendExitSpy).toHaveBeenCalledWith(1, playerIdOf(2), ONCE, expect.any(Number));
    });

    it("should always answer the tap, even when the data is unreadable", async () => {
      await bot.handleUpdate(callbackUpdate("garbage"));

      expect(callsTo("answerCallbackQuery")).toHaveLength(ONCE);
    });

    it("should edit the card once the debounce elapses", async () => {
      repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE));

      await bot.handleUpdate(
        callbackUpdate(
          encodeCallback({ gameId: 1, action: "pick", slot: 0, version: FIRST_VERSION })
        )
      );
      await cards.shutdown();

      expect(callsTo("editMessageText")).toHaveLength(ONCE);
    });
  });
});
