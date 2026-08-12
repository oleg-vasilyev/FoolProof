import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


const STRANGER = { id: 999, first_name: "Somebody else" };

const CONFIRM = "✅ Confirm";

describeScenario("/status answers the operator and nobody else", (chat) => {
  it("should report which database is in use", async () => {
    await chat.say("/status");

    expect(chat.lastText()).toContain("Bot status");
    expect(chat.lastText()).toContain("foolproof.e2e");
  });

  it("should report how it is running", () => {
    expect(chat.lastText()).toContain("Up for");
    expect(chat.lastText()).toContain("first start");
  });

  it("should have nobody to count before anything has happened", () => {
    expect(chat.lastText()).toContain(
      "Chats: 0 in all, 0 played in the last week, 0 first seen in it"
    );
    expect(chat.lastText()).toContain("Games: 0 in the last day, 0 in the last week");
  });

  it("should count this chat once it has played, reading the live database", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Roma");
    await chat.tap(CONFIRM);

    await chat.say("/status");

    expect(chat.lastText()).toContain(
      "Chats: 1 in all, 1 played in the last week, 1 first seen in it"
    );
    expect(chat.lastText()).toContain("Games: 1 in the last day, 1 in the last week");
  });

  it("should call a chat that never picked a language exactly that", () => {
    expect(chat.lastText()).toContain("Language: 0 chose Russian, 0 chose English, 1 never asked");
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
      "language",
      "help",
    ]);
  });

  it("should explain every published command", async () => {
    await chat.say("/help");

    expect(chat.lastText()).toContain("/game Oleg, Anya, Roma");
    expect(chat.lastText()).toContain("/next");
    expect(chat.lastText()).toContain("/stats");
    expect(chat.lastText()).toContain("Tap a name to record who went first");
  });

  it("should never mention the hidden command", () => {
    expect(chat.lastText()).not.toContain("/status");
  });
});
