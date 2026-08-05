import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { CardServiceStub } from "#live-game/bot/card/card-service.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";
import { CHAT_ID, ContextStub } from "#live-game/bot/grammy-context.stub.ts";


const refusedBecauseLiveSpy = vi.fn();

vi.mock("#live-game/bot/card-context.ts", () => ({
  refusedBecauseLive: (...args: unknown[]) => refusedBecauseLiveSpy(...args),
}));

const openFromNamesSpy = vi.fn();

vi.mock("#live-game/bot/lineup/lineup-from-names.ts", () => ({
  openFromNames: (...args: unknown[]) => openFromNamesSpy(...args),
}));

const joinFromNamesSpy = vi.fn();

const leaveFromNamesSpy = vi.fn();

vi.mock("#live-game/bot/lineup/lineup-from-last-game.ts", () => ({
  joinFromNames: (...args: unknown[]) => joinFromNamesSpy(...args),
  leaveFromNames: (...args: unknown[]) => leaveFromNamesSpy(...args),
}));

const { onNamesReply } = await import("#live-game/bot/lineup/names-reply.ts");

const NEVER = 0;

describe("onNamesReply()", () => {
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

    refusedBecauseLiveSpy.mockResolvedValue(false);
    openFromNamesSpy.mockResolvedValue(undefined);
    joinFromNamesSpy.mockResolvedValue(undefined);
    leaveFromNamesSpy.mockResolvedValue(undefined);
  });

  it("should route a reply to the line-up prompt to openFromNames", async () => {
    const built = context();
    const message = ctx.textMessage("Oleg, Anya, Roma", { text: copy.lineupPrompt, fromBot: true });

    await onNamesReply(built, message);

    expect(openFromNamesSpy).toHaveBeenCalledWith(built, message, "Oleg, Anya, Roma");
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(leaveFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should route a reply to the joiners prompt to joinFromNames", async () => {
    const built = context();
    const message = ctx.textMessage("Dima", { text: copy.joinersPrompt, fromBot: true });

    await onNamesReply(built, message);

    expect(joinFromNamesSpy).toHaveBeenCalledWith(built, message);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(leaveFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should route a reply to the leavers prompt to leaveFromNames", async () => {
    const built = context();
    const message = ctx.textMessage("Anya", { text: copy.leaversPrompt, fromBot: true });

    await onNamesReply(built, message);

    expect(leaveFromNamesSpy).toHaveBeenCalledWith(built, message);
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
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

  it("should forget the leavers prompt before delegating", async () => {
    const message = ctx.textMessage("Anya", { text: copy.leaversPrompt, fromBot: true });

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
    expect(leaveFromNamesSpy).toHaveBeenCalledTimes(NEVER);
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
    expect(leaveFromNamesSpy).toHaveBeenCalledTimes(NEVER);
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
    expect(leaveFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should refuse when a card went live while the line-up prompt stood", async () => {
    refusedBecauseLiveSpy.mockResolvedValue(true);
    const message = ctx.textMessage("Oleg, Anya, Roma", { text: copy.lineupPrompt, fromBot: true });

    await onNamesReply(context(), message);

    expect(refusedBecauseLiveSpy).toHaveBeenCalled();
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(leaveFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should refuse when a card went live while the joiners prompt stood", async () => {
    refusedBecauseLiveSpy.mockResolvedValue(true);
    const message = ctx.textMessage("Dima", { text: copy.joinersPrompt, fromBot: true });

    await onNamesReply(context(), message);

    expect(refusedBecauseLiveSpy).toHaveBeenCalled();
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(leaveFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should refuse when a card went live while the leavers prompt stood", async () => {
    refusedBecauseLiveSpy.mockResolvedValue(true);
    const message = ctx.textMessage("Anya", { text: copy.leaversPrompt, fromBot: true });

    await onNamesReply(context(), message);

    expect(refusedBecauseLiveSpy).toHaveBeenCalled();
    expect(openFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(joinFromNamesSpy).toHaveBeenCalledTimes(NEVER);
    expect(leaveFromNamesSpy).toHaveBeenCalledTimes(NEVER);
  });
});
