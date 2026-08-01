import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import {
  cardRecordOf,
  playerIdOf,
  seatRecordsOf,
} from "#shared/repository/database-records.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { CardServiceStub } from "#live-game/bot/card-service.stub.ts";
import {
  CHAT_ID,
  COMMAND_MESSAGE_ID,
  ContextStub,
  SENT_MESSAGE_ID,
  USER_ID,
} from "#live-game/bot/grammy-context.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";


const parseLineupSpy = vi.fn();

const parseNamesSpy = vi.fn();

const normalizeNameSpy = vi.fn();

const rotateToLowestIdSpy = vi.fn();

const decodeCallbackSpy = vi.fn();

const starterAfterLossSpy = vi.fn();

vi.mock("#live-game/domain/lineup-parsing.ts", () => ({
  parseLineup: (text: string) => parseLineupSpy(text),
  parseNames: (text: string) => parseNamesSpy(text),
  normalizeName: (name: string) => normalizeNameSpy(name),
  rotateToLowestId: (seats: unknown) => rotateToLowestIdSpy(seats),
}));

vi.mock("#live-game/domain/starter-rule.ts", () => ({
  starterAfterLoss: (seats: unknown, loserIds: unknown) => starterAfterLossSpy(seats, loserIds),
}));

const alreadySeatedSpy = vi.fn();

const tableWithoutSpy = vi.fn();

vi.mock("#live-game/domain/table-change.ts", () => ({
  alreadySeated: (seats: unknown, names: unknown) => alreadySeatedSpy(seats, names),
  tableWithout: (seats: unknown, names: unknown) => tableWithoutSpy(seats, names),
}));

vi.mock("#live-game/render/callback-data-codec.ts", () => ({
  decodeCallback: (data: string) => decodeCallbackSpy(data),
}));

const {
  onGame,
  onNamesReply,
  onNext,
  onNextWith,
  onNextWithout,
  onTap,
} = await import("#live-game/bot/update-handlers.ts");

const ONCE = 1;

const NEVER = 0;

const THREE = ["Oleg", "Anya", "Roma"];

const TAP_NOTICE = "Oleg — 1";

const ROTATED = [{ playerId: 4, displayName: "Anya" }];

const NO_LOSERS: readonly number[] = [];

const DISTINCTIVE_STARTER_SLOT = 91;

const NEW_PLAYER_ID = 1;

const KNOWN_PLAYER_ID = 7;

const OLEG_SEAT = { playerId: playerIdOf(0), displayName: "Oleg" };

const ANYA_SEAT = { playerId: playerIdOf(1), displayName: "Anya" };

const ROMA_SEAT = { playerId: playerIdOf(2), displayName: "Roma" };

const PREVIOUS_SEATS = [OLEG_SEAT, ANYA_SEAT, ROMA_SEAT];

const DISTINCT_PLAYER_ID = 99;

const DISTINCT_SEATS = [{ playerId: DISTINCT_PLAYER_ID, displayName: "Zzz" }];

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
    parseNamesSpy.mockReturnValue({ ok: true, names: [] });
    decodeCallbackSpy.mockReturnValue({ gameId: 1, action: "pick", slot: 0, version: 0 });
    starterAfterLossSpy.mockReturnValue(null);
    alreadySeatedSpy.mockReturnValue([]);
    tableWithoutSpy.mockReturnValue({ ok: true, seats: PREVIOUS_SEATS });
    cards.tapSpy.mockResolvedValue(TAP_NOTICE);
  });

  describe("onGame()", () => {
    it("should clear a prompt nobody answered before doing anything else", async () => {
      await onGame(context(), ctx.command("/game Oleg, Anya, Roma"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should open a card with the seating the lineup produced, deal picked by hand", async () => {
      await onGame(context(), ctx.command("/game Oleg, Anya, Roma"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED, null);
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

      expect(ctx.lastReply().text).toBe(copy.gameAlreadyRunning);
    });

    it("should report a lineup the parser rejected", async () => {
      parseLineupSpy.mockReturnValue({ ok: false, problem: "too_few" });

      await onGame(context(), ctx.command("/game Oleg"));

      expect(ctx.lastReply().text).toBe(copy.lineupTooFew);
    });

    it("should name the duplicates it refused", async () => {
      parseLineupSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Oleg"] });

      await onGame(context(), ctx.command("/game Oleg, Oleg"));

      expect(ctx.lastReply().text).toBe(copy.lineupDuplicates(["Oleg"]));
    });

    describe("with no names", () => {
      beforeEach(() => {
        parseLineupSpy.mockReturnValue({ ok: false, problem: "empty" });
      });

      it("should ask for them instead of failing", async () => {
        await onGame(context(), ctx.command("/game"));

        expect(ctx.lastReply().text).toBe(copy.lineupPrompt);
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
      repo.lastGameSpy.mockReturnValue({ seats: seatRecordsOf(...THREE), loserIds: NO_LOSERS });

      await onNext(context(), ctx.command("/next"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should ask the starter rule for the slot after the loss", async () => {
      const loserIds = [playerIdOf(1)];
      repo.lastGameSpy.mockReturnValue({ seats: seatRecordsOf(...THREE), loserIds });

      await onNext(context(), ctx.command("/next"));

      expect(starterAfterLossSpy).toHaveBeenCalledWith(
        [OLEG_SEAT, ANYA_SEAT, ROMA_SEAT],
        loserIds
      );
    });

    it("should pass the starter rule's slot straight through to open", async () => {
      repo.lastGameSpy.mockReturnValue({ seats: seatRecordsOf(...THREE), loserIds: NO_LOSERS });
      starterAfterLossSpy.mockReturnValue(DISTINCTIVE_STARTER_SLOT);

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledWith(
        CHAT_ID,
        [OLEG_SEAT, ANYA_SEAT, ROMA_SEAT],
        DISTINCTIVE_STARTER_SLOT
      );
    });

    it("should explain when there is nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await onNext(context(), ctx.command("/next"));

      expect(ctx.lastReply().text).toBe(copy.noLineupToRepeat);
    });

    it("should treat an empty lineup as nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue({ seats: [], loserIds: NO_LOSERS });

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse while a card is live", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));
      repo.lastGameSpy.mockReturnValue({ seats: seatRecordsOf(...THREE), loserIds: NO_LOSERS });

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("onNextWith()", () => {
    beforeEach(() => {
      repo.lastGameSpy.mockReturnValue({ seats: seatRecordsOf(...THREE), loserIds: NO_LOSERS });
    });

    it("should clear a prompt nobody answered", async () => {
      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should refuse while a card is live", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should explain when there is nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(ctx.lastReply().text).toBe(copy.noLineupToRepeat);
    });

    it("should ask who is joining when no names were given", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await onNextWith(context(), ctx.command("/next_with"));

      expect(ctx.lastReply().text).toBe(copy.joinersMissing);
    });

    it("should not open a card when no names were given", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await onNextWith(context(), ctx.command("/next_with"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should read a message it cannot reach as naming nobody", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await onNextWith(context(), ctx.commandWithoutMessage());

      expect(parseNamesSpy).toHaveBeenCalledWith("");
      expect(ctx.lastReply().text).toBe(copy.joinersMissing);
    });

    it("should name a repeated joiner the parser rejected", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima, Dima"));

      expect(ctx.lastReply().text).toBe(copy.lineupDuplicates(["Dima"]));
    });

    it("should ask the domain which joiners are already seated", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(alreadySeatedSpy).toHaveBeenCalledWith(PREVIOUS_SEATS, ["Dima"]);
    });

    it("should refuse a name already seated at the table", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Oleg"] });
      alreadySeatedSpy.mockReturnValue(["Oleg"]);

      await onNextWith(context(), ctx.command("/next_with Oleg"));

      expect(ctx.lastReply().text).toBe(copy.alreadyAtTable(["Oleg"]));
    });

    it("should not open a card when a joiner is already seated", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Oleg"] });
      alreadySeatedSpy.mockReturnValue(["Oleg"]);

      await onNextWith(context(), ctx.command("/next_with Oleg"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should not create a player when the command is refused for an already-seated name", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Oleg"] });
      alreadySeatedSpy.mockReturnValue(["Oleg"]);

      await onNextWith(context(), ctx.command("/next_with Oleg"));

      expect(repo.createPlayerSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should seat the previous line-up first and the joiners after, then rotate", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(rotateToLowestIdSpy).toHaveBeenCalledWith([
        OLEG_SEAT,
        ANYA_SEAT,
        ROMA_SEAT,
        { playerId: NEW_PLAYER_ID, displayName: "Dima" },
      ]);
    });

    it("should open the rotated seating with the deal picked by hand", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED, null);
    });

    it("should create a joiner it has not seen before", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(repo.createPlayerSpy).toHaveBeenCalledWith(CHAT_ID, "Dima");
    });

    it("should not create a joiner already known to the chat", async () => {
      repo.playersInChatSpy.mockReturnValue([
        { id: KNOWN_PLAYER_ID, chat_id: CHAT_ID, display_name: "Dima" },
      ]);
      parseNamesSpy.mockReturnValue({ ok: true, names: ["dima"] });

      await onNextWith(context(), ctx.command("/next_with dima"));

      expect(repo.createPlayerSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("onNextWithout()", () => {
    beforeEach(() => {
      repo.lastGameSpy.mockReturnValue({ seats: seatRecordsOf(...THREE), loserIds: NO_LOSERS });
    });

    it("should clear a prompt nobody answered", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Anya"] });

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should refuse while a card is live", async () => {
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should explain when there is nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(ctx.lastReply().text).toBe(copy.noLineupToRepeat);
    });

    it("should ask who is sitting out when no names were given", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await onNextWithout(context(), ctx.command("/next_without"));

      expect(ctx.lastReply().text).toBe(copy.leaversMissing);
    });

    it("should open nothing when no names were given", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await onNextWithout(context(), ctx.command("/next_without"));

      expect(tableWithoutSpy).toHaveBeenCalledTimes(NEVER);
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ask the domain to remove the leavers from the previous seats", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Anya"] });

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(tableWithoutSpy).toHaveBeenCalledWith(PREVIOUS_SEATS, ["Anya"]);
    });

    it("should name a leaver who was never at the table", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });
      tableWithoutSpy.mockReturnValue({ ok: false, problem: "unknown_names", names: ["Dima"] });

      await onNextWithout(context(), ctx.command("/next_without Dima"));

      expect(ctx.lastReply().text).toBe(copy.notAtTable(["Dima"]));
    });

    it("should not open a card for a leaver who was never at the table", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });
      tableWithoutSpy.mockReturnValue({ ok: false, problem: "unknown_names", names: ["Dima"] });

      await onNextWithout(context(), ctx.command("/next_without Dima"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse when too few players would remain", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Oleg", "Anya"] });
      tableWithoutSpy.mockReturnValue({ ok: false, problem: "too_few" });

      await onNextWithout(context(), ctx.command("/next_without Oleg, Anya"));

      expect(ctx.lastReply().text).toBe(copy.lineupTooFew);
    });

    it("should not open a card when too few players would remain", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Oleg", "Anya"] });
      tableWithoutSpy.mockReturnValue({ ok: false, problem: "too_few" });

      await onNextWithout(context(), ctx.command("/next_without Oleg, Anya"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should rotate whatever seats the domain change returned", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Anya"] });
      tableWithoutSpy.mockReturnValue({ ok: true, seats: DISTINCT_SEATS });

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(rotateToLowestIdSpy).toHaveBeenCalledWith(DISTINCT_SEATS);
    });

    it("should open the rotated seating with the deal picked by hand", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Anya"] });
      tableWithoutSpy.mockReturnValue({ ok: true, seats: DISTINCT_SEATS });

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED, null);
    });

    it("should never create a player", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Anya"] });

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(repo.createPlayerSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("onNamesReply()", () => {
    const answer = (text: string) =>
      ctx.textMessage(text, { text: copy.lineupPrompt, fromBot: true });

    it("should open a card from the reply, deal picked by hand", async () => {
      await onNamesReply(context(), answer("Oleg, Anya, Roma"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED, null);
    });

    it("should ask again when the reply names nobody at all", async () => {
      parseLineupSpy.mockReturnValue({ ok: false, problem: "empty" });

      await onNamesReply(context(), answer(", ,"));

      expect(ctx.replySpy).toHaveBeenCalledWith(copy.lineupMissing);
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
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
        ctx.textMessage("Oleg, Anya", { text: copy.lineupPrompt, fromBot: false })
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

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.cardStale);
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
