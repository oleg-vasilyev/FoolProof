import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { ForceReplyPromptStub } from "#shared/telegram/force-reply-prompt.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { copy as russian } from "#live-game/copy.ru.ts";
import { CardServiceStub } from "#live-game/bot/card/card-service.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";
import { CHAT_ID, ContextStub } from "#live-game/bot/grammy-context.stub.ts";
import { CardContextStub } from "#live-game/bot/card-context.stub.ts";


const cardContext = new CardContextStub();

vi.mock("#live-game/bot/card-context.ts", () => cardContext.module);

const forceReply = new ForceReplyPromptStub();

vi.mock("#shared/telegram/force-reply-prompt.ts", () => forceReply.module);

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

const LINEUP = "Oleg, Anya, Roma";

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
    forceReply.answeredPromptTextSpy.mockReturnValue(copy.lineupPrompt);
    openFromNamesSpy.mockResolvedValue(undefined);
    joinFromNamesSpy.mockResolvedValue(undefined);
  });

  it("should ask the prompt reader which question the message answers", async () => {
    const message = ctx.textMessage(LINEUP);

    await onNamesReply(context(), message);

    expect(forceReply.answeredPromptTextSpy).toHaveBeenCalledWith(message);
  });

  it("should route a reply to the line-up prompt to openFromNames", async () => {
    const built = context();
    const message = ctx.textMessage(LINEUP);

    await onNamesReply(built, message);

    expect(openFromNamesSpy).toHaveBeenCalledWith(built, message, LINEUP);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should recognise a prompt it asked in the other language", async () => {
    forceReply.answeredPromptTextSpy.mockReturnValue(russian.lineupPrompt);
    const built = context();
    const message = ctx.textMessage("Олег, Аня");

    await onNamesReply(built, message);

    expect(openFromNamesSpy).toHaveBeenCalledWith(built, message, "Олег, Аня");
  });

  it("should tell that language's joiners prompt from its line-up one", async () => {
    forceReply.answeredPromptTextSpy.mockReturnValue(russian.joinersPrompt);
    const built = context();
    const message = ctx.textMessage("Дима");

    await onNamesReply(built, message);

    expect(joinFromNamesSpy).toHaveBeenCalledWith(built, message);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should route a reply to the joiners prompt to joinFromNames", async () => {
    forceReply.answeredPromptTextSpy.mockReturnValue(copy.joinersPrompt);
    const built = context();
    const message = ctx.textMessage("Dima");

    await onNamesReply(built, message);

    expect(joinFromNamesSpy).toHaveBeenCalledWith(built, message);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should leave a reply to the old leavers prompt to somebody else", async () => {
    forceReply.answeredPromptTextSpy.mockReturnValue("Кто выходит? Пришли имена.");

    await onNamesReply(context(), ctx.textMessage("Anya"));

    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(prompts.forgetSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should forget the line-up prompt before delegating", async () => {
    await onNamesReply(context(), ctx.textMessage(LINEUP));

    expect(prompts.forgetSpy).toHaveBeenCalledWith(CHAT_ID);
    expect(prompts.dropUnansweredSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should forget the joiners prompt before delegating", async () => {
    forceReply.answeredPromptTextSpy.mockReturnValue(copy.joinersPrompt);

    await onNamesReply(context(), ctx.textMessage("Dima"));

    expect(prompts.forgetSpy).toHaveBeenCalledWith(CHAT_ID);
    expect(prompts.dropUnansweredSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should ignore a reply to some other message of the bot", async () => {
    forceReply.answeredPromptTextSpy.mockReturnValue("something else");

    await onNamesReply(context(), ctx.textMessage("Oleg, Anya"));

    expect(prompts.forgetSpy).toHaveBeenCalledTimes(NEVER);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should ignore a message that answers no question of the bot", async () => {
    forceReply.answeredPromptTextSpy.mockReturnValue(null);

    await onNamesReply(context(), ctx.textMessage("just talking"));

    expect(prompts.forgetSpy).toHaveBeenCalledTimes(NEVER);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should refuse when a card went live while the line-up prompt stood", async () => {
    cardContext.refusedBecauseLiveSpy.mockResolvedValue(true);

    await onNamesReply(context(), ctx.textMessage(LINEUP));

    expect(cardContext.refusedBecauseLiveSpy).toHaveBeenCalled();
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should refuse when a card went live while the joiners prompt stood", async () => {
    cardContext.refusedBecauseLiveSpy.mockResolvedValue(true);
    forceReply.answeredPromptTextSpy.mockReturnValue(copy.joinersPrompt);

    await onNamesReply(context(), ctx.textMessage("Dima"));

    expect(cardContext.refusedBecauseLiveSpy).toHaveBeenCalled();
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });
});
