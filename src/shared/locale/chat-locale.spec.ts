import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOCALE, Locale } from "#shared/locale/locales.ts";
import type { LocaleRepository } from "#shared/repository/repository-contract.ts";
import { createLocaleReader, localeFrom } from "#shared/locale/chat-locale.ts";


const CHAT_ID = 4242;

describe("chat-locale", () => {
  describe("localeFrom()", () => {
    it.each([Locale.En, Locale.Ru])("should recognise %s", (locale) => {
      expect(localeFrom(locale)).toBe(locale);
    });

    it("should refuse a language the bot does not speak", () => {
      expect(localeFrom("de")).toBeNull();
    });

    it("should refuse a chat that never chose", () => {
      expect(localeFrom(null)).toBeNull();
    });
  });

  describe("createLocaleReader()", () => {
    const chatLocaleSpy = vi.fn();
    const repo = { chatLocale: chatLocaleSpy } as unknown as LocaleRepository;

    beforeEach(() => {
      vi.clearAllMocks();

      chatLocaleSpy.mockReturnValue(null);
    });

    it("should ask the repository about the chat it was given", () => {
      createLocaleReader(repo)(CHAT_ID);

      expect(chatLocaleSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should read back the language the chat chose", () => {
      chatLocaleSpy.mockReturnValue(Locale.Ru);

      expect(createLocaleReader(repo)(CHAT_ID)).toBe(Locale.Ru);
    });

    it("should fall back to the default when the chat never chose", () => {
      expect(createLocaleReader(repo)(CHAT_ID)).toBe(DEFAULT_LOCALE);
    });

    it("should fall back to the default when the stored language is not one of ours", () => {
      chatLocaleSpy.mockReturnValue("klingon");

      expect(createLocaleReader(repo)(CHAT_ID)).toBe(DEFAULT_LOCALE);
    });
  });
});
