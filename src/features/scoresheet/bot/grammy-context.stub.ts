import { vi } from "vitest";
import type { Command } from "#shared/telegram-contexts.ts";


export const CHAT_ID = -100777;

export const SENT_MESSAGE_ID = 500;

export class ContextStub {
  public replySpy = vi.fn();
  public replyWithPhotoSpy = vi.fn();

  public constructor() {
    this.replySpy.mockResolvedValue({ message_id: SENT_MESSAGE_ID });
    this.replyWithPhotoSpy.mockResolvedValue({ message_id: SENT_MESSAGE_ID });
  }

  public command(text: string): Command {
    return {
      chat: { id: CHAT_ID },
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
