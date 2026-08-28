import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";
import type { Chat } from "../harness/scenario-chat.ts";


const CONFIRM = "🟢 Confirm";

const CANCEL = "🔴 Cancel";

const BACK = "↩️ Back";

const PNG_MAGIC = "89504e47";

const MAGIC_LENGTH = 4;

const WIDTH_AT = 16;

const HEIGHT_AT = 20;

const POSTER_WIDTH = 1620;

const TELEGRAM_HEIGHT_LIMIT = 2560;

const NOTHING = 0;

const ONE_PICTURE = 1;

const openGame = async (chat: Chat, starter: string, exits: readonly string[]): Promise<void> => {
  await chat.tap(starter);

  for (const name of exits) {
    await chat.tap(name);
  }

  await chat.tap(CONFIRM);
};

const nextGame = async (chat: Chat, exits: readonly string[]): Promise<void> => {
  await chat.say("/next");

  for (const name of exits) {
    await chat.tap(name);
  }

  await chat.tap(CONFIRM);
};

describeScenario("a long evening, with the table changing under it", (chat) => {
  it("should open the evening with four at the table", async () => {
    await chat.say("/game Oleg, Anya, Roma, Dima");
    await openGame(chat, "Oleg", ["Oleg", "Anya", "Roma"]);

    expect(chat.lastText()).toContain("4 · <b>Dima</b> — fool");
  });

  it("should record enough games for the awards to have something to judge", async () => {
    await nextGame(chat, ["Anya", "Roma", "Oleg"]);
    await nextGame(chat, ["Oleg", "Dima", "Anya"]);
    await nextGame(chat, ["Oleg", "Anya", "Dima"]);
    await nextGame(chat, ["Roma", "Oleg", "Anya"]);

    expect(chat.lastText()).toContain("4 · <b>Dima</b> — fool");
  });

  it("should carry on after somebody goes home", async () => {
    await chat.say("/next_without Dima");

    expect(chat.cardText()).toContain("Who went first?");

    await openGame(chat, "Anya", ["Oleg", "Anya"]);

    expect(chat.lastText()).toContain("3 · <b>Roma</b> — fool");
  });

  it("should carry on after they come back to a seat of their own", async () => {
    await nextGame(chat, ["Anya", "Oleg"]);
    await chat.say("/next_with Dima");

    expect(chat.lastText()).toContain("Taking seats");

    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Roma");
    await chat.tap("🟢 Play");

    expect(chat.cardText()).toContain("Who went first?");

    await openGame(chat, "Oleg", ["Dima", "Oleg", "Anya"]);

    expect(chat.lastText()).toContain("4 · <b>Roma</b> — fool");
  });

  it("should still draw the awards over an evening full of gaps", async () => {
    await nextGame(chat, ["Anya", "Roma", "Dima"]);
    await nextGame(chat, ["Dima", "Anya", "Roma"]);
    const before = chat.photosSent();

    await chat.say("/stats_awards");

    expect(chat.lastText()).not.toContain("and the awards appear");
    expect(chat.photosSent()).toBe(before + ONE_PICTURE);
  });

  it("should send a picture the Bot API will not shrink", () => {
    const picture = chat.photoBytes();

    expect(picture?.subarray(NOTHING, MAGIC_LENGTH).toString("hex")).toBe(PNG_MAGIC);
    expect(picture?.readUInt32BE(WIDTH_AT)).toBe(POSTER_WIDTH);
    expect(picture?.readUInt32BE(HEIGHT_AT) ?? NOTHING).toBeLessThanOrEqual(
      TELEGRAM_HEIGHT_LIMIT
    );
  });

  it("should leave nothing open behind it", async () => {
    await chat.say("/next");
    await chat.tap(BACK);
    await chat.tap(CANCEL);

    expect(chat.captions()).toEqual([]);
  });
});
