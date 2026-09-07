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

describeScenario("the wrong player was left the fool, and the table notices after Confirm", (chat) => {
  it("should record the game the way it was tapped", async () => {
    await playGame(chat, "Oleg, Anya, Roma", ["Anya", "Roma"]);

    expect(chat.lastText()).toContain("3 · <b>Oleg</b> — fool");
    expect(chat.captions()).toEqual([]);
  });

  it("should bring the game back as a card standing just before Confirm", async () => {
    await chat.say("/reopen");

    expect(chat.cardText()).toContain("Game 1");
    expect(chat.cardText()).toContain("Went first: <b>Oleg</b>");
    expect(chat.captions()).toEqual(["💀 Oleg", "✅ 1 Anya", "✅ 2 Roma", "↩️ Back", "🟢 Confirm"]);
  });

  it("should say on the old result that it was reopened, with nothing left to tap there", () => {
    const reopened = chat.messages().find((message) => message.text.includes("Reopened"));

    expect(reopened?.text).toBe("Reopened — the card is below.");
    expect(reopened?.buttons).toEqual([]);
  });

  it("should let Back take the wrong tap off", async () => {
    await chat.tap("↩️ Back");

    expect(chat.lastAnswer()).toBe("Undone");
    expect(chat.captions()).toEqual(["Oleg", "✅ 1 Anya", "Roma", "↩️ Back", "🟢 Draw"]);
  });

  it("should never offer Cancel on a reopened card, even with everything undone", async () => {
    await chat.tap("↩️ Back");
    await chat.tap("↩️ Back");

    expect(chat.cardText()).toContain("Who went first?");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma"]);
  });

  it("should record the corrected result under the same game number", async () => {
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Oleg");
    await chat.tap("🟢 Confirm");

    expect(chat.lastAnswer()).toBe("Recorded");
    expect(chat.lastText()).toContain("Game 1");
    expect(chat.lastText()).toContain("3 · <b>Roma</b> — fool");
    expect(chat.captions()).toEqual([]);
  });

  it("should start the next game from the corrected fool's neighbour", async () => {
    await chat.say("/next");

    expect(chat.cardText()).toContain("Went first: <b>Anya</b>");
    expect(chat.cardText()).toContain("Game 2");

    await chat.tap("↩️ Back");
    await chat.tap("🔴 Cancel");
  });
});

describeScenario("/reopen with nothing recorded, then while a game is being played", (chat) => {
  it("should say there is nothing to reopen", async () => {
    await chat.say("/reopen");

    expect(chat.lastText()).toContain("nothing to reopen");
    expect(chat.captions()).toEqual([]);
  });

  it("should defer to the live card", async () => {
    await playGame(chat, "Oleg, Anya", ["Oleg"]);
    await chat.say("/game Oleg, Anya");

    await chat.say("/reopen");

    expect(chat.lastText()).toBe("A game is already in progress.");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "🔴 Cancel"]);
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("🔴 Cancel");

    expect(chat.captions()).toEqual([]);
  });
});
