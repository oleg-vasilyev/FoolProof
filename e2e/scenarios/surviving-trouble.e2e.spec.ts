import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


describeScenario("a restart mid-game loses nothing", (chat) => {
  let cardId = 0;
  let attemptsBefore = 0;

  it("should have a card with one exit recorded", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");

    cardId = chat.cardId();
    attemptsBefore = chat.editAttemptsOf(cardId);

    expect(chat.captions()).toContain("✅ 1 Anya");
  });

  it("should redraw the same message as the bot comes back", async () => {
    await chat.restartBot();

    expect(chat.cardId()).toBe(cardId);
    expect(chat.editAttemptsOf(cardId)).toBeGreaterThan(attemptsBefore);
  });

  it("should have kept everything that was confirmed", () => {
    expect(chat.captions()).toContain("✅ 1 Anya");
    expect(chat.cardText()).toContain("Went first: <b>Oleg</b>");
  });

  it("should still take taps afterwards", async () => {
    await chat.tap("Roma");

    expect(chat.captions()).toContain("✅ 2 Roma");
  });

  it("should still be able to finish the game", async () => {
    await chat.tap("✅ Confirm");

    expect(chat.lastText()).toContain("3 · <b>Oleg</b> — fool");
  });
});

describeScenario("a tap against a card that moved on", (chat) => {
  let cardId = 0;
  let staleData = "";
  let attemptsBefore = 0;

  it("should offer a tap that a later tap will make stale", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");

    cardId = chat.cardId();
    staleData = chat.dataFor("Anya") ?? "";

    expect(staleData).not.toBe("");
  });

  it("should record a fresh tap normally", async () => {
    await chat.tap("Roma");

    expect(chat.captions()).toContain("✅ 1 Roma");

    attemptsBefore = chat.editAttemptsOf(cardId);
  });

  it("should answer the stale tap rather than ignore it", async () => {
    await chat.tapRaw(cardId, staleData);

    expect(chat.lastAnswer()).toBe("Card updated — look again");
  });

  it("should record nothing from it", () => {
    expect(chat.captions()).toContain("✅ 1 Roma");
    expect(chat.captions()).not.toContain("✅ 2 Anya");
  });

  it("should redraw the card, in case the message was the stale one", () => {
    expect(chat.editAttemptsOf(cardId)).toBeGreaterThan(attemptsBefore);
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("Oleg");
    await chat.tap("✅ Confirm");

    expect(chat.captions()).toEqual([]);
  });
});
