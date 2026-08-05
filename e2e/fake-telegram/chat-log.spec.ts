import { describe, expect, it } from "vitest";
import {
  buttonWithCaption,
  captionsOf,
  emptyLog,
  liveCard,
  messagesIn,
  messageWithId,
  nextMessageId,
  visibleMessages,
  withDeletion,
  withEdit,
  withEditAttempt,
  withMessage,
  type ChatMessage,
} from "./chat-log.ts";


const FIRST_MESSAGE_ID = 100;

const FIRST_SCENARIO = 1;

const SECOND_SCENARIO = 2;

const MISSING_ID = 999;

const KEYBOARD = [[{ text: "Oleg", data: "1:p:0:0" }]];

const OTHER_KEYBOARD = [[{ text: "Anya", data: "1:p:1:0" }]];

const said = (text: string, over: Partial<Parameters<typeof withMessage>[1]> = {}) => ({
  scenario: FIRST_SCENARIO,
  author: "Oleg",
  fromBot: false,
  text,
  ...over,
});

const logOf = (...texts: readonly string[]): readonly ChatMessage[] =>
  texts.reduce<readonly ChatMessage[]>((log, text) => withMessage(log, said(text)), emptyLog);

describe("nextMessageId()", () => {
  it("should start where Telegram's own ids start for this chat", () => {
    expect(nextMessageId(emptyLog)).toBe(FIRST_MESSAGE_ID);
  });

  it("should follow the last id given, not the count of messages", () => {
    const log = withDeletion(logOf("one", "two"), FIRST_MESSAGE_ID);

    expect(nextMessageId(log)).toBe(FIRST_MESSAGE_ID + 2);
  });
});

describe("withMessage()", () => {
  it("should add the message at the end", () => {
    expect(logOf("one", "two").at(-1)?.text).toBe("two");
  });

  it("should number each message one past the last", () => {
    expect(logOf("one", "two").map((message) => message.messageId)).toEqual([
      FIRST_MESSAGE_ID,
      FIRST_MESSAGE_ID + 1,
    ]);
  });

  it("should give a message with no keyboard an empty one rather than nothing", () => {
    expect(logOf("one")[0]?.buttons).toEqual([]);
  });

  it("should not touch the log it was given", () => {
    const before = logOf("one");

    withMessage(before, said("two"));

    expect(before).toHaveLength(1);
  });
});

describe("withEdit()", () => {
  it("should replace the text and the keyboard of the message named", () => {
    const log = withEdit(logOf("one", "two"), FIRST_MESSAGE_ID, "edited", KEYBOARD);

    expect(log[0]?.text).toBe("edited");
    expect(log[0]?.buttons).toEqual(KEYBOARD);
  });

  it("should count the edit", () => {
    const once = withEdit(logOf("one"), FIRST_MESSAGE_ID, "edited", KEYBOARD);
    const twice = withEdit(once, FIRST_MESSAGE_ID, "again", OTHER_KEYBOARD);

    expect(twice[0]?.edits).toBe(2);
  });

  it("should leave every other message alone", () => {
    const log = withEdit(logOf("one", "two"), FIRST_MESSAGE_ID, "edited", KEYBOARD);

    expect(log[1]?.text).toBe("two");
  });

  it("should change nothing when no message has that id", () => {
    const log = withEdit(logOf("one"), MISSING_ID, "edited", KEYBOARD);

    expect(log[0]?.text).toBe("one");
  });
});

describe("withEditAttempt()", () => {
  it("should count an attempt without changing the message", () => {
    const log = withEditAttempt(logOf("one"), FIRST_MESSAGE_ID);

    expect(log[0]?.editAttempts).toBe(1);
    expect(log[0]?.edits).toBe(0);
    expect(log[0]?.text).toBe("one");
  });
});

describe("withDeletion()", () => {
  it("should mark the message deleted rather than drop it", () => {
    const log = withDeletion(logOf("one"), FIRST_MESSAGE_ID);

    expect(log).toHaveLength(1);
    expect(log[0]?.deleted).toBe(true);
  });
});

describe("visibleMessages()", () => {
  it("should leave out what was deleted", () => {
    const log = withDeletion(logOf("one", "two"), FIRST_MESSAGE_ID);

    expect(visibleMessages(log).map((message) => message.text)).toEqual(["two"]);
  });
});

describe("messagesIn()", () => {
  it("should return only the scenario asked for", () => {
    const log = withMessage(logOf("one"), said("later", { scenario: SECOND_SCENARIO }));

    expect(messagesIn(log, SECOND_SCENARIO).map((message) => message.text)).toEqual(["later"]);
  });

  it("should leave out a deleted message of that scenario", () => {
    const log = withDeletion(logOf("one", "two"), FIRST_MESSAGE_ID);

    expect(messagesIn(log, FIRST_SCENARIO)).toHaveLength(1);
  });
});

describe("messageWithId()", () => {
  it("should find the message named", () => {
    expect(messageWithId(logOf("one", "two"), FIRST_MESSAGE_ID + 1)?.text).toBe("two");
  });

  it("should find nothing for an id nobody was given", () => {
    expect(messageWithId(logOf("one"), MISSING_ID)).toBeUndefined();
  });
});

describe("liveCard()", () => {
  const withCard = (log: readonly ChatMessage[], buttons = KEYBOARD): readonly ChatMessage[] =>
    withMessage(log, said("a card", { fromBot: true, buttons }));

  it("should find the newest bot message that still has buttons", () => {
    const log = withMessage(withCard(logOf("one")), said("after"));

    expect(liveCard(log, FIRST_SCENARIO)?.text).toBe("a card");
  });

  it("should prefer the newest card when two are open", () => {
    const log = withCard(withCard(logOf("one")), OTHER_KEYBOARD);

    expect(liveCard(log, FIRST_SCENARIO)?.buttons).toEqual(OTHER_KEYBOARD);
  });

  it("should ignore a card whose keyboard was taken away", () => {
    const log = withCard(logOf("one"), []);

    expect(liveCard(log, FIRST_SCENARIO)).toBeUndefined();
  });

  it("should ignore a player's own message, however many buttons it claims", () => {
    const log = withMessage(logOf("one"), said("not a card", { buttons: KEYBOARD }));

    expect(liveCard(log, FIRST_SCENARIO)).toBeUndefined();
  });

  it("should ignore a card belonging to another scenario", () => {
    const log = withCard(logOf("one"));

    expect(liveCard(log, SECOND_SCENARIO)).toBeUndefined();
  });
});

describe("captionsOf()", () => {
  it("should flatten every row into the order they are read in", () => {
    const message = withMessage(
      emptyLog,
      said("a card", { fromBot: true, buttons: [...KEYBOARD, ...OTHER_KEYBOARD] })
    )[0];

    expect(captionsOf(message)).toEqual(["Oleg", "Anya"]);
  });

  it("should give nothing back for no message at all", () => {
    expect(captionsOf(undefined)).toEqual([]);
  });
});

describe("buttonWithCaption()", () => {
  const card = withMessage(emptyLog, said("a card", { fromBot: true, buttons: KEYBOARD }))[0];

  it("should find the button by what it says", () => {
    expect(buttonWithCaption(card, "Oleg")?.data).toBe("1:p:0:0");
  });

  it("should find nothing for a caption no button carries", () => {
    expect(buttonWithCaption(card, "Kim")).toBeUndefined();
  });

  it("should find nothing on no message at all", () => {
    expect(buttonWithCaption(undefined, "Oleg")).toBeUndefined();
  });
});
