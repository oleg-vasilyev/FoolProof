import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";
import type { Chat } from "../harness/scenario-chat.ts";


const PNG_MAGIC = "89504e47";

const MAGIC_LENGTH = 4;

const NOTHING = 0;

const CONFIRM = "✅ Confirm";

const playAnotherGame = async (
  chat: Chat,
  starter: string,
  exits: readonly string[]
): Promise<void> => {
  await chat.say("/next");
  await chat.tap(starter);

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

    await playAnotherGame(chat, "Anya", ["Roma", "Oleg"]);
    await playAnotherGame(chat, "Roma", ["Oleg", "Anya"]);

    await chat.say("/stats");

    const picture = chat.photoBytes();

    expect(picture).toBeDefined();
    expect(picture?.subarray(NOTHING, MAGIC_LENGTH).toString("hex")).toBe(PNG_MAGIC);
    expect(picture?.length ?? NOTHING).toBeGreaterThan(NOTHING);
  });
});
