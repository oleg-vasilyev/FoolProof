import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";
import type { Chat } from "../harness/scenario-chat.ts";


const PNG_MAGIC = "89504e47";

const MAGIC_LENGTH = 4;

const NOTHING = 0;

const ONE_PICTURE = 1;

const BOTH_PICTURES = 2;

const CONFIRM = "✅ Confirm";

const playAnotherGame = async (chat: Chat, exits: readonly string[]): Promise<void> => {
  await chat.say("/next");

  for (const name of exits) {
    await chat.tap(name);
  }

  await chat.tap(CONFIRM);
};

describeScenario("/stats draws the session as a picture", (chat) => {
  it("should have nothing to draw before the first game", async () => {
    await chat.say("/stats");

    expect(chat.lastText()).toBe("Nothing recorded yet. Start a game with /game.");
    expect(chat.photoBytes()).toBeUndefined();
  });

  it("should draw a PNG once games are recorded", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Roma");
    await chat.tap(CONFIRM);

    await playAnotherGame(chat, ["Roma", "Oleg"]);
    await playAnotherGame(chat, ["Oleg", "Anya"]);

    await chat.say("/stats");

    const picture = chat.photoBytes();

    expect(picture).toBeDefined();
    expect(picture?.subarray(NOTHING, MAGIC_LENGTH).toString("hex")).toBe(PNG_MAGIC);
    expect(picture?.length ?? NOTHING).toBeGreaterThan(NOTHING);
  });

  it("should keep the awards to itself while the evening is still short", async () => {
    const before = chat.photosSent();

    await chat.say("/stats");

    expect(chat.photosSent()).toBe(before + ONE_PICTURE);
  });

  it("should say how much more play the awards need when asked too early", async () => {
    await chat.say("/stats_awards");

    expect(chat.lastText()).toContain("and the awards appear");
    expect(chat.lastText()).toContain("/stats_chronology");
  });

  it("should draw both pictures once the evening is long enough", async () => {
    await playAnotherGame(chat, ["Anya", "Roma"]);
    await playAnotherGame(chat, ["Roma", "Anya"]);
    const before = chat.photosSent();

    await chat.say("/stats");

    expect(chat.photosSent()).toBe(before + BOTH_PICTURES);
  });

  it("should send the chronology on its own when only it was asked for", async () => {
    const before = chat.photosSent();

    await chat.say("/stats_chronology");

    expect(chat.photosSent()).toBe(before + ONE_PICTURE);
  });

  it("should send the awards on its own when only they were asked for", async () => {
    const before = chat.photosSent();

    await chat.say("/stats_awards");

    expect(chat.photosSent()).toBe(before + ONE_PICTURE);
  });
});
