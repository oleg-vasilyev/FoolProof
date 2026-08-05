import { beforeEach, describe, expect, it, vi } from "vitest";
import { PluralRulesStub } from "#shared/locale/plural-rules.stub.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { copy as russian } from "#scoresheet/copy.ru.ts";


const plural = new PluralRulesStub();

vi.mock("#shared/locale/plural-rules.ts", () => plural.module);

const { gameTally, playerTally } = await import("#scoresheet/render/session-tally.ts");

const COUNTED = "the counted thing";

const MANY = 4;

describe("gameTally()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    plural.countedSpy.mockReturnValue(COUNTED);
  });

  it("should give back whatever the counter made of it", () => {
    expect(gameTally(copy, MANY)).toBe(COUNTED);
  });

  it("should count with the game forms of the copy it was given", () => {
    gameTally(copy, MANY);

    expect(plural.countedSpy).toHaveBeenCalledWith(copy.locale, MANY, copy.sheetGameForms);
  });

  it("should count in the language of the copy it was given", () => {
    gameTally(russian, MANY);

    expect(plural.countedSpy).toHaveBeenCalledWith(russian.locale, MANY, russian.sheetGameForms);
  });
});

describe("playerTally()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    plural.countedSpy.mockReturnValue(COUNTED);
  });

  it("should give back whatever the counter made of it", () => {
    expect(playerTally(copy, MANY)).toBe(COUNTED);
  });

  it("should count with the player forms, not the game ones", () => {
    playerTally(copy, MANY);

    expect(plural.countedSpy).toHaveBeenCalledWith(copy.locale, MANY, copy.sheetPlayerForms);
  });

  it("should count in the language of the copy it was given", () => {
    playerTally(russian, MANY);

    expect(plural.countedSpy).toHaveBeenCalledWith(russian.locale, MANY, russian.sheetPlayerForms);
  });
});
