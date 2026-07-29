import { beforeEach, describe, expect, it, vi } from "vitest";
import { BotError, type Bot, type Context } from "grammy";
import { cardRecordOf, playerIdOf, seatRecordsOf } from "../../shared/repository/records.stub.ts";
import { RepositoryStub } from "../../shared/repository/repository.stub.ts";
import { LoggerStub } from "../../shared/logger.stub.ts";
import {
  botInfoStub,
  callbackUpdate,
  CHAT_ID,
  COMMAND_MESSAGE_ID,
  messageUpdate,
  PROMPT_MESSAGE_ID,
  USER_ID,
} from "./updates.stub.ts";
import { encodeCallback } from "../render/callback.ts";
import { createBot, publishCommandMenu } from "./router.ts";


const FAKE_TOKEN = "424242:AAHfake-token-for-tests";

const THREE = ["Oleg", "Anya", "Roma"];

const PROMPT_TEXT = "Who is playing? Send the names in seating order.";

const ONCE = 1;

const NEVER = 0;

interface ApiCall {
  readonly method: string;
  readonly payload: Record<string, unknown>;
}

describe("createBot()", () => {
  let repo: RepositoryStub;
  let log: LoggerStub;
  let bot: Bot;
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

  describe("/game", () => {
    it("should open a card when names are given", async () => {
      await bot.handleUpdate(messageUpdate("/game Oleg, Anya, Roma"));

      expect(repo.openGameSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should create players it has not seen before", async () => {
      await bot.handleUpdate(messageUpdate("/game Oleg, Anya"));

      expect(repo.createPlayerSpy).toHaveBeenCalledTimes(2);
    });

    it("should reuse a known player instead of creating a duplicate", async () => {
      repo.playersInChatSpy.mockReturnValue([
        { id: 1, chat_id: CHAT_ID, display_name: "Oleg" },
      ]);

      await bot.handleUpdate(messageUpdate("/game OLEG, Anya"));

      expect(repo.createPlayerSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should treat the same name in another script as a different player", async () => {
      repo.playersInChatSpy.mockReturnValue([
        { id: 1, chat_id: CHAT_ID, display_name: "Oleg" },
      ]);

      await bot.handleUpdate(messageUpdate("/game Олег, Anya"));

      expect(repo.createPlayerSpy).toHaveBeenCalledTimes(2);
    });

    it("should strip the @botname suffix", async () => {
      await bot.handleUpdate(messageUpdate("/game@foolproof_bot Oleg, Anya"));

      expect(repo.openGameSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should seat players lowest id first", async () => {
      repo.createPlayerSpy
        .mockReturnValueOnce({ id: 9, chat_id: CHAT_ID, display_name: "Oleg" })
        .mockReturnValueOnce({ id: 4, chat_id: CHAT_ID, display_name: "Anya" });

      await bot.handleUpdate(messageUpdate("/game Oleg, Anya"));

      expect(repo.openGameSpy).toHaveBeenCalledWith(CHAT_ID, [4, 9]);
    });

    it("should refuse a single player", async () => {
      await bot.handleUpdate(messageUpdate("/game Oleg"));

      expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
      expect(lastCallTo("sendMessage")?.payload.text).toContain("at least two players");
    });

    it("should refuse duplicate names", async () => {
      await bot.handleUpdate(messageUpdate("/game Oleg, Oleg"));

      expect(lastCallTo("sendMessage")?.payload.text).toContain("twice");
    });

    it("should reply on the live card when a game is already running", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));

      await bot.handleUpdate(messageUpdate("/game Oleg, Anya"));

      expect(lastCallTo("sendMessage")?.payload.text).toContain("already in progress");
      expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
    });

    describe("with no names", () => {
      it("should ask for them instead of failing", async () => {
        await bot.handleUpdate(messageUpdate("/game"));

        expect(lastCallTo("sendMessage")?.payload.text).toBe(PROMPT_TEXT);
      });

      it("should force a reply so the input field opens", async () => {
        await bot.handleUpdate(messageUpdate("/game"));
        const markup = lastCallTo("sendMessage")?.payload.reply_markup as {
          force_reply?: boolean;
          selective?: boolean;
        };

        expect(markup.force_reply).toBe(true);
        expect(markup.selective).toBe(true);
      });

      it("should reply to the command so selective has a target", async () => {
        await bot.handleUpdate(messageUpdate("/game"));
        const parameters = lastCallTo("sendMessage")?.payload.reply_parameters as {
          message_id?: number;
        };

        expect(parameters.message_id).toBe(COMMAND_MESSAGE_ID);
      });

      it("should not open a card yet", async () => {
        await bot.handleUpdate(messageUpdate("/game"));

        expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
      });
    });
  });

  describe("answering the name prompt", () => {
    const answerPrompt = (text: string) =>
      bot.handleUpdate(
        messageUpdate(text, {
          messageId: PROMPT_MESSAGE_ID,
          text: PROMPT_TEXT,
          fromBot: true,
        })
      );

    it("should open a card from the reply", async () => {
      await answerPrompt("Oleg, Anya, Roma");

      expect(repo.openGameSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should not delete a prompt that was answered", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await answerPrompt("Oleg, Anya");

      expect(callsTo("deleteMessage")).toHaveLength(NEVER);
    });

    it("should ignore a reply to some other message of the bot", async () => {
      await bot.handleUpdate(
        messageUpdate("Oleg, Anya", {
          messageId: PROMPT_MESSAGE_ID,
          text: "something else entirely",
          fromBot: true,
        })
      );

      expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ignore a quote of the prompt written by a person", async () => {
      await bot.handleUpdate(
        messageUpdate("Oleg, Anya", {
          messageId: PROMPT_MESSAGE_ID,
          text: PROMPT_TEXT,
          fromBot: false,
        })
      );

      expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ignore ordinary chatter", async () => {
      await bot.handleUpdate(messageUpdate("just talking"));

      expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should report a bad lineup from the reply", async () => {
      await answerPrompt("Oleg");

      expect(lastCallTo("sendMessage")?.payload.text).toContain("at least two players");
    });

    it("should refuse when a game started while the prompt was open", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));

      await answerPrompt("Oleg, Anya");

      expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("clearing an unanswered prompt", () => {
    it("should delete a standing prompt when /game runs again", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await bot.handleUpdate(messageUpdate("/game"));

      expect(callsTo("deleteMessage")).toHaveLength(ONCE);
    });

    it("should delete a standing prompt when /next runs", async () => {
      repo.lastLineupSpy.mockReturnValue(seatRecordsOf(...THREE));

      await bot.handleUpdate(messageUpdate("/game"));
      await bot.handleUpdate(messageUpdate("/next"));

      expect(lastCallTo("deleteMessage")?.payload.message_id).toBe(PROMPT_MESSAGE_ID);
    });

    it("should keep at most one prompt alive", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await bot.handleUpdate(messageUpdate("/game"));
      await bot.handleUpdate(messageUpdate("/game"));

      expect(callsTo("deleteMessage")).toHaveLength(2);
    });

    it("should not try to delete when no prompt is standing", async () => {
      await bot.handleUpdate(messageUpdate("/game Oleg, Anya"));

      expect(callsTo("deleteMessage")).toHaveLength(NEVER);
    });

    it("should survive Telegram refusing the delete", async () => {
      bot.api.config.use((_prev, method) => {
        if (method === "deleteMessage") {
          return Promise.reject(new Error("message to delete not found"));
        }

        return Promise.resolve({ ok: true, result: { message_id: PROMPT_MESSAGE_ID } } as never);
      });

      await bot.handleUpdate(messageUpdate("/game"));

      await expect(bot.handleUpdate(messageUpdate("/game"))).resolves.toBeUndefined();
      expect(log.debugSpy).toHaveBeenCalledTimes(ONCE);
    });
  });

  describe("/next", () => {
    it("should reuse the previous lineup", async () => {
      repo.lastLineupSpy.mockReturnValue(seatRecordsOf(...THREE));

      await bot.handleUpdate(messageUpdate("/next"));

      expect(repo.openGameSpy).toHaveBeenCalledWith(CHAT_ID, [
        playerIdOf(0),
        playerIdOf(1),
        playerIdOf(2),
      ]);
    });

    it("should explain when there is nothing to repeat", async () => {
      repo.lastLineupSpy.mockReturnValue(null);

      await bot.handleUpdate(messageUpdate("/next"));

      expect(lastCallTo("sendMessage")?.payload.text).toContain("No previous line-up");
    });

    it("should treat an empty lineup as nothing to repeat", async () => {
      repo.lastLineupSpy.mockReturnValue([]);

      await bot.handleUpdate(messageUpdate("/next"));

      expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse while a game is live", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));
      repo.lastLineupSpy.mockReturnValue(seatRecordsOf(...THREE));

      await bot.handleUpdate(messageUpdate("/next"));

      expect(repo.openGameSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("/stats", () => {
    it("should ask the repository for the current session", async () => {
      await bot.handleUpdate(messageUpdate("/stats"));

      expect(repo.seriesStatsSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should send the tally as HTML", async () => {
      repo.seriesStatsSpy.mockReturnValue({
        games: 2,
        players: [{ playerId: 1, displayName: "Roma", games: 2, wins: 0, fools: 2 }],
      });

      await bot.handleUpdate(messageUpdate("/stats"));

      expect(lastCallTo("sendMessage")?.payload.parse_mode).toBe("HTML");
      expect(lastCallTo("sendMessage")?.payload.text).toContain("Roma");
    });
  });

  describe("/help", () => {
    it("should explain the commands", async () => {
      await bot.handleUpdate(messageUpdate("/help"));

      expect(lastCallTo("sendMessage")?.payload.text).toContain("/game");
    });

    it("should still work after the text handler was registered", async () => {
      await bot.handleUpdate(messageUpdate("/game"));
      await bot.handleUpdate(messageUpdate("/help"));

      expect(lastCallTo("sendMessage")?.payload.text).toContain("Durak");
    });
  });

  describe("callback queries", () => {
    it("should always answer a tap", async () => {
      repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE));

      await bot.handleUpdate(
        callbackUpdate(encodeCallback({ gameId: 1, action: "pick", slot: 0, version: 0 }))
      );

      expect(callsTo("answerCallbackQuery")).toHaveLength(ONCE);
    });

    it("should answer even when the data is unreadable", async () => {
      await bot.handleUpdate(callbackUpdate("garbage"));

      expect(lastCallTo("answerCallbackQuery")?.payload.text).toBe("Card updated — look again");
    });

    it("should record the tap against the card", async () => {
      repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE));

      await bot.handleUpdate(
        callbackUpdate(encodeCallback({ gameId: 1, action: "pick", slot: 1, version: 0 }))
      );

      expect(repo.updateCardSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should attribute the tap to whoever pressed it", async () => {
      repo.cardByIdSpy.mockReturnValue(
        cardRecordOf(THREE, { state: "RECORDING", starter_player_id: playerIdOf(0) })
      );

      await bot.handleUpdate(
        callbackUpdate(encodeCallback({ gameId: 1, action: "pick", slot: 2, version: 0 }))
      );

      expect(repo.appendExitSpy).toHaveBeenCalledWith(1, playerIdOf(2), 1, USER_ID);
    });
  });

  describe("error handling", () => {
    const failingUpdateId = 99;

    it("should log a failing update rather than staying silent", async () => {
      const context = { update: { update_id: failingUpdateId } } as unknown as Context;

      await bot.errorHandler(new BotError(new Error("database is locked"), context));

      expect(log.errorSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should name the update and the cause", async () => {
      const context = { update: { update_id: failingUpdateId } } as unknown as Context;

      await bot.errorHandler(new BotError(new Error("database is locked"), context));

      expect(log.errorSpy.mock.calls[0]?.[0]).toContain("database is locked");
    });
  });
});

describe("publishCommandMenu()", () => {
  it("should register every implemented command", async () => {
    const setMyCommands = vi.fn().mockResolvedValue(true);

    await publishCommandMenu({ setMyCommands } as unknown as Parameters<
      typeof publishCommandMenu
    >[0]);

    const registered = (setMyCommands.mock.calls[0]?.[0] ?? []).map(
      (entry: { command: string }) => entry.command
    );

    expect(registered).toEqual(["game", "next", "stats", "help"]);
  });

  it("should describe each command for the menu", async () => {
    const setMyCommands = vi.fn().mockResolvedValue(true);

    await publishCommandMenu({ setMyCommands } as unknown as Parameters<
      typeof publishCommandMenu
    >[0]);

    const described = (setMyCommands.mock.calls[0]?.[0] ?? []).every(
      (entry: { description: string }) => entry.description.length > 0
    );

    expect(described).toBe(true);
  });
});
