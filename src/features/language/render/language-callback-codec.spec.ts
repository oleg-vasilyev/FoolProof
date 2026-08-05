import { describe, expect, it } from "vitest";
import { LOCALES, Locale } from "#shared/locale/locales.ts";
import {
  LANGUAGE_TAPS,
  decodeLanguageCallback,
  encodeLanguageCallback,
} from "#language/render/language-callback-codec.ts";


const CALLBACK_DATA_LIMIT = 64;

describe("language-callback-codec", () => {
  describe("encodeLanguageCallback()", () => {
    it.each(LOCALES)("should encode %s to something the pattern claims", (locale) => {
      expect(LANGUAGE_TAPS.test(encodeLanguageCallback(locale))).toBe(true);
    });

    it("should give each language its own data", () => {
      expect(new Set(LOCALES.map(encodeLanguageCallback)).size).toBe(LOCALES.length);
    });

    it.each(LOCALES)("should stay inside Telegram's 64 bytes for %s", (locale) => {
      expect(Buffer.byteLength(encodeLanguageCallback(locale))).toBeLessThanOrEqual(
        CALLBACK_DATA_LIMIT
      );
    });
  });

  describe("decodeLanguageCallback()", () => {
    it.each(LOCALES)("should read %s back out of its own data", (locale) => {
      expect(decodeLanguageCallback(encodeLanguageCallback(locale))).toBe(locale);
    });

    it("should refuse data that belongs to another screen", () => {
      expect(decodeLanguageCallback("m:1.2:k:-")).toBeNull();
    });

    it("should refuse a language the bot does not speak", () => {
      expect(decodeLanguageCallback("l:de")).toBeNull();
    });

    it("should refuse an empty payload", () => {
      expect(decodeLanguageCallback("")).toBeNull();
    });

    it("should refuse data that only starts like its own", () => {
      expect(decodeLanguageCallback(`${encodeLanguageCallback(Locale.Ru)}:9`)).toBeNull();
    });

    it("should refuse data that only ends like its own", () => {
      expect(decodeLanguageCallback(`x${encodeLanguageCallback(Locale.Ru)}`)).toBeNull();
    });
  });

  describe("LANGUAGE_TAPS", () => {
    it("should not claim another screen's data", () => {
      expect(LANGUAGE_TAPS.test("m:1.2:k:-")).toBe(false);
      expect(LANGUAGE_TAPS.test("s:1.2:0:p:3")).toBe(false);
    });

    it("should claim its own", () => {
      expect(LANGUAGE_TAPS.test(encodeLanguageCallback(Locale.Ru))).toBe(true);
    });
  });
});
