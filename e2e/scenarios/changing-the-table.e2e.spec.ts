import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


const JOINERS_PROMPT = "Who is joining? Send their names.";

describeScenario("somebody arrives, somebody goes home", (chat) => {
  it("should play a first game to have a line-up to change", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Roma");
    await chat.tap("✅ Confirm");

    expect(chat.lastText()).toContain("3 · <b>Oleg</b> — fool");
  });

  it("should seat everyone but the player who left", async () => {
    await chat.say("/next_without Anya");

    expect(chat.captions()).toEqual(["Oleg", "Roma", "❌ Cancel"]);
  });

  it("should ask who dealt, because the table changed", () => {
    expect(chat.cardText()).toContain("Who went first?");
  });

  it("should not be swallowed by /next, and should ask where the joiner sits", async () => {
    await chat.tap("❌ Cancel");
    await chat.say("/next_with Kim");

    expect(chat.lastText()).toContain("Taking seats");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "Kim", "❌ Cancel"]);
  });

  it("should number a seat as it is taken, and offer to undo it", async () => {
    await chat.tap("Anya");

    expect(chat.captions()).toEqual(["🪑 1 Anya", "Oleg", "Roma", "Kim", "↩️ Back"]);
  });

  it("should put a seat back where it was", async () => {
    await chat.tap("↩️ Back");

    expect(chat.captions()).toEqual(["Anya", "Oleg", "Roma", "Kim", "❌ Cancel"]);
  });

  it("should fill the last seat itself and wait to be told to play", async () => {
    await chat.tap("Anya");
    await chat.tap("Kim");
    await chat.tap("Oleg");

    expect(chat.lastText()).toContain("Taking seats");
    expect(chat.captions()).toEqual([
      "🪑 1 Anya",
      "🪑 2 Kim",
      "🪑 3 Oleg",
      "🪑 4 Roma",
      "↩️ Back",
      "▶️ Play",
    ]);
  });

  it("should open the card on Play, with the first move still to pick", async () => {
    await chat.tap("▶️ Play");

    expect(chat.cardText()).toContain("Who went first?");
    expect(chat.captions()).toEqual(["Oleg", "Roma", "Anya", "Kim", "❌ Cancel"]);
  });

  it("should refuse to seat somebody already at the table", async () => {
    await chat.tap("❌ Cancel");
    await chat.say("/next_with Anya");

    expect(chat.lastText()).toBe(
      "Already at the table: Anya. Name only the players joining."
    );
    expect(chat.captions()).toEqual([]);
  });

  it("should refuse to remove somebody who was not playing", async () => {
    await chat.say("/next_without Kim");

    expect(chat.lastText()).toBe(
      "Not at the table: Kim. Name only the players who were playing."
    );
  });

  it("should refuse to empty the table", async () => {
    await chat.say("/next_without Oleg, Anya");

    expect(chat.lastText()).toBe("A game needs at least two players.");
  });

  it("should ask who is joining when the command carried no names", async () => {
    await chat.say("/next_with");

    expect(chat.lastText()).toBe(JOINERS_PROMPT);
    expect(chat.promptId()).not.toBeNull();
    expect(chat.captions()).toEqual([]);
  });

  it("should reach the seating screen from the reply too", async () => {
    await chat.replyToPrompt("Kim");

    expect(chat.lastText()).toContain("Taking seats");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "Kim", "❌ Cancel"]);
  });

  it("should start no game when the seating is abandoned", async () => {
    await chat.tap("❌ Cancel");

    expect(chat.lastText()).toContain("no game started");

    await chat.say("/next_without Anya");

    expect(chat.captions()).toEqual(["Oleg", "Roma", "❌ Cancel"]);
  });

  it("should offer the last line-up as buttons when no names were given", async () => {
    await chat.tap("❌ Cancel");
    await chat.say("/next_without");

    expect(chat.lastText()).toContain("Who is sitting this one out?");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "❌ Cancel", "▶️ Play"]);
  });

  it("should mark a tapped player as sitting out, and offer to undo it", async () => {
    await chat.tap("Anya");

    expect(chat.lastAnswer()).toBe("Anya sits this one out");
    expect(chat.captions()).toEqual(["Oleg", "🚪 Anya", "Roma", "↩️ Back", "▶️ Play"]);
  });

  it("should take the last mark back, and offer Cancel again once none is left", async () => {
    await chat.tap("↩️ Back");

    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "❌ Cancel", "▶️ Play"]);
  });

  it("should let the same tap put them back in the game", async () => {
    await chat.tap("Anya");
    await chat.tap("🚪 Anya");

    expect(chat.lastAnswer()).toBe("Anya is playing after all");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "❌ Cancel", "▶️ Play"]);
  });

  it("should open the next card without whoever was left marked", async () => {
    await chat.tap("Anya");
    await chat.tap("▶️ Play");

    expect(chat.lastText()).toContain("Who went first?");
    expect(chat.captions()).toEqual(["Oleg", "Roma", "❌ Cancel"]);
  });

  it("should refuse a reply that still names nobody, rather than ask again", async () => {
    await chat.tap("❌ Cancel");
    await chat.say("/next_with");
    await chat.replyToPrompt(",");

    expect(chat.lastText()).toBe("Who is joining? For example: /next_with Zhenya, Sasha");
    expect(chat.captions()).toEqual([]);
  });
});
