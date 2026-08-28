import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


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

describeScenario("one player written under two names", (chat) => {
  it("should let a typo become a sixth player first", async () => {
    await playGame(chat, "Oleg, Аня", ["Oleg"]);
    await playGame(chat, "Oleg, Анна", ["Анна"]);

    await chat.say("/merge");

    expect(chat.captions()).toEqual(["Oleg · 2", "Анна · 1", "Аня · 1", "🔴 Cancel"]);
  });

  it("should ask which name stays, and say what the number means", () => {
    expect(chat.cardText()).toContain("Merging names");
    expect(chat.cardText()).toContain("Tap the name to keep first");
  });

  it("should settle the keeper on the first tap", async () => {
    await chat.tap("Аня · 1");

    expect(chat.lastAnswer()).toBe("Аня keeps its name");
    expect(chat.cardText()).toContain("<b>Аня</b> keeps its name");
    expect(chat.captions()).toContain("👑 Аня · 1");
  });

  it("should swap Cancel for Back, and withhold Confirm until there is a merge", () => {
    expect(chat.captions()).toContain("↩️ Back");
    expect(chat.captions()).not.toContain("🔴 Cancel");
    expect(chat.captions()).not.toContain("🟢 Confirm");
  });

  it("should read the plan back as a sentence on the second tap", async () => {
    await chat.tap("Анна · 1");

    expect(chat.lastAnswer()).toBe("Анна folds in");
    expect(chat.cardText()).toContain("Анна → <b>Аня</b>");
    expect(chat.cardText()).toContain("Аня will have 2 games");
    expect(chat.captions()).toContain("➕ Анна · 1");
    expect(chat.captions()).toContain("🟢 Confirm");
  });

  it("should let the last tap go again", async () => {
    await chat.tap("↩️ Back");

    expect(chat.lastAnswer()).toBe("Undone");
    expect(chat.captions()).not.toContain("🟢 Confirm");
  });

  it("should merge the two names on Confirm", async () => {
    await chat.tap("Анна · 1");
    await chat.tap("🟢 Confirm");

    expect(chat.lastAnswer()).toBe("Merged");
    expect(chat.captions()).toEqual([]);
    expect(chat.lastText()).toContain("Анна → <b>Аня</b>");
    expect(chat.lastText()).toContain("Аня now has 2 games");
  });

  it("should leave one player where there were two", async () => {
    await chat.say("/merge");

    expect(chat.captions()).toEqual(["Oleg · 2", "Аня · 2", "🔴 Cancel"]);
  });

  it("should refuse two names that sat in the same game", async () => {
    await chat.tap("Аня · 2");
    await chat.tap("Oleg · 2");
    await chat.tap("🟢 Confirm");

    expect(chat.lastAnswer()).toContain("sat in the same game");
  });

  it("should leave the selection alone, so a refusal costs no taps", () => {
    expect(chat.captions()).toEqual(["➕ Oleg · 2", "👑 Аня · 2", "↩️ Back", "🟢 Confirm"]);
  });

  it("should put the refused plan away, tap by tap", async () => {
    await chat.tap("↩️ Back");
    await chat.tap("↩️ Back");
    await chat.tap("🔴 Cancel");

    expect(chat.captions()).toEqual([]);
  });

  it("should keep both of them in the roster after refusing", async () => {
    await chat.say("/merge");

    expect(chat.captions()).toEqual(["Oleg · 2", "Аня · 2", "🔴 Cancel"]);
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("🔴 Cancel");

    expect(chat.captions()).toEqual([]);
  });
});

describeScenario("/merge while a game is being played", (chat) => {
  it("should wait for the card to be confirmed", async () => {
    await playGame(chat, "Oleg, Аня", ["Oleg"]);
    await chat.say("/game Oleg, Анна");

    await chat.say("/merge");

    expect(chat.lastText()).toContain("A game is running");
  });

  it("should offer nothing to tap", () => {
    expect(chat.captions()).toEqual(["Oleg", "Анна", "🔴 Cancel"]);
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("🔴 Cancel");

    expect(chat.captions()).toEqual([]);
  });
});

describeScenario("/merge with nothing to merge", (chat) => {
  it("should say so rather than show a screen with one button", async () => {
    await chat.say("/merge");

    expect(chat.lastText()).toContain("nothing to merge");
    expect(chat.captions()).toEqual([]);
  });
});

describeScenario("a cancelled typo never becomes a permanent player", (chat) => {
  it("should offer Cancel before a starter is picked, and take a typo with it", async () => {
    await playGame(chat, "Oleg, Anna", ["Oleg"]);

    await chat.say("/game Oleg, Anna, Dimma");

    expect(chat.captions()).toEqual(["Oleg", "Anna", "Dimma", "🔴 Cancel"]);

    await chat.tap("🔴 Cancel");

    expect(chat.lastAnswer()).toBe("Cancelled");
    expect(chat.lastText()).toContain("Cancelled — nothing recorded.");
  });

  it("should leave the typo off the merge roster, and keep the players who played", async () => {
    await chat.say("/merge");

    expect(chat.captions()).toEqual(["Anna · 1", "Oleg · 1", "🔴 Cancel"]);

    await chat.tap("🔴 Cancel");
  });

  it("should not sweep a player who already played, just because a later card with a typo named them too", async () => {
    await playGame(chat, "Oleg, Anna, Dima", ["Oleg", "Anna"]);

    await chat.say("/game Oleg, Anna, Dima, Dimma");
    await chat.tap("🔴 Cancel");

    await chat.say("/merge");

    expect(chat.captions()).toEqual(["Anna · 2", "Dima · 1", "Oleg · 2", "🔴 Cancel"]);
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("🔴 Cancel");

    expect(chat.captions()).toEqual([]);
  });
});
