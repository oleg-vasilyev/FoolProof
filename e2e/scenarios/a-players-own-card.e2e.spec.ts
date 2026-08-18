import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";
import type { Chat } from "../harness/scenario-chat.ts";


const PNG_MAGIC = "89504e47";

const MAGIC_LENGTH = 4;

const NOTHING = 0;

const ONE_PICTURE = 1;

const CONFIRM = "✅ Confirm";

const DRAWN_ANYA = "Drawing Anya's card…";

const playAnotherGame = async (chat: Chat, exits: readonly string[]): Promise<void> => {
  await chat.say("/next");

  for (const name of exits) {
    await chat.tap(name);
  }

  await chat.tap(CONFIRM);
};

describeScenario("/personal draws one player's card for all time", (chat) => {
  it("should have nobody to draw before anyone has played", async () => {
    await chat.say("/personal");

    expect(chat.lastText()).toBe("Nobody has finished a game here yet. Start one with /game.");
    expect(chat.captions()).toEqual([]);
  });

  it("should offer the table as buttons once games are recorded", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
    await chat.tap("Anya");
    await chat.tap("Roma");
    await chat.tap(CONFIRM);

    await playAnotherGame(chat, ["Roma", "Oleg"]);
    await playAnotherGame(chat, ["Oleg", "Anya"]);

    await chat.say("/personal");

    expect(chat.lastText()).toBe("Whose card?");
    expect(chat.captions()).toEqual(["Oleg", "Anya", "Roma"]);
  });

  it("should draw a PNG for whichever name was tapped", async () => {
    await chat.tap("Anya");

    const picture = chat.photoBytes();

    expect(picture?.subarray(NOTHING, MAGIC_LENGTH).toString("hex")).toBe(PNG_MAGIC);
    expect(picture?.length ?? NOTHING).toBeGreaterThan(NOTHING);
  });

  it("should close the screen it opened, leaving no keyboard behind", () => {
    const screen = chat.messages().find((message) => message.text === DRAWN_ANYA);

    expect(screen).toBeDefined();
    expect(screen?.buttons).toEqual([]);
    expect(chat.captions()).toEqual([]);
  });

  it("should draw one card per tap, not one per player", async () => {
    const before = chat.photosSent();

    await chat.say("/personal");
    await chat.tap("Oleg");

    expect(chat.photosSent()).toBe(before + ONE_PICTURE);
  });

  it("should refuse a tap naming somebody who never sat at this table", async () => {
    await chat.say("/personal");

    const screen = chat.messages().findLast((message) => message.buttons.length > NOTHING);

    await chat.tapRaw(screen?.messageId ?? NOTHING, "pc:99999");

    expect(chat.lastAnswer()).toBe("That screen is from an older version of the bot");
  });

  it("should leave that refused screen closed like any other", async () => {
    await chat.tap("Oleg");

    expect(chat.captions()).toEqual([]);
  });
});
