import { beforeEach, describe, expect, it, vi } from "vitest";
import { GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import {
  TILES_TOP,
  TILE_COUNT,
  TILE_NOTE_DROP,
  TILE_ROW_HEIGHT,
  TILE_TRACKING,
  TILE_VALUE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";


const textSpy = vi.fn();

const percentLabelSpy = vi.fn();

const timeTallySpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

vi.mock("#scoresheet/render/percent-label.ts", () => ({
  percentLabel: (share: number) => percentLabelSpy(share),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  timeTally: (table: unknown, times: number) => timeTallySpy(table, times),
}));

const { careerTiles } = await import("#scoresheet/render/personal/career-tiles.ts");

const RATED_TILES = 6;

const TALLIED_TILES = 3;

const NOTES_IN_TOP_ROW = 1;

const DRAWN_ELEMENTS = 16;

const GAMES = 42;

const EVENINGS = 11;

const SHARE = 0.55;

const FOOL_RATE = 0.2;

const FOOLS = 8;

const EXPECTED_FOOL_RATE = 0.25;

const FIRST_RATE = 0.3;

const FIRSTS = 12;

const EXPECTED_FIRST_RATE = 0.28;

const OPEN_RATE = 0.18;

const OPENS = 9;

const CARD = {
  share: SHARE,
  tally: {
    games: GAMES,
    evenings: EVENINGS,
    fools: FOOLS,
    foolRate: FOOL_RATE,
    expectedFoolRate: EXPECTED_FOOL_RATE,
    firsts: FIRSTS,
    firstRate: FIRST_RATE,
    expectedFirstRate: EXPECTED_FIRST_RATE,
    opens: OPENS,
    openRate: OPEN_RATE,
  },
} as unknown as CareerCard;

const pct = (share: number): string => `pct(${String(share)})`;

const times = (count: number): string => `times(${String(count)})`;

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

const drawnAt = (y: number): readonly Record<string, unknown>[] =>
  textSpy.mock.calls
    .filter((call) => (call[1] as Record<string, unknown>).y === y)
    .map((call) => call[1] as Record<string, unknown>);

describe("careerTiles()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    percentLabelSpy.mockImplementation((share: number) => pct(share));
    timeTallySpy.mockImplementation((_table: unknown, count: number) => times(count));
    textSpy.mockImplementation((value: string) => `<text:${value}>`);
  });

  describe("what the six tiles say", () => {
    it("should draw exactly the number of tiles the layout reserves room for", () => {
      careerTiles(copy, CARD);

      const labelled = [
        copy.tileGames,
        copy.tileEvenings,
        copy.tileShare,
        copy.tileFool,
        copy.tileFirst,
        copy.tileDealt,
      ].filter((label) => textSpy.mock.calls.some((call) => call[0] === label));

      expect(labelled).toHaveLength(TILE_COUNT);
    });

    it("should label all six tiles from the copy table", () => {
      careerTiles(copy, CARD);

      for (const label of [
        copy.tileGames,
        copy.tileEvenings,
        copy.tileShare,
        copy.tileFool,
        copy.tileFirst,
        copy.tileDealt,
      ]) {
        expect(textSpy).toHaveBeenCalledWith(label, expect.anything());
      }
    });

    it("should print the plain counts as counts, not as a share", () => {
      careerTiles(copy, CARD);

      expect(textSpy).toHaveBeenCalledWith(String(GAMES), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(String(EVENINGS), expect.anything());
      expect(percentLabelSpy).not.toHaveBeenCalledWith(GAMES);
    });

    it("should print every rate through the percent label", () => {
      careerTiles(copy, CARD);

      expect(percentLabelSpy).toHaveBeenCalledWith(SHARE);
      expect(percentLabelSpy).toHaveBeenCalledWith(FOOL_RATE);
      expect(percentLabelSpy).toHaveBeenCalledWith(FIRST_RATE);
      expect(percentLabelSpy).toHaveBeenCalledWith(OPEN_RATE);
      expect(percentLabelSpy).toHaveBeenCalledTimes(RATED_TILES);
    });

    it("should print the rate each tile is about, not a neighbour's", () => {
      careerTiles(copy, CARD);

      expect(textSpy).toHaveBeenCalledWith(pct(FOOL_RATE), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(pct(FIRST_RATE), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(pct(OPEN_RATE), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(pct(SHARE), expect.anything());
    });

    it("should count the times behind each note through the tally", () => {
      careerTiles(copy, CARD);

      expect(timeTallySpy).toHaveBeenCalledWith(copy, FOOLS);
      expect(timeTallySpy).toHaveBeenCalledWith(copy, FIRSTS);
      expect(timeTallySpy).toHaveBeenCalledWith(copy, OPENS);
      expect(timeTallySpy).toHaveBeenCalledTimes(TALLIED_TILES);
    });

    it("should note the fool tile with its own count against its own expectation", () => {
      careerTiles(copy, CARD);

      expect(textSpy).toHaveBeenCalledWith(
        copy.tileTimesExpected(times(FOOLS), pct(EXPECTED_FOOL_RATE)),
        expect.anything()
      );
    });

    it("should note the first-out tile with its own count against its own expectation", () => {
      careerTiles(copy, CARD);

      expect(textSpy).toHaveBeenCalledWith(
        copy.tileTimesExpected(times(FIRSTS), pct(EXPECTED_FIRST_RATE)),
        expect.anything()
      );
    });

    it("should note the dealt tile with a bare tally and no expectation", () => {
      careerTiles(copy, CARD);

      expect(textSpy).toHaveBeenCalledWith(times(OPENS), expect.anything());
    });

    it("should hang the copy table's own hint under the share tile", () => {
      careerTiles(copy, CARD);

      expect(textSpy).toHaveBeenCalledWith(copy.tileShareNote, expect.anything());
    });
  });

  describe("what a tile without a note draws", () => {
    it("should draw a label and a value and nothing else", () => {
      expect(careerTiles(copy, CARD)).toHaveLength(DRAWN_ELEMENTS);
    });

    it("should leave the note line of the counting tiles empty", () => {
      careerTiles(copy, CARD);
      const notes = drawnAt(TILES_TOP + TILE_NOTE_DROP);

      expect(notes).toHaveLength(NOTES_IN_TOP_ROW);
      expect(notes[0]?.x).toBe(attributesOf(copy.tileShare).x);
    });
  });

  describe("where the tiles sit", () => {
    const leftOf = (label: string): number => attributesOf(label).x as number;

    it("should start the first tile against the left margin", () => {
      careerTiles(copy, CARD);

      expect(leftOf(copy.tileGames)).toBe(PAD);
    });

    it("should run the top row left to right in even columns", () => {
      careerTiles(copy, CARD);
      const column = leftOf(copy.tileEvenings) - leftOf(copy.tileGames);

      expect(leftOf(copy.tileShare) - leftOf(copy.tileEvenings)).toBe(column);
      expect(leftOf(copy.tileShare) + column).toBe(GRID_RIGHT);
    });

    it("should wrap back to the left margin after a full row", () => {
      careerTiles(copy, CARD);

      expect(leftOf(copy.tileFool)).toBe(PAD);
      expect(leftOf(copy.tileFirst)).toBe(leftOf(copy.tileEvenings));
      expect(leftOf(copy.tileDealt)).toBe(leftOf(copy.tileShare));
    });

    it("should hold the top row on the tiles' own top", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(copy.tileGames).y).toBe(TILES_TOP);
      expect(attributesOf(copy.tileShare).y).toBe(TILES_TOP);
    });

    it("should drop the second row by exactly one tile row", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(copy.tileFool).y).toBe(TILES_TOP + TILE_ROW_HEIGHT);
    });

    it("should hang each value below its own label", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(String(GAMES)).y).toBe(TILES_TOP + TILE_VALUE_DROP);
      expect(attributesOf(pct(FOOL_RATE)).y).toBe(TILES_TOP + TILE_ROW_HEIGHT + TILE_VALUE_DROP);
    });

    it("should hang each note below its own value", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(copy.tileShareNote).y).toBe(TILES_TOP + TILE_NOTE_DROP);
      expect(attributesOf(copy.tileShareNote).y as number).toBeGreaterThan(
        attributesOf(pct(SHARE)).y as number
      );
    });
  });

  describe("the one colour decision", () => {
    it("should print the fool tile's own figure in the fool's red", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(pct(FOOL_RATE)).fill).toBe(palette.cellFool);
    });

    it("should print every other figure in the card's plain ink", () => {
      careerTiles(copy, CARD);

      for (const value of [String(GAMES), String(EVENINGS), pct(SHARE), pct(FIRST_RATE), pct(OPEN_RATE)]) {
        expect(attributesOf(value).fill).toBe(palette.ink);
      }
    });

    it("should never print a figure in the fool's red by accident", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(pct(FIRST_RATE)).fill).not.toBe(palette.cellFool);
    });
  });

  describe("how the three lines of a tile are set", () => {
    it("should set the label small, tracked and in the key ink", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(copy.tileGames).fill).toBe(palette.inkKey);
      expect(attributesOf(copy.tileGames)["font-size"]).toBe(personalFont.tileLabel);
      expect(attributesOf(copy.tileGames)["letter-spacing"]).toBe(TILE_TRACKING);
      expect(attributesOf(copy.tileGames)["font-weight"]).toBeUndefined();
    });

    it("should set the value bold and far larger than its label", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(String(GAMES))["font-weight"]).toBe("bold");
      expect(attributesOf(String(GAMES))["font-size"]).toBe(personalFont.tileValue);
      expect(personalFont.tileValue).toBeGreaterThan(personalFont.tileLabel);
    });

    it("should set the note faint, small and unbolded", () => {
      careerTiles(copy, CARD);

      expect(attributesOf(copy.tileShareNote).fill).toBe(palette.inkFaint);
      expect(attributesOf(copy.tileShareNote)["font-size"]).toBe(personalFont.tileNote);
      expect(attributesOf(copy.tileShareNote)["font-weight"]).toBeUndefined();
    });

    it("should draw six tiles' worth of lines, none of them a repeat", () => {
      const lines = careerTiles(copy, CARD);

      expect(textSpy).toHaveBeenCalledTimes(DRAWN_ELEMENTS);
      expect(new Set(lines).size).toBe(DRAWN_ELEMENTS);
    });
  });
});
