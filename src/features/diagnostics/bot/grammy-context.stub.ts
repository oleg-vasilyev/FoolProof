import { vi } from "vitest";
import type { Command } from "#shared/telegram/telegram-contexts.ts";


export const CHAT_ID = -100777;

const COMMAND_MESSAGE_ID = 500;

export class CommandContextStub {
  public replySpy = vi.fn();

  public readonly context: Command;

  public constructor(askedBy: number | undefined) {
    this.replySpy.mockResolvedValue({ message_id: COMMAND_MESSAGE_ID });

    this.context = {
      chat: { id: CHAT_ID },
      from: askedBy === undefined ? undefined : { id: askedBy },
      msg: { message_id: COMMAND_MESSAGE_ID, text: "/status" },
      reply: this.replySpy,
    } as unknown as Command;
  }
}
