import { vi } from "vitest";
import type { CallbackTap, Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";


export const CHAT_ID = -100777;

export const USER_ID = 777;

export const BOT_ID = 424242;

export const COMMAND_MESSAGE_ID = 10;

export const SENT_MESSAGE_ID = 500;

interface QuotedMessage {
  readonly text: string;
  readonly fromBot: boolean;
}

export class ContextStub {
  public replySpy = vi.fn();
  public answerCallbackQuerySpy = vi.fn();

  public constructor() {
    this.replySpy.mockResolvedValue({ message_id: SENT_MESSAGE_ID });
    this.answerCallbackQuerySpy.mockResolvedValue(true);
  }

  public command(text: string): Command {
    return {
      chat: { id: CHAT_ID },
      msg: { message_id: COMMAND_MESSAGE_ID, text },
      reply: this.replySpy,
    } as unknown as Command;
  }

  public commandWithoutMessage(): Command {
    return {
      chat: { id: CHAT_ID },
      msg: undefined,
      reply: this.replySpy,
    } as unknown as Command;
  }

  public textMessage(text: string, quoted?: QuotedMessage): TextMessage {
    return {
      chat: { id: CHAT_ID },
      me: { id: BOT_ID },
      message: {
        text,
        reply_to_message:
          quoted === undefined
            ? undefined
            : { text: quoted.text, from: { id: quoted.fromBot ? BOT_ID : USER_ID } },
      },
      reply: this.replySpy,
    } as unknown as TextMessage;
  }

  public callbackTap(data: string): CallbackTap {
    return {
      chat: { id: CHAT_ID },
      from: { id: USER_ID },
      callbackQuery: { data },
      answerCallbackQuery: this.answerCallbackQuerySpy,
    } as unknown as CallbackTap;
  }

  public lastReply(): { text: string; options: Record<string, unknown> } {
    const calls = this.replySpy.mock.calls;
    const last = calls[calls.length - 1];

    return { text: last?.[0] ?? "", options: last?.[1] ?? {} };
  }
}
