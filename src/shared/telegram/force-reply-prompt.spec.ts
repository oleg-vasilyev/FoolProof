import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";


const { answeredPromptText, askAsReply } = await import("#shared/telegram/force-reply-prompt.ts");

const COMMAND_MESSAGE_ID = 10;

const SENT_MESSAGE_ID = 500;

const BOT_ID = 424242;

const USER_ID = 777;

const QUESTION = "Who is playing?";

const PLACEHOLDER = "names, comma separated";

interface Quoted {
  readonly text: string | undefined;
  readonly fromId: number | undefined;
}

const commandOf = (replySpy: ReturnType<typeof vi.fn>, withMessage: boolean): Command =>
  ({
    msg: withMessage ? { message_id: COMMAND_MESSAGE_ID } : undefined,
    reply: replySpy,
  }) as unknown as Command;

const textMessageOf = (quoted: Quoted | undefined): TextMessage =>
  ({
    me: { id: BOT_ID },
    message: {
      text: "Anya, Roma",
      reply_to_message:
        quoted === undefined
          ? undefined
          : { text: quoted.text, from: quoted.fromId === undefined ? undefined : { id: quoted.fromId } },
    },
  }) as unknown as TextMessage;

describe("askAsReply()", () => {
  let replySpy: ReturnType<typeof vi.fn>;

  const lastOptions = (): Record<string, unknown> => replySpy.mock.calls[0]?.[1] ?? {};

  beforeEach(() => {
    replySpy = vi.fn().mockResolvedValue({ message_id: SENT_MESSAGE_ID });
  });

  it("should send the question it was given", async () => {
    await askAsReply(commandOf(replySpy, true), QUESTION, PLACEHOLDER);

    expect(replySpy.mock.calls[0]?.[0]).toBe(QUESTION);
  });

  it("should force a reply, aimed at the one who asked", async () => {
    await askAsReply(commandOf(replySpy, true), QUESTION, PLACEHOLDER);

    expect(lastOptions().reply_markup).toMatchObject({ force_reply: true, selective: true });
  });

  it("should set the placeholder it was given", async () => {
    await askAsReply(commandOf(replySpy, true), QUESTION, PLACEHOLDER);

    expect(lastOptions().reply_markup).toMatchObject({ input_field_placeholder: PLACEHOLDER });
  });

  it("should quote the command message, so selective has somebody to target", async () => {
    await askAsReply(commandOf(replySpy, true), QUESTION, PLACEHOLDER);

    expect(lastOptions().reply_parameters).toEqual({ message_id: COMMAND_MESSAGE_ID });
  });

  it("should quote nothing when the command carried no message", async () => {
    await askAsReply(commandOf(replySpy, false), QUESTION, PLACEHOLDER);

    expect(lastOptions().reply_parameters).toBeUndefined();
  });

  it("should hand back the prompt it sent", async () => {
    const sent = await askAsReply(commandOf(replySpy, true), QUESTION, PLACEHOLDER);

    expect(sent).toEqual({ message_id: SENT_MESSAGE_ID });
  });
});

describe("answeredPromptText()", () => {
  it("should give the text of the bot's own message the reply quotes", () => {
    expect(answeredPromptText(textMessageOf({ text: QUESTION, fromId: BOT_ID }))).toBe(QUESTION);
  });

  it("should give nothing for a message that quotes nobody", () => {
    expect(answeredPromptText(textMessageOf(undefined))).toBeNull();
  });

  it("should give nothing for a reply to somebody else's message", () => {
    expect(answeredPromptText(textMessageOf({ text: QUESTION, fromId: USER_ID }))).toBeNull();
  });

  it("should give nothing for a reply to a message with no sender", () => {
    expect(answeredPromptText(textMessageOf({ text: QUESTION, fromId: undefined }))).toBeNull();
  });

  it("should give nothing for a reply to a message of its own that carries no text", () => {
    expect(answeredPromptText(textMessageOf({ text: undefined, fromId: BOT_ID }))).toBeNull();
  });
});
