import { vi } from "vitest";


type InlineKeyboardModule = typeof import("#shared/telegram/inline-keyboard.ts");

export class InlineKeyboardStub {
  public toMarkupSpy = vi.fn<InlineKeyboardModule["toMarkup"]>();

  public readonly module: InlineKeyboardModule;

  public constructor() {
    this.toMarkupSpy.mockReturnValue({ inline_keyboard: [] });

    this.module = { toMarkup: (rows) => this.toMarkupSpy(rows) };
  }
}
