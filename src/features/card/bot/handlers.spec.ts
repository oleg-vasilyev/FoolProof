import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "../../../shared/repository/repository.stub.ts";
import {
  cardRecordOf,
  playerIdOf,
  seatRecordsOf,
} from "../../../shared/repository/records.stub.ts";
import { strings } from "../strings.ts";
import { CardServiceStub } from "./cards.stub.ts";
import {
  CHAT_ID,
  COMMAND_MESSAGE_ID,
  ContextStub,
  SENT_MESSAGE_ID,
  USER_ID,
} from "./context.stub.ts";
import { PromptRegistryStub } from "./prompts.stub.ts";


const parseLineupSpy = vi.fn();

const normalizeNameSpy = vi.fn();

const rotateToLowestIdSpy = vi.fn();

const decodeCallbackSpy = vi.fn();

vi.mock("../domain/lineup.ts", () => ({
  parseLineup: (text: string) => parseLineupSpy(text),
  normalizeName: (name: string) => normalizeNameSpy(name),
  rotateToLowestId: (seats: unknown) => rotateToLowestIdSpy(seats),
}));

vi.mock("../render/callback.ts", () => ({
  decodeCallback: (data: string) => decodeCallbackSpy(data),
}));

const { onGame, onNamesReply, onNext, onTap } = await import("./handlers.ts");

const ONCE = 1;

const NEVER = 0;

const THREE = ["Oleg", "Anya", "Roma"];

const TAP_NOTICE = "Oleg — 1";

const ROTATED = [{ playerId: 4, displayName: "Anya" }];

describe("card handlers", () => {
  let repo: RepositoryStub;
  let cards: CardServiceStub;
  let prompts: PromptRegistryStub;
  let ctx: ContextStub;

  const context = () => ({ repo, cards: cards.service, prompts: prompts.registry });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    cards = new CardServiceStub();
    prompts = new PromptRegistryStub();
    ctx = new ContextStub();

    normalizeNameSpy.mockImplementation((name: string) => name.toLowerCase());
    rotateToLowestIdSpy.mockReturnValue(ROTATED);
    parseLineupSpy.mockReturnValue({ ok: true, names: THREE });
    decodeCallbackSpy.mockReturnValue({ gameId: 1, action: "pick", slot: 0, version: 0 });
    cards.tapSpy.mockResolvedValue(TAP_NOTICE);
  });

  describe("onGame()", () => {
    it("should clear a prompt nobody answered before doing anything else", async () => {
      await onGame(context(), ctx.command("/game Oleg, Anya, Roma"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should open a card with the seating the lineup produced", async () => {
      await onGame(context(), ctx.command("/game Oleg, Anya, Roma"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED);
    });

    it("should create a player it has not seen before", async () => {
      parseLineupSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await onGame(context(), ctx.command("/game Dima"));

      expect(repo.createPlayerSpy).toHaveBeenCalledWith(CHAT_ID, "Dima");
    });

    it("should reuse a known player instead of creating a duplicate", async () => {
      repo.playersInChatSpy.mockReturnValue([{ id: 7, chat_id: CHAT_ID, display_name: "Oleg" }]);
      parseLineupSpy.mockReturnValue({ ok: true, names: ["OLEG"] });

      await onGame(context(), ctx.command("/game OLEG"));

      expect(repo.createPlayerSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse while a card is live", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));

      await onGame(context(), ctx.command("/game Oleg, Anya"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should point the refusal at the live card", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));

      await onGame(context(), ctx.command("/game Oleg, Anya"));

      expect(ctx.lastReply().text).toBe(strings.gameAlreadyRunning);
    });

    it("should report a lineup the parser rejected", async () => {
      parseLineupSpy.mockReturnValue({ ok: false, problem: "too_few" });

      await onGame(context(), ctx.command("/game Oleg"));

      expect(ctx.lastReply().text).toBe(strings.lineupTooFew);
    });

    it("should name the duplicates it refused", async () => {
      parseLineupSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Oleg"] });

      await onGame(context(), ctx.command("/game Oleg, Oleg"));

      expect(ctx.lastReply().text).toBe(strings.lineupDuplicates(["Oleg"]));
    });

    describe("with no names", () => {
      beforeEach(() => {
        parseLineupSpy.mockReturnValue({ ok: false, problem: "empty" });
      });

      it("should ask for them instead of failing", async () => {
        await onGame(context(), ctx.command("/game"));

        expect(ctx.lastReply().text).toBe(strings.lineupPrompt);
      });

      it("should force a reply so the input field opens", async () => {
        await onGame(context(), ctx.command("/game"));

        expect(ctx.lastReply().options.reply_markup).toMatchObject({
          force_reply: true,
          selective: true,
        });
      });

      it("should reply to the command so selective has a target", async () => {
        await onGame(context(), ctx.command("/game"));

        expect(ctx.lastReply().options.reply_parameters).toEqual({
          message_id: COMMAND_MESSAGE_ID,
        });
      });

      it("should quote nothing when the command carried no message", async () => {
        await onGame(context(), ctx.commandWithoutMessage());

        expect(ctx.lastReply().options.reply_parameters).toBeUndefined();
      });

      it("should remember the prompt so it can be withdrawn", async () => {
        await onGame(context(), ctx.command("/game"));

        expect(prompts.rememberSpy).toHaveBeenCalledWith(CHAT_ID, SENT_MESSAGE_ID);
      });

      it("should not open a card yet", async () => {
        await onGame(context(), ctx.command("/game"));

        expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
      });
    });
  });

  describe("onNext()", () => {
    it("should clear a prompt nobody answered", async () => {
      repo.lastLineupSpy.mockReturnValue(seatRecordsOf(...THREE));

      await onNext(context(), ctx.command("/next"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should reopen the previous lineup in its recorded order", async () => {
      repo.lastLineupSpy.mockReturnValue(seatRecordsOf(...THREE));

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, [
        { playerId: playerIdOf(0), displayName: "Oleg" },
        { playerId: playerIdOf(1), displayName: "Anya" },
        { playerId: playerIdOf(2), displayName: "Roma" },
      ]);
    });

    it("should explain when there is nothing to repeat", async () => {
      repo.lastLineupSpy.mockReturnValue(null);

      await onNext(context(), ctx.command("/next"));

      expect(ctx.lastReply().text).toBe(strings.noLineupToRepeat);
    });

    it("should treat an empty lineup as nothing to repeat", async () => {
      repo.lastLineupSpy.mockReturnValue([]);

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse while a card is live", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));
      repo.lastLineupSpy.mockReturnValue(seatRecordsOf(...THREE));

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("onNamesReply()", () => {
    const answer = (text: string) =>
      ctx.textMessage(text, { text: strings.lineupPrompt, fromBot: true });

    it("should open a card from the reply", async () => {
      await onNamesReply(context(), answer("Oleg, Anya, Roma"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED);
    });

    it("should stop tracking the prompt once it is answered", async () => {
      await onNamesReply(context(), answer("Oleg, Anya"));

      expect(prompts.forgetSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should ignore a reply to some other message of the bot", async () => {
      await onNamesReply(
        context(),
        ctx.textMessage("Oleg, Anya", { text: "something else", fromBot: true })
      );

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ignore a quote of the prompt written by a person", async () => {
      await onNamesReply(
        context(),
        ctx.textMessage("Oleg, Anya", { text: strings.lineupPrompt, fromBot: false })
      );

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ignore ordinary chatter", async () => {
      await onNamesReply(context(), ctx.textMessage("just talking"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse when a card went live while the prompt stood", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));

      await onNamesReply(context(), answer("Oleg, Anya"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("onTap()", () => {
    it("should answer with whatever the card service decided", async () => {
      await onTap(context(), ctx.callbackTap("1:p:0:0"));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(TAP_NOTICE);
    });

    it("should attribute the tap to whoever pressed it", async () => {
      await onTap(context(), ctx.callbackTap("1:p:0:0"));

      expect(cards.tapSpy).toHaveBeenCalledWith(
        { gameId: 1, action: "pick", slot: 0, version: 0 },
        USER_ID
      );
    });

    it("should answer even when the data is unreadable", async () => {
      decodeCallbackSpy.mockReturnValue(null);

      await onTap(context(), ctx.callbackTap("garbage"));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(strings.cardStale);
    });

    it("should not reach the card service for unreadable data", async () => {
      decodeCallbackSpy.mockReturnValue(null);

      await onTap(context(), ctx.callbackTap("garbage"));

      expect(cards.tapSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should always answer exactly once", async () => {
      await onTap(context(), ctx.callbackTap("1:p:0:0"));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledTimes(ONCE);
    });
  });
});
