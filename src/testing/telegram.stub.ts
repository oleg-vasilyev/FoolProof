import { vi } from "vitest";
import type { Api } from "grammy";
import type { Logger } from "../shared/logger.ts";


const FIRST_MESSAGE_ID = 500;

export class TelegramApiStub {
  public sendMessageSpy = vi.fn();
  public editMessageTextSpy = vi.fn();
  public deleteMessageSpy = vi.fn();
  public setMyCommandsSpy = vi.fn();

  private nextMessageId = FIRST_MESSAGE_ID;

  public constructor() {
    this.sendMessageSpy.mockImplementation(() =>
      Promise.resolve({ message_id: this.nextMessageId++ })
    );
    this.editMessageTextSpy.mockResolvedValue(true);
    this.deleteMessageSpy.mockResolvedValue(true);
    this.setMyCommandsSpy.mockResolvedValue(true);
  }

  public get api(): Api {
    return {
      sendMessage: this.sendMessageSpy,
      editMessageText: this.editMessageTextSpy,
      deleteMessage: this.deleteMessageSpy,
      setMyCommands: this.setMyCommandsSpy,
    } as unknown as Api;
  }

  public lastEdit(): { text: string; markup: unknown } {
    const calls = this.editMessageTextSpy.mock.calls;
    const last = calls[calls.length - 1];

    return { text: last?.[2] ?? "", markup: last?.[3]?.reply_markup };
  }

  public lastSend(): { text: string; markup: unknown } {
    const calls = this.sendMessageSpy.mock.calls;
    const last = calls[calls.length - 1];

    return { text: last?.[1] ?? "", markup: last?.[2]?.reply_markup };
  }
}

export class LoggerStub implements Logger {
  public debugSpy = vi.fn();
  public infoSpy = vi.fn();
  public warnSpy = vi.fn();
  public errorSpy = vi.fn();

  public debug(message: string): void {
    this.debugSpy(message);
  }

  public info(message: string): void {
    this.infoSpy(message);
  }

  public warn(message: string): void {
    this.warnSpy(message);
  }

  public error(message: string): void {
    this.errorSpy(message);
  }
}
