import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { ActionKind } from "#live-game/domain/card-states.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { CardServiceStub } from "#live-game/bot/card/card-service.stub.ts";
import { ContextStub, USER_ID } from "#live-game/bot/grammy-context.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";


const decodeCallbackSpy = vi.fn();

vi.mock("#live-game/render/callback-data-codec.ts", () => ({
  decodeCallback: (data: string) => decodeCallbackSpy(data),
}));

const { onTap } = await import("#live-game/bot/card/tap-handler.ts");

const ONCE = 1;

const NEVER = 0;

const TAP_NOTICE = "Oleg — 1";

describe("onTap()", () => {
  let repo: RepositoryStub;
  let locales: LocaleReaderStub;
  let cards: CardServiceStub;
  let prompts: PromptRegistryStub;
  let ctx: ContextStub;

  const context = () => ({ repo, cards: cards.service, prompts: prompts.registry, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    locales = new LocaleReaderStub();
    cards = new CardServiceStub();
    prompts = new PromptRegistryStub();
    ctx = new ContextStub();

    decodeCallbackSpy.mockReturnValue({ gameId: 1, action: ActionKind.Pick, slot: 0, version: 0 });
    cards.tapSpy.mockResolvedValue(TAP_NOTICE);
  });

  it("should answer with whatever the card service decided", async () => {
    await onTap(context(), ctx.callbackTap("1:p:0:0"));

    expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(TAP_NOTICE);
  });

  it("should attribute the tap to whoever pressed it", async () => {
    await onTap(context(), ctx.callbackTap("1:p:0:0"));

    expect(cards.tapSpy).toHaveBeenCalledWith(copy, 
      { gameId: 1, action: ActionKind.Pick, slot: 0, version: 0 },
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
