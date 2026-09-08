import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


const ASK_PROMPT = "Which name was written down, and who really played? Send both names.";

const playGame = async (
  chat: Parameters<Parameters<typeof describeScenario>[1]>[0],
  lineup: string,
  exits: readonly string[]
): Promise<void> => {
  await chat.say(`/game ${lineup}`);
  await chat.tap(lineup.split(", ")[0] ?? "");

  for (const name of exits) {
    await chat.tap(name);
  }

  await chat.tap("🟢 Confirm");
};

describeScenario("the wrong Roma was written down all evening", (chat) => {
  it("should read the correction back before doing anything", async () => {
    await playGame(chat, "Roma, Oleg, Anya", ["Oleg", "Anya"]);
    await playGame(chat, "Roma, Oleg, Anya", ["Roma", "Oleg"]);

    await chat.say("/replace Roma, Romani");

    expect(chat.cardText()).toContain("Replacing a name");
    expect(chat.cardText()).toContain("Roma → <b>Romani</b>");
    expect(chat.cardText()).toContain("2 games on ");
    expect(chat.cardText()).toContain("will be rewritten");
    expect(chat.cardText()).toContain("Romani is a new name here");
    expect(chat.captions()).toEqual(["🔴 Cancel", "🟢 Replace"]);
  });

  it("should rewrite the evening on Replace and leave nothing to tap", async () => {
    await chat.tap("🟢 Replace");

    expect(chat.lastAnswer()).toBe("Replaced");
    expect(chat.lastText()).toContain("Roma → <b>Romani</b>");
    expect(chat.lastText()).toContain("Rewritten: 2 games on ");
    expect(chat.captions()).toEqual([]);
  });

  it("should leave Romani where Roma was, and no Roma at all", async () => {
    await chat.say("/merge");

    expect(chat.captions()).toEqual(["Anya · 2", "Oleg · 2", "Romani · 2", "🔴 Cancel"]);

    await chat.tap("🔴 Cancel");
  });

  it("should refuse a name that did not sit down this evening", async () => {
    await chat.say("/replace Roma, Dima");

    expect(chat.lastText()).toContain("Roma is not in the games on ");
    expect(chat.captions()).toEqual([]);
  });

  it("should refuse when both names sat at the table", async () => {
    await chat.say("/replace Oleg, Anya");

    expect(chat.lastText()).toContain("Anya is in the games on ");
    expect(chat.lastText()).toContain("Oleg is somebody else");
    expect(chat.captions()).toEqual([]);
  });

  it("should ask for two names when given one", async () => {
    await chat.say("/replace Oleg");

    expect(chat.lastText()).toContain("Two names");
    expect(chat.captions()).toEqual([]);
  });

  it("should not create a player out of a cancelled correction", async () => {
    await chat.say("/replace Oleg, Olegg");

    expect(chat.captions()).toEqual(["🔴 Cancel", "🟢 Replace"]);

    await chat.tap("🔴 Cancel");

    expect(chat.lastAnswer()).toBe("Cancelled");
    expect(chat.lastText()).toContain("Cancelled — nothing replaced.");

    await chat.say("/merge");

    expect(chat.captions()).toEqual(["Anya · 2", "Oleg · 2", "Romani · 2", "🔴 Cancel"]);

    await chat.tap("🔴 Cancel");
  });
});

describeScenario("/replace with no names asks for them", (chat) => {
  let promptId: number | null = null;

  it("should ask, and open the reply box", async () => {
    await playGame(chat, "Roma, Oleg, Anya", ["Oleg", "Anya"]);

    await chat.say("/replace");

    expect(chat.lastText()).toBe(ASK_PROMPT);
    expect(chat.promptId()).not.toBeNull();
    expect(chat.captions()).toEqual([]);

    promptId = chat.promptId();
  });

  it("should read the correction back from a reply to the ask", async () => {
    await chat.replyToPrompt("Roma, Romani");

    expect(chat.cardText()).toContain("Roma → <b>Romani</b>");
    expect(chat.captions()).toEqual(["🔴 Cancel", "🟢 Replace"]);
  });

  it("should leave an answered ask standing", async () => {
    expect(chat.messages().some((message) => message.messageId === promptId)).toBe(true);

    await chat.tap("🔴 Cancel");
  });

  it("should still open a card from a reply to the line-up ask, the other feature's", async () => {
    await chat.say("/game");
    await chat.replyToPrompt("Anya, Roma");

    expect(chat.captions()).toEqual(["Roma", "Anya", "🔴 Cancel"]);

    await chat.tap("🔴 Cancel");
  });
});

describeScenario("/replace with nothing recorded, then while a game is being played", (chat) => {
  it("should say there is no evening to correct", async () => {
    await chat.say("/replace Roma, Romani");

    expect(chat.lastText()).toContain("No evening recorded here yet");
    expect(chat.captions()).toEqual([]);
  });

  it("should wait for the card to be confirmed", async () => {
    await playGame(chat, "Roma, Oleg", ["Roma"]);
    await chat.say("/game Roma, Oleg");

    await chat.say("/replace Roma, Romani");

    expect(chat.lastText()).toContain("A game is running");
    expect(chat.captions()).toEqual(["Roma", "Oleg", "🔴 Cancel"]);
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("🔴 Cancel");

    expect(chat.captions()).toEqual([]);
  });
});
