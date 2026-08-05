import { beforeEach, describe, expect, it, vi } from "vitest";
import { PluralRulesStub } from "#shared/locale/plural-rules.stub.ts";
import { copy } from "#merge-names/copy.en.ts";
import { copy as russian } from "#merge-names/copy.ru.ts";


const plural = new PluralRulesStub();

vi.mock("#shared/locale/plural-rules.ts", () => plural.module);

const { gameTally } = await import("#merge-names/render/game-tally.ts");

const TALLY = "the counted games";

const TWO_GAMES = 2;

describe("gameTally()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    plural.countedSpy.mockReturnValue(TALLY);
  });

  it("should give back whatever the counter made of it", () => {
    expect(gameTally(copy, TWO_GAMES)).toBe(TALLY);
  });

  it("should count games with the forms of the copy it was given", () => {
    gameTally(copy, TWO_GAMES);

    expect(plural.countedSpy).toHaveBeenCalledWith(copy.locale, TWO_GAMES, copy.gameForms);
  });

  it("should count in the language of the copy it was given, not the one it imported", () => {
    gameTally(russian, TWO_GAMES);

    expect(plural.countedSpy).toHaveBeenCalledWith(russian.locale, TWO_GAMES, russian.gameForms);
  });
});
