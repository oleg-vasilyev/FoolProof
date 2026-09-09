import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { CardServiceStub } from "#live-game/bot/card/card-service.stub.ts";
import { CHAT_ID, ContextStub, USER_ID } from "#live-game/bot/grammy-context.stub.ts";
import { PromptRegistryStub } from "#shared/telegram/prompt-registry.stub.ts";
import { CardContextStub } from "#live-game/bot/card-context.stub.ts";


const cardContext = new CardContextStub();

vi.mock("#live-game/bot/card-context.ts", () => cardContext.module);

const { onReopen } = await import("#live-game/bot/card/reopen-handler.ts");

const NEVER = 0;

const ONCE = 1;

describe("onReopen()", () => {
  let repo: RepositoryStub;
  let locales: LocaleReaderStub;
  let cards: CardServiceStub;
  let prompts: PromptRegistryStub;
  let ctx: ContextStub;

  const context = () => ({ repo, cards: cards.service, prompts: prompts.registry, localeIn: locales.read });

  const reopen = () => onReopen(context(), ctx.command("/reopen"));

  beforeEach(() => {
    vi.clearAllMocks();

    cardContext.copyForSpy.mockReturnValue(copy);
    cardContext.refusedBecauseLiveSpy.mockResolvedValue(false);

    repo = new RepositoryStub();
    locales = new LocaleReaderStub();
    cards = new CardServiceStub();
    prompts = new PromptRegistryStub();
    ctx = new ContextStub();
  });

  it("should speak the language of the chat it was sent in", async () => {
    await reopen();

    expect(cardContext.copyForSpy).toHaveBeenCalledWith(expect.objectContaining({ repo }), CHAT_ID);
  });


  it("should reopen the latest game of this chat in the name of whoever asked", async () => {
    await reopen();

    expect(cards.reopenLatestSpy).toHaveBeenCalledWith(copy, CHAT_ID, USER_ID);
  });

  it("should say nothing more when the card came back", async () => {
    await reopen();

    expect(ctx.replySpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should say there is nothing to reopen when the chat has no recorded game", async () => {
    cards.reopenLatestSpy.mockResolvedValue(false);

    await reopen();

    expect(ctx.replySpy).toHaveBeenCalledTimes(ONCE);
    expect(ctx.lastReply().text).toBe(copy.nothingToReopen);
  });

  it("should do nothing for a command with no sender, since a reopening needs a name on it", async () => {
    await onReopen(context(), ctx.commandFromNobody("/reopen"));

    expect(cards.reopenLatestSpy).toHaveBeenCalledTimes(NEVER);
    expect(ctx.replySpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should defer to the live card when one is open", async () => {
    cardContext.refusedBecauseLiveSpy.mockResolvedValue(true);

    await reopen();

    expect(cardContext.refusedBecauseLiveSpy).toHaveBeenCalledWith(copy, expect.objectContaining({ repo }), ctx.command("/reopen"));
    expect(cards.reopenLatestSpy).toHaveBeenCalledTimes(NEVER);
  });
});
