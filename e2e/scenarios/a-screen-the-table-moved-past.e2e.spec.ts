import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


const NOTHING = 0;

const LAST = -1;

describeScenario("a screen left open while the table moved on", (chat) => {
  let screenId = NOTHING;

  let playData = "";

  let cancelData = "";

  let backData = "";

  it("should play a first game, so there is a line-up to change", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Roma");
    await chat.tap("✅ Confirm");

    expect(chat.lastText()).toContain("3 · <b>Oleg</b> — fool");
  });

  it("should open the screen of names and remember where it is", async () => {
    await chat.say("/next_without");

    expect(chat.lastText()).toContain("Who is sitting this one out?");

    screenId = chat.messages().at(LAST)?.messageId ?? NOTHING;
    playData = chat.dataFor("▶️ Play") ?? "";
    cancelData = chat.dataFor("❌ Cancel") ?? "";

    expect(playData).not.toBe("");
  });

  it("should let a whole other game be played while that screen stands", async () => {
    await chat.say("/game Oleg, Anya, Kim");
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Kim");
    await chat.tap("✅ Confirm");

    expect(chat.lastText()).toContain("3 · <b>Oleg</b> — fool");
  });

  it("should refuse the stale screen rather than remove the wrong people", async () => {
    await chat.tapRaw(screenId, playData);

    expect(chat.lastAnswer()).toBe("That line-up has moved on — run /next_without again");
  });

  it("should have opened no card from it", () => {
    expect(chat.cardText()).not.toContain("Who went first?");
  });

  it("should still close on its own cancel", async () => {
    await chat.tapRaw(screenId, cancelData);

    expect(chat.captions()).toEqual([]);
  });

  it("should open a second screen and mark somebody, so Cancel is no longer drawn on it", async () => {
    await chat.say("/next_without");
    await chat.tap("Anya");

    expect(chat.captions()).not.toContain("❌ Cancel");

    screenId = chat.messages().at(LAST)?.messageId ?? NOTHING;
    backData = chat.dataFor("↩️ Back") ?? "";

    expect(backData).not.toBe("");
  });

  it("should let another game be played while that marked screen stands", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Roma");
    await chat.tap("✅ Confirm");

    expect(chat.lastText()).toContain("3 · <b>Oleg</b> — fool");
  });

  it("should close the marked screen on Back rather than leave it with no way out", async () => {
    await chat.tapRaw(screenId, backData);

    expect(chat.lastAnswer()).toBe("That line-up has moved on — run /next_without again");
    expect(chat.captions()).toEqual([]);
  });
});
