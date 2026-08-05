import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


describeScenario("a whole game, from /game to Confirm", (chat) => {
  it("should offer every player and a way out", async () => {
    await chat.say("/game Oleg, Anya, Roma");

    expect(chat.cardText()).toContain("Game 1");
    expect(chat.cardText()).toContain("Who dealt first?");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma", "❌ Cancel"]);
  });

  it("should record who dealt and stop asking", async () => {
    await chat.tap("Oleg");

    expect(chat.lastAnswer()).toBe("Oleg dealt first");
    expect(chat.cardText()).toContain("Dealt first: <b>Oleg</b>");
    expect(chat.cardText()).not.toContain("Who dealt first?");
  });

  it("should add Back while keeping the card throwable", () => {
    expect(chat.captions()).toContain("↩️ Back");
    expect(chat.captions()).toContain("❌ Cancel");
  });

  it("should answer a tap with the position it recorded", async () => {
    await chat.tap("Anya");

    expect(chat.lastAnswer()).toBe("Anya — 1");
    expect(chat.captions()).toContain("✅ 1 Anya");
  });

  it("should stop offering Cancel once a place is recorded", () => {
    expect(chat.captions()).not.toContain("❌ Cancel");
  });

  it("should offer a draw once two players are left", () => {
    expect(chat.captions()).toContain("🤝 Draw");
  });

  it("should mark the last player left as the fool", async () => {
    await chat.tap("Roma");

    expect(chat.captions()).toContain("✅ 2 Roma");
    expect(chat.captions()).toContain("💀 Oleg");
  });

  it("should offer Confirm, and no longer a draw", () => {
    expect(chat.captions()).toContain("✅ Confirm");
    expect(chat.captions()).not.toContain("🤝 Draw");
  });

  it("should replace the keyboard with the standings on Confirm", async () => {
    await chat.tap("✅ Confirm");

    expect(chat.lastAnswer()).toBe("Recorded");
    expect(chat.captions()).toEqual([]);
    expect(chat.lastText()).toContain("1 · Anya");
    expect(chat.lastText()).toContain("2 · Roma");
    expect(chat.lastText()).toContain("3 · <b>Oleg</b> — fool");
    expect(chat.lastText()).toContain("Dealt first: <b>Oleg</b>");
  });

  it("should number the next game after it", async () => {
    await chat.say("/game Kim, Dima");

    expect(chat.cardText()).toContain("Game 2");
  });

  it("should leave the chat with nothing still open", async () => {
    await chat.tap("❌ Cancel");

    expect(chat.captions()).toEqual([]);
  });
});
