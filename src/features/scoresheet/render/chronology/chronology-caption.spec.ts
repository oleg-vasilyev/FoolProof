import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";


const gamesShortOfAwardsSpy = vi.fn();

const gameTallySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/awards.ts", () => ({
  gamesShortOfAwards: (played: number) => gamesShortOfAwardsSpy(played),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

const { chronologyCaption } = await import("#scoresheet/render/chronology/chronology-caption.ts");

const NEVER = 0;

const NOTHING_SHORT = 0;

const ONCE = 1;

const PLAYED = 3;

const SHORT_BY = 2;

const TALLY_MARK = "the-tally";

beforeEach(() => {
  vi.clearAllMocks();

  gamesShortOfAwardsSpy.mockReturnValue(SHORT_BY);
  gameTallySpy.mockReturnValue(TALLY_MARK);
});

describe("chronologyCaption()", () => {
  it("should ask the domain how far the evening still is from its awards", () => {
    chronologyCaption(copy, PLAYED);

    expect(gamesShortOfAwardsSpy).toHaveBeenCalledTimes(ONCE);
    expect(gamesShortOfAwardsSpy).toHaveBeenCalledWith(PLAYED);
  });

  it("should count the remainder in words rather than print a bare number", () => {
    chronologyCaption(copy, PLAYED);

    expect(gameTallySpy).toHaveBeenCalledTimes(ONCE);
    expect(gameTallySpy).toHaveBeenCalledWith(copy, SHORT_BY);
  });

  it("should promise the awards with the finished tally in it", () => {
    expect(chronologyCaption(copy, PLAYED)).toBe(copy.moreGamesForAwards(TALLY_MARK));
  });

  it("should say nothing once the evening has earned its awards", () => {
    gamesShortOfAwardsSpy.mockReturnValue(NOTHING_SHORT);

    expect(chronologyCaption(copy, PLAYED)).toBeUndefined();
    expect(gamesShortOfAwardsSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should leave the tally unasked when there is nothing left to promise", () => {
    gamesShortOfAwardsSpy.mockReturnValue(NOTHING_SHORT);

    chronologyCaption(copy, PLAYED);

    expect(gameTallySpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should speak while even one game is still missing", () => {
    gamesShortOfAwardsSpy.mockReturnValue(ONCE);

    expect(chronologyCaption(copy, PLAYED)).toBe(copy.moreGamesForAwards(TALLY_MARK));
  });
});
