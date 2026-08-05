import { vi } from "vitest";
import type { CallbackTap, Command } from "#shared/telegram/telegram-contexts.ts";


export const CHAT_ID = -100777;

export const USER_ID = 777;

export const SENT_MESSAGE_ID = 500;

export class ContextStub {
  public replySpy = vi.fn();
  public editMessageTextSpy = vi.fn();
  public answerCallbackQuerySpy = vi.fn();

  public constructor() {
    this.replySpy.mockResolvedValue({ message_id: SENT_MESSAGE_ID });
    this.editMessageTextSpy.mockResolvedValue(true);
    this.answerCallbackQuerySpy.mockResolvedValue(true);
  }

  public command(): Command {
    return {
      chat: { id: CHAT_ID },
      reply: this.replySpy,
    } as unknown as Command;
  }

  public callbackTap(data: string): CallbackTap {
    return {
      chat: { id: CHAT_ID },
      from: { id: USER_ID },
      callbackQuery: { data },
      editMessageText: this.editMessageTextSpy,
      answerCallbackQuery: this.answerCallbackQuerySpy,
    } as unknown as CallbackTap;
  }

  public tapWithoutChat(data: string): CallbackTap {
    return {
      chat: undefined,
      from: { id: USER_ID },
      callbackQuery: { data },
      editMessageText: this.editMessageTextSpy,
      answerCallbackQuery: this.answerCallbackQuerySpy,
    } as unknown as CallbackTap;
  }

  public lastReply(): { text: string; options: Record<string, unknown> } {
    const calls = this.replySpy.mock.calls;
    const last = calls[calls.length - 1];

    return { text: last?.[0] ?? "", options: last?.[1] ?? {} };
  }

  public lastEdit(): { text: string; options: Record<string, unknown> } {
    const calls = this.editMessageTextSpy.mock.calls;
    const last = calls[calls.length - 1];

    return { text: last?.[0] ?? "", options: last?.[1] ?? {} };
  }
}
