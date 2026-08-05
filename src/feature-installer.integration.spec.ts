import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { ActionKind } from "#live-game/domain/card-states.ts";
import { Bot } from "grammy";
import { createLiveGameFeature } from "#live-game/live-game-feature.ts";
import { encodeCallback } from "#live-game/render/callback-data-codec.ts";
import { installFeatures } from "#app/feature-installer.ts";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import type { Command } from "#shared/telegram/telegram-contexts.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { cardRecordOf, playerIdOf } from "#shared/repository/database-records.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { botInfoStub, callbackUpdate, messageUpdate, PROMPT_MESSAGE_ID } from "#app/telegram-updates.stub.ts";


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
  let stops: readonly (() => Promise<void>)[];
  let calls: ApiCall[];
  let lateCommandSpy: Mock<(ctx: Command) => Promise<void>>;

  const callsTo = (method: string): readonly ApiCall[] =>
    calls.filter((call) => call.method === method);

  const lastCallTo = (method: string): ApiCall | undefined =>
    callsTo(method)[callsTo(method).length - ONCE];

  const flush = async (): Promise<void> => {
    for (const stop of stops) {
      await stop();
    }
  };

  beforeEach(() => {
    repo = new RepositoryStub();
    log = new LoggerStub();
    calls = [];
    lateCommandSpy = vi.fn(async (_ctx: Command) => undefined);

    bot = new Bot(FAKE_TOKEN, { botInfo: botInfoStub });

    const lateFeature: Feature = {
      commands: [
        {
          command: "stats",
          menuDescription: "installed after the one that listens",
          help: "/stats — installed last",
          run: lateCommandSpy,
        },
      ],
    };

    stops = installFeatures(
      bot,
      [createLiveGameFeature({ repo, api: bot.api, log }), lateFeature],
      log
    );

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
    await flush();
  });

  describe("middleware order", () => {
    it("should still answer a command after the text filter was registered", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await bot.handleUpdate(messageUpdate("/help"));

      expect(lastCallTo("sendMessage")?.payload.text).toContain("Durak");
    });

    it("should reach a feature installed after the one that listens to text", async () => {
      await bot.handleUpdate(messageUpdate("/stats"));

      expect(lateCommandSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should let ordinary chatter fall through without a reply", async () => {
      await bot.handleUpdate(messageUpdate("just talking"));

      expect(callsTo("sendMessage")).toHaveLength(NEVER);
    });

    it("should list every installed feature in the help it sends", async () => {
      await bot.handleUpdate(messageUpdate("/help"));

      expect(lastCallTo("sendMessage")?.payload.text).toContain("/stats — installed last");
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
          encodeCallback({ gameId: 1, action: ActionKind.Pick, slot: 2, version: FIRST_VERSION })
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
          encodeCallback({ gameId: 1, action: ActionKind.Pick, slot: 0, version: FIRST_VERSION })
        )
      );
      await flush();

      expect(callsTo("editMessageText")).toHaveLength(ONCE);
    });
  });
});
