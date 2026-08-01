import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


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
    expect(chat.cardText()).toContain("Who dealt first?");
  });

  it("should not be swallowed by /next", async () => {
    await chat.tap("❌ Cancel");
    await chat.say("/next_with Kim");

    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "Kim", "❌ Cancel"]);
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

  it("should ask who is joining when nobody was named", async () => {
    await chat.say("/next_with");

    expect(chat.lastText()).toBe("Who is joining? For example: /next_with Zhenya, Sasha");
  });
});
