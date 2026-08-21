import { vi } from "vitest";
import type { CallbackTap, Command } from "#shared/telegram/telegram-contexts.ts";


export const CHAT_ID = -100777;

export const SENT_MESSAGE_ID = 500;

export const BOT_USERNAME = "FoolProofTestBot";

export class ContextStub {
  public replySpy = vi.fn();
  public replyWithPhotoSpy = vi.fn();
  public editMessageTextSpy = vi.fn();
  public answerCallbackQuerySpy = vi.fn();

  public constructor() {
    this.replySpy.mockResolvedValue({ message_id: SENT_MESSAGE_ID });
    this.replyWithPhotoSpy.mockResolvedValue({ message_id: SENT_MESSAGE_ID });
    this.editMessageTextSpy.mockResolvedValue({ message_id: SENT_MESSAGE_ID });
    this.answerCallbackQuerySpy.mockResolvedValue(true);
  }

  public tap(data: string): CallbackTap {
    return { ...this.tapWithoutChat(data), chat: { id: CHAT_ID } } as unknown as CallbackTap;
  }

  public tapWithoutChat(data: string): CallbackTap {
    return {
      me: { username: BOT_USERNAME },
      callbackQuery: { data },
      editMessageText: this.editMessageTextSpy,
      answerCallbackQuery: this.answerCallbackQuerySpy,
      replyWithPhoto: this.replyWithPhotoSpy,
    } as unknown as CallbackTap;
  }

  public command(text: string): Command {
    return {
      chat: { id: CHAT_ID },
      me: { username: BOT_USERNAME },
      msg: { message_id: SENT_MESSAGE_ID, text },
      reply: this.replySpy,
      replyWithPhoto: this.replyWithPhotoSpy,
    } as unknown as Command;
  }

  public lastReply(): { text: string; options: Record<string, unknown> } {
    const calls = this.replySpy.mock.calls;
    const last = calls[calls.length - 1];

    return { text: last?.[0] ?? "", options: last?.[1] ?? {} };
  }

  public lastPhoto(): { photo: unknown; options: Record<string, unknown> } {
    const calls = this.replyWithPhotoSpy.mock.calls;
    const last = calls[calls.length - 1];

    return { photo: last?.[0], options: last?.[1] ?? {} };
  }
}
