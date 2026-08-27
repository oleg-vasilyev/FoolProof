import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


describeScenario("the bot refuses a line-up it cannot use", (chat) => {
  it("should refuse a single player", async () => {
    await chat.say("/game Oleg");

    expect(chat.lastText()).toBe("A game needs at least two players.");
  });

  it("should refuse two of the same name", async () => {
    await chat.say("/game Oleg, Oleg");

    expect(chat.lastText()).toContain("These names appear twice: Oleg");
  });

  it("should not let case make them different people", async () => {
    await chat.say("/game Oleg, oleg");

    expect(chat.lastText()).toContain("These names appear twice");
  });

  it("should have no line-up to repeat yet", async () => {
    await chat.say("/next");

    expect(chat.lastText()).toBe("No previous line-up here yet. Start with /game and the names.");
  });

  it("should leave ordinary chatter alone", async () => {
    const before = chat.messages().length;

    await chat.say("just talking about the weather");

    expect(chat.messages()).toHaveLength(before + 1);
    expect(chat.captions()).toEqual([]);
  });

  it("should refuse a second game while one is live", async () => {
    await chat.say("/game Anya, Roma");
    await chat.say("/game Kim, Dima");

    expect(chat.lastText()).toBe("A game is already in progress.");
    expect(chat.captions()).toEqual(["Anya", "Roma", "❌ Cancel"]);
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("❌ Cancel");

    expect(chat.captions()).toEqual([]);
  });
});

describeScenario("Back undoes one step and Cancel throws the card away", (chat) => {
  it("should throw the card away on Cancel", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("❌ Cancel");

    expect(chat.lastAnswer()).toBe("Cancelled");
    expect(chat.captions()).toEqual([]);
    expect(chat.lastText()).toContain("Cancelled — nothing recorded.");
  });

  it("should take back the last exit", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");

    expect(chat.captions()).toContain("✅ 1 Anya");

    await chat.tap("↩️ Back");

    expect(chat.lastAnswer()).toBe("Undone");
    expect(chat.captions()).toContain("Anya");
    expect(chat.captions()).not.toContain("✅ 1 Anya");
  });

  it("should undo who dealt on a second Back", async () => {
    await chat.tap("↩️ Back");

    expect(chat.cardText()).toContain("Who went first?");
    expect(chat.captions()).toContain("❌ Cancel");
    expect(chat.captions()).not.toContain("↩️ Back");
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("❌ Cancel");

    expect(chat.captions()).toEqual([]);
  });
});

describeScenario("/next repeats the line-up", (chat) => {
  it("should open the next game with the same players in the same order", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Roma");
    await chat.tap("✅ Confirm");

    await chat.say("/next");

    expect(chat.cardText()).toContain("Game 2");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "↩️ Back"]);
  });

  it("should have dealt to the player sitting before the fool", () => {
    expect(chat.cardText()).toContain("Went first: <b>Roma</b>");
    expect(chat.cardText()).not.toContain("Who went first?");
  });

  it("should hand back the deal on Back, and Cancel with it", async () => {
    await chat.tap("↩️ Back");

    expect(chat.cardText()).toContain("Who went first?");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "❌ Cancel"]);
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("❌ Cancel");

    expect(chat.captions()).toEqual([]);
  });
});
