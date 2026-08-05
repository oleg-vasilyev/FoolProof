import { beforeEach, describe, expect, it } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { cardRecordOf } from "#shared/repository/database-records.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { CHAT_ID, COMMAND_MESSAGE_ID, ContextStub, SENT_MESSAGE_ID } from "#live-game/bot/grammy-context.stub.ts";
import { CardServiceStub } from "#live-game/bot/card/card-service.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";


const { askForNames, commandText, refusedBecauseLive } = await import(
  "#live-game/bot/card-context.ts"
);

const NEVER = 0;

const THREE = ["Oleg", "Anya", "Roma"];

const contextOf = (repo: RepositoryStub, prompts: PromptRegistryStub) => ({
  repo,
  cards: new CardServiceStub().service,
  prompts: prompts.registry,
});

const QUESTION = "Who is playing?";

const PLACEHOLDER = "names, comma separated";

describe("commandText()", () => {
  it("should give back the text the command carried", () => {
    const ctx = new ContextStub();

    expect(commandText(ctx.command("/game Oleg, Anya"))).toBe("/game Oleg, Anya");
  });

  it("should give back nothing when the command carried no message", () => {
    const ctx = new ContextStub();

    expect(commandText(ctx.commandWithoutMessage())).toBe("");
  });
});

describe("refusedBecauseLive()", () => {
  let repo: RepositoryStub;
  let ctx: ContextStub;

  const context = () => contextOf(repo, new PromptRegistryStub());

  beforeEach(() => {
    repo = new RepositoryStub();
    ctx = new ContextStub();
  });

  it("should return false and reply nothing when no card is live", async () => {
    repo.liveCardInChatSpy.mockReturnValue(null);

    const refused = await refusedBecauseLive(context(), ctx.command("/game"));

    expect(refused).toBe(false);
    expect(ctx.replySpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should return true and reply with the running-game notice when a card is live", async () => {
    repo.liveCardInChatSpy.mockReturnValue(cardRecordOf(THREE));

    const refused = await refusedBecauseLive(context(), ctx.command("/game"));

    expect(refused).toBe(true);
    expect(ctx.lastReply().text).toBe(copy.gameAlreadyRunning);
  });

  it("should quote the live card's message id", async () => {
    const live = cardRecordOf(THREE);
    repo.liveCardInChatSpy.mockReturnValue(live);

    await refusedBecauseLive(context(), ctx.command("/game"));

    expect(ctx.lastReply().options.reply_parameters).toEqual({
      message_id: live.game.message_id,
    });
  });
});

describe("askForNames()", () => {
  let prompts: PromptRegistryStub;
  let ctx: ContextStub;

  const context = () => contextOf(new RepositoryStub(), prompts);

  beforeEach(() => {
    prompts = new PromptRegistryStub();
    ctx = new ContextStub();
  });

  it("should send the question it was given", async () => {
    await askForNames(context(), ctx.command("/game"), QUESTION, PLACEHOLDER);

    expect(ctx.lastReply().text).toBe(QUESTION);
  });

  it("should force a reply so the input field opens", async () => {
    await askForNames(context(), ctx.command("/game"), QUESTION, PLACEHOLDER);

    expect(ctx.lastReply().options.reply_markup).toMatchObject({
      force_reply: true,
      selective: true,
    });
  });

  it("should set the placeholder it was given", async () => {
    await askForNames(context(), ctx.command("/game"), QUESTION, PLACEHOLDER);

    expect(ctx.lastReply().options.reply_markup).toMatchObject({
      input_field_placeholder: PLACEHOLDER,
    });
  });

  it("should quote the command message", async () => {
    await askForNames(context(), ctx.command("/game"), QUESTION, PLACEHOLDER);

    expect(ctx.lastReply().options.reply_parameters).toEqual({
      message_id: COMMAND_MESSAGE_ID,
    });
  });

  it("should quote nothing when the command carried no message", async () => {
    await askForNames(context(), ctx.commandWithoutMessage(), QUESTION, PLACEHOLDER);

    expect(ctx.lastReply().options.reply_parameters).toBeUndefined();
  });

  it("should remember the sent prompt id", async () => {
    await askForNames(context(), ctx.command("/game"), QUESTION, PLACEHOLDER);

    expect(prompts.rememberSpy).toHaveBeenCalledWith(CHAT_ID, SENT_MESSAGE_ID);
  });
});
