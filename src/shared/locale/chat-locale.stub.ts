import { vi } from "vitest";
import { Locale } from "#shared/locale/locales.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";


type ChatLocaleModule = typeof import("#shared/locale/chat-locale.ts");

export class LocaleReaderStub {
  public readSpy = vi.fn<LocaleReader>();

  public readonly read: LocaleReader;

  public constructor(locale: Locale = Locale.En) {
    this.readSpy.mockReturnValue(locale);

    this.read = (chatId) => this.readSpy(chatId);
  }
}

export class ChatLocaleStub {
  public localeFromSpy = vi.fn<ChatLocaleModule["localeFrom"]>();
  public createLocaleReaderSpy = vi.fn<ChatLocaleModule["createLocaleReader"]>();

  public readonly reader = new LocaleReaderStub();

  public readonly module: ChatLocaleModule;

  public constructor() {
    this.localeFromSpy.mockReturnValue(Locale.En);
    this.createLocaleReaderSpy.mockReturnValue(this.reader.read);

    this.module = {
      localeFrom: (value) => this.localeFromSpy(value),
      createLocaleReader: (repo) => this.createLocaleReaderSpy(repo),
    };
  }
}
