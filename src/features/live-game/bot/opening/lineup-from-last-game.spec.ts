import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { playerIdOf, seatRecordsOf } from "#shared/repository/database-records.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { CardServiceStub } from "#live-game/bot/card/card-service.stub.ts";
import { CHAT_ID, ContextStub } from "#live-game/bot/grammy-context.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";


const parseNamesSpy = vi.fn();

const rotateToLowestIdSpy = vi.fn();

vi.mock("#live-game/domain/lineup-parsing.ts", () => ({
  parseNames: (text: string) => parseNamesSpy(text),
  rotateToLowestId: (seats: unknown) => rotateToLowestIdSpy(seats),
}));

const starterAfterLossSpy = vi.fn();

vi.mock("#live-game/domain/starter-rule.ts", () => ({
  starterAfterLoss: (seats: unknown, loserIds: unknown) => starterAfterLossSpy(seats, loserIds),
}));

const alreadySeatedSpy = vi.fn();

const tableWithSpy = vi.fn();

const tableWithoutSpy = vi.fn();

vi.mock("#live-game/domain/table-change.ts", () => ({
  alreadySeated: (seats: unknown, names: unknown) => alreadySeatedSpy(seats, names),
  tableWith: (seats: unknown, joining: unknown) => tableWithSpy(seats, joining),
  tableWithout: (seats: unknown, names: unknown) => tableWithoutSpy(seats, names),
}));

const askForNamesSpy = vi.fn();

const commandTextSpy = vi.fn();

const COMMAND_TEXT = "the text the command carried";

const refusedBecauseLiveSpy = vi.fn();

vi.mock("#live-game/bot/card-context.ts", () => ({
  askForNames: (context: unknown, ctx: unknown, question: unknown, placeholder: unknown) =>
    askForNamesSpy(context, ctx, question, placeholder),
  commandText: (ctx: unknown) => commandTextSpy(ctx),
  refusedBecauseLive: (context: unknown, ctx: unknown) => refusedBecauseLiveSpy(context, ctx),
}));

vi.mock("#live-game/bot/card/card-service.ts", () => ({
  PICKED_BY_HAND: null,
}));

const MOST_PLAYERS = 7;

const LONGEST_NAME = 5;

vi.mock("#live-game/domain/card-state.ts", () => ({ MOST_PLAYERS, LONGEST_NAME }));

const namePreviewsSpy = vi.fn();

vi.mock("#live-game/render/name-preview.ts", () => ({
  namePreviews: (names: unknown) => namePreviewsSpy(names),
}));

const askSeatingSpy = vi.fn();

vi.mock("#live-game/bot/opening/seating-screen.ts", () => ({
  askSeating: (ctx: unknown, seats: unknown) => askSeatingSpy(ctx, seats),
}));

const resolveSeatsSpy = vi.fn();

const toSeatsSpy = vi.fn();

vi.mock("#live-game/bot/opening/seat-lookup.ts", () => ({
  resolveSeats: (repo: unknown, chatId: unknown, names: unknown) =>
    resolveSeatsSpy(repo, chatId, names),
  toSeats: (records: unknown) => toSeatsSpy(records),
}));

const {
  joinFromNames,
  leaveFromNames,
  onNext,
  onNextWith,
  onNextWithout,
} = await import("#live-game/bot/opening/lineup-from-last-game.ts");

const NEVER = 0;

const THREE = ["Oleg", "Anya", "Roma"];

const RAW_SEATS = seatRecordsOf(...THREE);

const OLEG_SEAT = { playerId: playerIdOf(0), displayName: "Oleg" };

const ANYA_SEAT = { playerId: playerIdOf(1), displayName: "Anya" };

const ROMA_SEAT = { playerId: playerIdOf(2), displayName: "Roma" };

const MAPPED_SEATS = [OLEG_SEAT, ANYA_SEAT, ROMA_SEAT];

const NO_LOSERS: readonly number[] = [];

const DISTINCTIVE_STARTER_SLOT = 91;

const ROTATED = [{ playerId: 4, displayName: "Anya" }];

const NEW_PLAYER_ID = 1;

const JOINER_SEATS = [{ playerId: NEW_PLAYER_ID, displayName: "Dima" }];

const SEATED_TOGETHER = [{ playerId: 41, displayName: "the whole new table" }];

const SHORTENED = ["short enough to send"];

const DISTINCT_PLAYER_ID = 99;

const DISTINCT_SEATS = [{ playerId: DISTINCT_PLAYER_ID, displayName: "Zzz" }];

describe("a line-up taken from the last game", () => {
  let repo: RepositoryStub;
  let cards: CardServiceStub;
  let prompts: PromptRegistryStub;
  let ctx: ContextStub;

  const context = () => ({ repo, cards: cards.service, prompts: prompts.registry });

  beforeEach(() => {
    vi.clearAllMocks();

    commandTextSpy.mockReturnValue(COMMAND_TEXT);

    repo = new RepositoryStub();
    cards = new CardServiceStub();
    prompts = new PromptRegistryStub();
    ctx = new ContextStub();

    repo.lastGameSpy.mockReturnValue({ seats: RAW_SEATS, loserIds: NO_LOSERS });
    refusedBecauseLiveSpy.mockResolvedValue(false);
    askForNamesSpy.mockResolvedValue(undefined);
    toSeatsSpy.mockReturnValue(MAPPED_SEATS);
    resolveSeatsSpy.mockReturnValue(JOINER_SEATS);
    rotateToLowestIdSpy.mockReturnValue(ROTATED);
    parseNamesSpy.mockReturnValue({ ok: true, names: [] });
    starterAfterLossSpy.mockReturnValue(null);
    alreadySeatedSpy.mockReturnValue([]);
    namePreviewsSpy.mockReturnValue(SHORTENED);
    tableWithSpy.mockReturnValue({ ok: true, seats: SEATED_TOGETHER });
    tableWithoutSpy.mockReturnValue({ ok: true, seats: MAPPED_SEATS });
  });

  describe("onNext()", () => {
    it("should clear a prompt nobody answered", async () => {
      await onNext(context(), ctx.command("/next"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should refuse while a card is live", async () => {
      refusedBecauseLiveSpy.mockResolvedValue(true);

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should explain when there is nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await onNext(context(), ctx.command("/next"));

      expect(ctx.lastReply().text).toBe(copy.noLineupToRepeat);
    });

    it("should treat a seatless last game as nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue({ seats: [], loserIds: NO_LOSERS });

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ask the starter rule for the slot after the loss, using the mapped seats", async () => {
      const loserIds = [playerIdOf(1)];
      repo.lastGameSpy.mockReturnValue({ seats: RAW_SEATS, loserIds });

      await onNext(context(), ctx.command("/next"));

      expect(starterAfterLossSpy).toHaveBeenCalledWith(MAPPED_SEATS, loserIds);
    });

    it("should pass the starter rule's slot straight through to open", async () => {
      starterAfterLossSpy.mockReturnValue(DISTINCTIVE_STARTER_SLOT);

      await onNext(context(), ctx.command("/next"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, MAPPED_SEATS, DISTINCTIVE_STARTER_SLOT);
    });
  });

  describe("onNextWith()", () => {
    it("should clear a prompt nobody answered", async () => {
      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should refuse while a card is live", async () => {
      refusedBecauseLiveSpy.mockResolvedValue(true);

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should explain when there is nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(ctx.lastReply().text).toBe(copy.noLineupToRepeat);
    });

    it("should parse exactly the text commandText gave back for the context it received", async () => {
      const built = context();
      const command = ctx.command("/next_with Dima");

      await onNextWith(built, command);

      expect(commandTextSpy).toHaveBeenCalledWith(command);
      expect(parseNamesSpy).toHaveBeenCalledWith(COMMAND_TEXT);
    });

    it("should ask who is joining when no names were given", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      const cmd = ctx.command("/next_with");

      await onNextWith(context(), cmd);

      expect(askForNamesSpy).toHaveBeenCalledWith(
        context(),
        cmd,
        copy.joinersPrompt,
        copy.joinersPlaceholder
      );
    });

    it("should not open a card when no names were given", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await onNextWith(context(), ctx.command("/next_with"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should name a repeated joiner the parser rejected", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima, Dima"));

      expect(ctx.lastReply().text).toBe(copy.lineupDuplicates(["Dima"]));
    });

    it("should ask nothing when a joiner is repeated", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima, Dima"));

      expect(askForNamesSpy).toHaveBeenCalledTimes(NEVER);
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ask the domain which joiners are already seated, using the mapped seats", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(alreadySeatedSpy).toHaveBeenCalledWith(MAPPED_SEATS, ["Dima"]);
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

    it("should not strand a player row when the command is refused for an already-seated name", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Oleg"] });
      alreadySeatedSpy.mockReturnValue(["Oleg"]);

      await onNextWith(context(), ctx.command("/next_with Oleg"));

      expect(repo.createPlayerSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should resolve the joiners against the chat's players", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(resolveSeatsSpy).toHaveBeenCalledWith(repo, CHAT_ID, ["Dima"]);
    });

    it("should offer the previous line-up first and the joiners after", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(tableWithSpy).toHaveBeenCalledWith(MAPPED_SEATS, JOINER_SEATS);
      expect(askSeatingSpy).toHaveBeenCalledWith(expect.anything(), SEATED_TOGETHER);
    });

    it("should refuse a table the joiners would overfill", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });
      tableWithSpy.mockReturnValue({ ok: false, problem: "too_many" });

      await onNextWith(context(), ctx.command("/next_with Dima"));

      expect(ctx.lastReply().text).toBe(copy.lineupTooMany(MOST_PLAYERS));
      expect(askSeatingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ask where everyone sits rather than open a card, since a joiner sits anywhere", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      const command = ctx.command("/next_with Dima");

      await onNextWith(context(), command);

      expect(askSeatingSpy).toHaveBeenCalledWith(command, expect.anything());
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("onNextWithout()", () => {
    it("should clear a prompt nobody answered", async () => {
      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should refuse while a card is live", async () => {
      refusedBecauseLiveSpy.mockResolvedValue(true);

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should explain when there is nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(ctx.lastReply().text).toBe(copy.noLineupToRepeat);
    });

    it("should parse exactly the text commandText gave back for the context it received", async () => {
      const built = context();
      const command = ctx.command("/next_without Anya");

      await onNextWithout(built, command);

      expect(commandTextSpy).toHaveBeenCalledWith(command);
      expect(parseNamesSpy).toHaveBeenCalledWith(COMMAND_TEXT);
    });

    it("should ask who is sitting out when no names were given", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      const cmd = ctx.command("/next_without");

      await onNextWithout(context(), cmd);

      expect(askForNamesSpy).toHaveBeenCalledWith(
        context(),
        cmd,
        copy.leaversPrompt,
        copy.leaversPlaceholder
      );
    });

    it("should open nothing when no names were given", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await onNextWithout(context(), ctx.command("/next_without"));

      expect(tableWithoutSpy).toHaveBeenCalledTimes(NEVER);
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should ask the domain to remove the leavers from the previous seats, using the mapped seats", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Anya"] });

      await onNextWithout(context(), ctx.command("/next_without Anya"));

      expect(tableWithoutSpy).toHaveBeenCalledWith(MAPPED_SEATS, ["Anya"]);
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

    it("should rotate exactly the seats the domain change returned", async () => {
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

  describe("joinFromNames()", () => {
    it("should explain when there is nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await joinFromNames(context(), ctx.textMessage("Dima"));

      expect(ctx.lastReply().text).toBe(copy.noLineupToRepeat);
    });

    it("should refuse to ask again when the reply names nobody", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await joinFromNames(context(), ctx.textMessage(""));

      expect(ctx.lastReply().text).toBe(copy.joinersMissing);
      expect(askForNamesSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should name a repeated joiner the parser rejected", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Dima"] });

      await joinFromNames(context(), ctx.textMessage("Dima, Dima"));

      expect(ctx.lastReply().text).toBe(copy.lineupDuplicates(["Dima"]));
    });

    it("should shorten an overlong joiner rather than send it back whole", async () => {
      const whole = ["D".repeat(300)];
      parseNamesSpy.mockReturnValue({ ok: false, problem: "too_long", names: whole });

      await joinFromNames(context(), ctx.textMessage(whole[0] ?? ""));

      expect(namePreviewsSpy).toHaveBeenCalledWith(whole);
      expect(ctx.lastReply().text).toBe(copy.nameTooLong(LONGEST_NAME, SHORTENED));
    });

    it("should reach the same seating question a good command would", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await joinFromNames(context(), ctx.textMessage("Dima"));

      expect(askSeatingSpy).toHaveBeenCalledWith(expect.anything(), SEATED_TOGETHER);
    });

    it("should never drop an unanswered prompt", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Dima"] });

      await joinFromNames(context(), ctx.textMessage("Dima"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("leaveFromNames()", () => {
    it("should explain when there is nothing to repeat", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await leaveFromNames(context(), ctx.textMessage("Anya"));

      expect(ctx.lastReply().text).toBe(copy.noLineupToRepeat);
    });

    it("should refuse to ask again when the reply names nobody", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "empty" });

      await leaveFromNames(context(), ctx.textMessage(""));

      expect(ctx.lastReply().text).toBe(copy.leaversMissing);
      expect(askForNamesSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should name a repeated leaver the parser rejected", async () => {
      parseNamesSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Anya"] });

      await leaveFromNames(context(), ctx.textMessage("Anya, Anya"));

      expect(ctx.lastReply().text).toBe(copy.lineupDuplicates(["Anya"]));
    });

    it("should reach the same seating a good command would", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Anya"] });
      tableWithoutSpy.mockReturnValue({ ok: true, seats: DISTINCT_SEATS });

      await leaveFromNames(context(), ctx.textMessage("Anya"));

      expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED, null);
    });

    it("should never drop an unanswered prompt", async () => {
      parseNamesSpy.mockReturnValue({ ok: true, names: ["Anya"] });
      tableWithoutSpy.mockReturnValue({ ok: true, seats: DISTINCT_SEATS });

      await leaveFromNames(context(), ctx.textMessage("Anya"));

      expect(prompts.dropUnansweredSpy).toHaveBeenCalledTimes(NEVER);
    });
  });
});
