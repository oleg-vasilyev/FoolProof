import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { copy as russian } from "#live-game/copy.ru.ts";
import { CardServiceStub } from "#live-game/bot/card/card-service.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";
import { CHAT_ID, ContextStub } from "#live-game/bot/grammy-context.stub.ts";
import { CardContextStub } from "#live-game/bot/card-context.stub.ts";


const cardContext = new CardContextStub();

vi.mock("#live-game/bot/card-context.ts", () => cardContext.module);

const openFromNamesSpy = vi.fn();

vi.mock("#live-game/bot/lineup/lineup-from-names.ts", () => ({
  openFromNames: (...args: unknown[]) => openFromNamesSpy(...args),
}));

const joinFromNamesSpy = vi.fn();

vi.mock("#live-game/bot/lineup/lineup-from-last-game.ts", () => ({
  joinFromNames: (...args: unknown[]) => joinFromNamesSpy(...args),
}));

const { onNamesReply } = await import("#live-game/bot/lineup/names-reply.ts");

const NEVER = 0;

describe("onNamesReply()", () => {
  let repo: RepositoryStub;
  let locales: LocaleReaderStub;
  let cards: CardServiceStub;
  let prompts: PromptRegistryStub;
  let ctx: ContextStub;

  const context = () => ({ repo, cards: cards.service, prompts: prompts.registry, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    cardContext.copyForSpy.mockReturnValue(copy);

    repo = new RepositoryStub();
    locales = new LocaleReaderStub();
    cards = new CardServiceStub();
    prompts = new PromptRegistryStub();
    ctx = new ContextStub();

    cardContext.refusedBecauseLiveSpy.mockResolvedValue(false);
    openFromNamesSpy.mockResolvedValue(undefined);
    joinFromNamesSpy.mockResolvedValue(undefined);
  });

  it("should route a reply to the line-up prompt to openFromNames", async () => {
    const built = context();
    const message = ctx.textMessage("Oleg, Anya, Roma", { text: copy.lineupPrompt, fromBot: true });

    await onNamesReply(built, message);

    expect(openFromNamesSpy).toHaveBeenCalledWith(built, message, "Oleg, Anya, Roma");
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should ignore a reply to a message of its own that carries no text", async () => {
    const message = ctx.textMessage("Oleg, Anya", { text: undefined, fromBot: true });

    await onNamesReply(context(), message);

    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should recognise a prompt it asked in the other language", async () => {
    const built = context();
    const message = ctx.textMessage("Олег, Аня", { text: russian.lineupPrompt, fromBot: true });

    await onNamesReply(built, message);

    expect(openFromNamesSpy).toHaveBeenCalledWith(built, message, "Олег, Аня");
  });

  it("should tell that language's joiners prompt from its line-up one", async () => {
    const built = context();
    const message = ctx.textMessage("Дима", { text: russian.joinersPrompt, fromBot: true });

    await onNamesReply(built, message);

    expect(joinFromNamesSpy).toHaveBeenCalledWith(built, message);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should route a reply to the joiners prompt to joinFromNames", async () => {
    const built = context();
    const message = ctx.textMessage("Dima", { text: copy.joinersPrompt, fromBot: true });

    await onNamesReply(built, message);

    expect(joinFromNamesSpy).toHaveBeenCalledWith(built, message);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should leave a reply to the old leavers prompt to somebody else", async () => {
    const message = ctx.textMessage("Anya", {
      text: "Кто выходит? Пришли имена.",
      fromBot: true,
    });

    await onNamesReply(context(), message);

    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(prompts.forgetSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should forget the line-up prompt before delegating", async () => {
    const message = ctx.textMessage("Oleg, Anya, Roma", { text: copy.lineupPrompt, fromBot: true });

    await onNamesReply(context(), message);

    expect(prompts.forgetSpy).toHaveBeenCalledWith(CHAT_ID);
    expect(prompts.dropUnansweredSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should forget the joiners prompt before delegating", async () => {
    const message = ctx.textMessage("Dima", { text: copy.joinersPrompt, fromBot: true });

    await onNamesReply(context(), message);

    expect(prompts.forgetSpy).toHaveBeenCalledWith(CHAT_ID);
    expect(prompts.dropUnansweredSpy).toHaveBeenCalledTimes(NEVER);
  });


  it("should ignore a reply to some other message of the bot", async () => {
    const message = ctx.textMessage("Oleg, Anya", { text: "something else", fromBot: true });

    await onNamesReply(context(), message);

    expect(prompts.forgetSpy).toHaveBeenCalledTimes(NEVER);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should ignore a quote of the prompt written by a person", async () => {
    const message = ctx.textMessage("Oleg, Anya", { text: copy.lineupPrompt, fromBot: false });

    await onNamesReply(context(), message);

    expect(prompts.forgetSpy).toHaveBeenCalledTimes(NEVER);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should ignore ordinary chatter with no quote", async () => {
    const message = ctx.textMessage("just talking");

    await onNamesReply(context(), message);

    expect(prompts.forgetSpy).toHaveBeenCalledTimes(NEVER);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should ignore a reply to a message with no sender, without throwing", async () => {
    const message = ctx.textMessage("Anya", {
      text: copy.lineupPrompt,
      fromBot: true,
      senderless: true,
    });

    await expect(onNamesReply(context(), message)).resolves.toBeUndefined();

    expect(prompts.forgetSpy).toHaveBeenCalledTimes(NEVER);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should refuse when a card went live while the line-up prompt stood", async () => {
    cardContext.refusedBecauseLiveSpy.mockResolvedValue(true);
    const message = ctx.textMessage("Oleg, Anya, Roma", { text: copy.lineupPrompt, fromBot: true });

    await onNamesReply(context(), message);

    expect(cardContext.refusedBecauseLiveSpy).toHaveBeenCalled();
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should refuse when a card went live while the joiners prompt stood", async () => {
    cardContext.refusedBecauseLiveSpy.mockResolvedValue(true);
    const message = ctx.textMessage("Dima", { text: copy.joinersPrompt, fromBot: true });

    await onNamesReply(context(), message);

    expect(cardContext.refusedBecauseLiveSpy).toHaveBeenCalled();
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should refuse when a card went live while the joiners prompt stood", async () => {
    cardContext.refusedBecauseLiveSpy.mockResolvedValue(true);
    const message = ctx.textMessage("Dima", { text: copy.joinersPrompt, fromBot: true });

    await onNamesReply(context(), message);

    expect(cardContext.refusedBecauseLiveSpy).toHaveBeenCalled();
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });
});
