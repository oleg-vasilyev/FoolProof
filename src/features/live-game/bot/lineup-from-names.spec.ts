import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { CardServiceStub } from "#live-game/bot/card-service.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";
import { CHAT_ID, ContextStub } from "#live-game/bot/grammy-context.stub.ts";


const parseLineupSpy = vi.fn();

const rotateToLowestIdSpy = vi.fn();

vi.mock("#live-game/domain/lineup-parsing.ts", () => ({
  parseLineup: (text: string) => parseLineupSpy(text),
  rotateToLowestId: (seats: unknown) => rotateToLowestIdSpy(seats),
}));

const askForNamesSpy = vi.fn();

const commandTextSpy = vi.fn();

const COMMAND_TEXT = "the text the command carried";

const refusedBecauseLiveSpy = vi.fn();

vi.mock("#live-game/bot/card-context.ts", () => ({
  askForNames: (...args: unknown[]) => askForNamesSpy(...args),
  commandText: (ctx: unknown) => commandTextSpy(ctx),
  refusedBecauseLive: (...args: unknown[]) => refusedBecauseLiveSpy(...args),
}));

vi.mock("#live-game/bot/card-service.ts", () => ({
  PICKED_BY_HAND: null,
}));

const resolveSeatsSpy = vi.fn();

vi.mock("#live-game/bot/seat-lookup.ts", () => ({
  resolveSeats: (...args: unknown[]) => resolveSeatsSpy(...args),
}));

const { onGame, openFromNames } = await import("#live-game/bot/lineup-from-names.ts");

const NEVER = 0;

const THREE = ["Oleg", "Anya", "Roma"];

const RESOLVED_SEATS = [{ playerId: 9, displayName: "Resolved" }];

const ROTATED_SEATS = [{ playerId: 4, displayName: "Anya" }];

describe("openFromNames()", () => {
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

    commandTextSpy.mockReturnValue(COMMAND_TEXT);
    parseLineupSpy.mockReturnValue({ ok: true, names: THREE });
    resolveSeatsSpy.mockReturnValue(RESOLVED_SEATS);
    rotateToLowestIdSpy.mockReturnValue(ROTATED_SEATS);
  });

  it("should report a line-up with nobody in it", async () => {
    parseLineupSpy.mockReturnValue({ ok: false, problem: "empty" });

    await openFromNames(context(), ctx.command("/game"), "");

    expect(ctx.lastReply().text).toBe(copy.lineupMissing);
    expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should report a line-up that is too short", async () => {
    parseLineupSpy.mockReturnValue({ ok: false, problem: "too_few" });

    await openFromNames(context(), ctx.command("/game Oleg"), "Oleg");

    expect(ctx.lastReply().text).toBe(copy.lineupTooFew);
    expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should name the duplicates a line-up was refused for", async () => {
    parseLineupSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Oleg"] });

    await openFromNames(context(), ctx.command("/game Oleg, Oleg"), "Oleg, Oleg");

    expect(ctx.lastReply().text).toBe(copy.lineupDuplicates(["Oleg"]));
    expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should resolve the parsed names against the chat's roster", async () => {
    const built = context();

    await openFromNames(built, ctx.command("/game Oleg, Anya, Roma"), "Oleg, Anya, Roma");

    expect(resolveSeatsSpy).toHaveBeenCalledWith(built.repo, CHAT_ID, THREE);
  });

  it("should open a card with the rotated seats and null as the third argument", async () => {
    await openFromNames(context(), ctx.command("/game Oleg, Anya, Roma"), "Oleg, Anya, Roma");

    expect(rotateToLowestIdSpy).toHaveBeenCalledWith(RESOLVED_SEATS);
    expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED_SEATS, null);
  });
});

describe("onGame()", () => {
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

    commandTextSpy.mockReturnValue(COMMAND_TEXT);
    parseLineupSpy.mockReturnValue({ ok: true, names: THREE });
    resolveSeatsSpy.mockReturnValue(RESOLVED_SEATS);
    rotateToLowestIdSpy.mockReturnValue(ROTATED_SEATS);
    refusedBecauseLiveSpy.mockResolvedValue(false);
    askForNamesSpy.mockResolvedValue(undefined);
  });

  it("should clear a prompt nobody answered before doing anything else", async () => {
    await onGame(context(), ctx.command("/game Oleg, Anya, Roma"));

    expect(prompts.dropUnansweredSpy).toHaveBeenCalledWith(CHAT_ID);
  });

  it("should open a card with the rotated seats and null as the third argument", async () => {
    await onGame(context(), ctx.command("/game Oleg, Anya, Roma"));

    expect(cards.openSpy).toHaveBeenCalledWith(CHAT_ID, ROTATED_SEATS, null);
  });

  it("should parse exactly the text commandText gave back for the context it received", async () => {
    const built = context();
    const command = ctx.command("/game Oleg, Anya, Roma");

    await onGame(built, command);

    expect(commandTextSpy).toHaveBeenCalledWith(command);
    expect(parseLineupSpy).toHaveBeenCalledWith(COMMAND_TEXT);
  });

  it("should refuse while a card is live", async () => {
    refusedBecauseLiveSpy.mockResolvedValue(true);
    const built = context();
    const command = ctx.command("/game Oleg, Anya");

    await onGame(built, command);

    expect(refusedBecauseLiveSpy).toHaveBeenCalledWith(built, command);
    expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should report a line-up with nobody in it", async () => {
    parseLineupSpy.mockReturnValue({ ok: false, problem: "too_few" });

    await onGame(context(), ctx.command("/game Oleg"));

    expect(ctx.lastReply().text).toBe(copy.lineupTooFew);
  });

  it("should name the duplicates a line-up was refused for", async () => {
    parseLineupSpy.mockReturnValue({ ok: false, problem: "duplicates", names: ["Oleg"] });

    await onGame(context(), ctx.command("/game Oleg, Oleg"));

    expect(ctx.lastReply().text).toBe(copy.lineupDuplicates(["Oleg"]));
  });

  describe("with no names", () => {
    beforeEach(() => {
      parseLineupSpy.mockReturnValue({ ok: false, problem: "empty" });
    });

    it("should ask for the names instead of failing", async () => {
      const built = context();
      const command = ctx.command("/game");

      await onGame(built, command);

      expect(askForNamesSpy).toHaveBeenCalledWith(
        built,
        command,
        copy.lineupPrompt,
        copy.lineupPlaceholder
      );
    });

    it("should not open a card yet", async () => {
      await onGame(context(), ctx.command("/game"));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });
  });
});
