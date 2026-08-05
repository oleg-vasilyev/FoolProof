import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


const STRANGER = { id: 999, first_name: "Somebody else" };

describeScenario("/status answers the operator and nobody else", (chat) => {
  it("should report which database is in use", async () => {
    await chat.say("/status");

    expect(chat.lastText()).toContain("Bot status");
    expect(chat.lastText()).toContain("foolproof.e2e");
  });

  it("should report how it is running", () => {
    expect(chat.lastText()).toContain("Up for");
    expect(chat.lastText()).toContain("first start");
    expect(chat.lastText()).toContain("Log level: warn");
  });

  it("should surface the warning that this run is not talking to Telegram", () => {
    expect(chat.lastText()).toContain("1 warning");
    expect(chat.lastText()).toContain("not Telegram");
  });

  it("should never print a token", () => {
    expect(chat.lastText()).not.toContain("424242:");
  });

  it("should say nothing at all to a stranger", async () => {
    const before = chat.messages().length;

    await chat.say("/status", { from: STRANGER });

    expect(chat.messages()).toHaveLength(before + 1);
    expect(chat.lastText()).not.toContain("Bot status");
  });
});

describeScenario("/help and the / menu agree", (chat) => {
  it("should publish the commands people use, and not the hidden one", () => {
    expect(chat.commands()).toEqual([
      "game",
      "next",
      "next_with",
      "next_without",
      "merge",
      "stats",
      "stats_chronology",
      "stats_awards",
      "help",
    ]);
  });

  it("should explain every published command", async () => {
    await chat.say("/help");

    expect(chat.lastText()).toContain("/game Oleg, Anya, Roma");
    expect(chat.lastText()).toContain("/next");
    expect(chat.lastText()).toContain("/stats");
    expect(chat.lastText()).toContain("Tap a name to record who dealt first");
  });

  it("should never mention the hidden command", () => {
    expect(chat.lastText()).not.toContain("/status");
  });
});
