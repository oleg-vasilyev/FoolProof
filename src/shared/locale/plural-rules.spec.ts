import { describe, expect, it } from "vitest";
import { Locale } from "#shared/locale/locales.ts";
import { counted, wordFor, type WordForms } from "#shared/locale/plural-rules.ts";


const GAMES: WordForms = { one: "игра", few: "игры", many: "игр" };

const ENGLISH_GAMES: WordForms = { one: "game", few: "games", many: "games" };

describe("plural-rules", () => {
  describe("wordFor()", () => {
    it("should give English the singular for exactly one", () => {
      expect(wordFor(Locale.En, 1, ENGLISH_GAMES)).toBe(ENGLISH_GAMES.one);
    });

    it.each([0, 2, 11, 21, 101])(
      "should give English the plural for %i",
      (count) => {
        expect(wordFor(Locale.En, count, ENGLISH_GAMES)).toBe(ENGLISH_GAMES.many);
      }
    );

    it.each([1, 21, 101, 131])("should give Russian the one-form for %i", (count) => {
      expect(wordFor(Locale.Ru, count, GAMES)).toBe(GAMES.one);
    });

    it.each([2, 3, 4, 22, 34, 103])("should give Russian the few-form for %i", (count) => {
      expect(wordFor(Locale.Ru, count, GAMES)).toBe(GAMES.few);
    });

    it.each([0, 5, 9, 20, 25, 100])("should give Russian the many-form for %i", (count) => {
      expect(wordFor(Locale.Ru, count, GAMES)).toBe(GAMES.many);
    });

    it.each([11, 12, 13, 14, 111, 112, 114])(
      "should give Russian the many-form for the teen %i, whatever its last digit",
      (count) => {
        expect(wordFor(Locale.Ru, count, GAMES)).toBe(GAMES.many);
      }
    );
  });

  describe("counted()", () => {
    it("should put the number before the word it chose", () => {
      const TWO = 2;

      expect(counted(Locale.Ru, TWO, GAMES)).toBe(`${String(TWO)} ${GAMES.few}`);
    });

    it("should count in the locale it was given", () => {
      const TWO = 2;

      expect(counted(Locale.En, TWO, ENGLISH_GAMES)).toBe(`${String(TWO)} ${ENGLISH_GAMES.many}`);
    });
  });
});
