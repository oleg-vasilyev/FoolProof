import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


const LINEUP_PROMPT = "Who is playing? Send the names in seating order.";

describeScenario("/game with no names asks for them", (chat) => {
  let promptId: number | null = null;

  it("should ask, and open the reply box", async () => {
    await chat.say("/game");

    expect(chat.lastText()).toBe(LINEUP_PROMPT);
    expect(chat.promptId()).not.toBeNull();
    expect(chat.captions()).toEqual([]);

    promptId = chat.promptId();
  });

  it("should open a card from a reply to the ask", async () => {
    await chat.replyToPrompt("Anya, Roma");

    expect(chat.captions()).toEqual(["Anya", "Roma", "🔴 Cancel"]);
  });

  it("should leave an answered ask standing", () => {
    expect(chat.messages().some((message) => message.messageId === promptId)).toBe(true);
  });

  it("should allow a draw from the start in a two-player game", async () => {
    await chat.tap("Anya");

    expect(chat.captions()).toContain("🟢 Draw");
  });

  it("should mark both players as sharing the last place", async () => {
    await chat.tap("🟢 Draw");

    expect(chat.lastAnswer()).toBe("Draw");
    expect(chat.captions()).toContain("🤝 Anya");
    expect(chat.captions()).toContain("🤝 Roma");
    expect(chat.captions()).toContain("🟢 Confirm");
  });

  it("should label the draw in the standings", async () => {
    await chat.tap("🟢 Confirm");

    expect(chat.lastText()).toContain("— draw");
    expect(chat.captions()).toEqual([]);
    expect(chat.promptId()).toBeNull();
  });
});

describeScenario("an unanswered ask is taken back", (chat) => {
  let firstPrompt: number | null = null;

  it("should stand after the first /game", async () => {
    await chat.say("/game");

    firstPrompt = chat.promptId();

    expect(firstPrompt).not.toBeNull();
  });

  it("should be deleted and replaced by the next /game", async () => {
    await chat.say("/game");

    expect(chat.messages().some((message) => message.messageId === firstPrompt)).toBe(false);
    expect(chat.promptId()).not.toBe(firstPrompt);
    expect(chat.promptId()).not.toBeNull();
  });

  it("should ignore plain text that is not a reply", async () => {
    await chat.say("Anya, Roma");

    expect(chat.captions()).toEqual([]);
  });
});
