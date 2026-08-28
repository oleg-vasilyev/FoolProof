import { beforeEach, describe, expect, it, vi } from "vitest";
import { GRID_RIGHT, PAD, USUAL_FALLBACK } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import {
  TILES_PER_ROW,
  TILES_TOP,
  TILE_COUNT,
  TILE_NOTE_DROP,
  TILE_ROW_HEIGHT,
  TILE_SECOND_NOTE_DROP,
  TILE_TRACKING,
  TILE_VALUE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { copy as russian } from "#scoresheet/copy.ru.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";


const textSpy = vi.fn();

const percentLabelSpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

vi.mock("#scoresheet/render/percent-label.ts", () => ({
  percentLabel: (share: number) => percentLabelSpy(share),
}));

const { careerTiles } = await import("#scoresheet/render/personal/career-tiles.ts");

const RATED_TILES = 4;

const PREDICTED_TILES = 4;

const DRAWN_ELEMENTS = 16;

const DECIDED = 94;

const GAMES = 96;

const EVENINGS = 11;

const SHARE = 0.55;

const AN_EVEN_SPLIT = 0.5;

const FOOL_RATE = 0.2;

const FOOLS = 8;

const CHANCE_IN_DECIDED = 0.25;

const FIRST_RATE = 0.3;

const FIRSTS = 12;

const CHANCE = 0.28;

const OPEN_RATE = 0.18;

const OPENS = 9;

const INK = "#123456";

const CARD = {
  share: SHARE,
  tally: {
    games: GAMES,
    evenings: EVENINGS,
    shareChance: AN_EVEN_SPLIT,
    fools: FOOLS,
    decided: DECIDED,
    foolRate: FOOL_RATE,
    seatChanceInDecided: CHANCE_IN_DECIDED,
    firsts: FIRSTS,
    firstRate: FIRST_RATE,
    seatChance: CHANCE,
    opens: OPENS,
    openRate: OPEN_RATE,
  },
} as unknown as CareerCard;

const nothingDrawn = {
  ...CARD,
  tally: { ...CARD.tally, decided: GAMES },
} as unknown as CareerCard;

const pct = (share: number): string => `pct(${String(share)})`;

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
    textSpy.mockImplementation((value: string) => `<text:${value}>`);
  });

  describe("what the tiles say", () => {
    it("should draw exactly the number of tiles the layout reserves room for", () => {
      careerTiles(copy, CARD, INK);

      const labelled = [copy.tileShare, copy.tileFool, copy.tileFirst, copy.tileFirstMove].filter(
        (label) => textSpy.mock.calls.some((call) => call[0] === label)
      );

      expect(labelled).toHaveLength(TILE_COUNT);
    });

    it("should label every tile from the copy table", () => {
      careerTiles(copy, CARD, INK);

      for (const label of [copy.tileShare, copy.tileFool, copy.tileFirst, copy.tileFirstMove]) {
        expect(textSpy).toHaveBeenCalledWith(label, expect.anything());
      }
    });

    it("should print every figure through the percent label, since every tile is a rate now", () => {
      careerTiles(copy, CARD, INK);

      expect(percentLabelSpy).toHaveBeenCalledWith(SHARE);
      expect(percentLabelSpy).toHaveBeenCalledWith(FOOL_RATE);
      expect(percentLabelSpy).toHaveBeenCalledWith(FIRST_RATE);
      expect(percentLabelSpy).toHaveBeenCalledWith(OPEN_RATE);
    });

    it("should print the rate each tile is about, not a neighbour's", () => {
      careerTiles(copy, CARD, INK);

      expect(textSpy).toHaveBeenCalledWith(pct(FOOL_RATE), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(pct(FIRST_RATE), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(pct(OPEN_RATE), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(pct(SHARE), expect.anything());
    });

    it("should tell the reader which end of the share is the good one", () => {
      careerTiles(copy, CARD, INK);

      expect(textSpy).toHaveBeenCalledWith(copy.tileShareScale, expect.anything());
    });

    it("should count each of the other three against its own whole", () => {
      careerTiles(copy, CARD, INK);

      expect(textSpy).toHaveBeenCalledWith(copy.tileOutOf(FOOLS, DECIDED), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(copy.tileOutOf(FIRSTS, GAMES), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(copy.tileOutOf(OPENS, GAMES), expect.anything());
    });

    it("should give every tile the chance its seat alone would earn, the share included", () => {
      careerTiles(copy, CARD, INK);

      expect(textSpy).toHaveBeenCalledWith(
        copy.tileSeatPredicts(pct(CHANCE_IN_DECIDED)),
        expect.anything()
      );
      expect(textSpy).toHaveBeenCalledWith(copy.tileSeatPredicts(pct(CHANCE)), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(copy.tileSeatPredicts(pct(AN_EVEN_SPLIT)), expect.anything());
    });

    it("should read the fool against the games that had one, and the rest against every game", () => {
      careerTiles(copy, CARD, INK);

      expect(percentLabelSpy).toHaveBeenCalledWith(CHANCE_IN_DECIDED);
      expect(percentLabelSpy).toHaveBeenCalledWith(CHANCE);
      expect(percentLabelSpy).toHaveBeenCalledTimes(RATED_TILES + PREDICTED_TILES);
    });
  });

  describe("the denominator the fool tile is read against", () => {
    it("should count the fool out of the games that had one, not out of every game", () => {
      careerTiles(copy, CARD, INK);

      expect(textSpy).toHaveBeenCalledWith(copy.tileOutOf(FOOLS, DECIDED), expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith(copy.tileOutOf(FOOLS, GAMES), expect.anything());
      expect(DECIDED).not.toBe(GAMES);
    });

    it("should read the same when no draw kept a game out of the count", () => {
      careerTiles(copy, nothingDrawn, INK);

      expect(textSpy).toHaveBeenCalledWith(copy.tileOutOf(FOOLS, GAMES), expect.anything());
    });
  });

  describe("where the tiles sit", () => {
    const leftOf = (label: string): number => attributesOf(label).x as number;

    it("should start the first tile against the left margin", () => {
      careerTiles(copy, CARD, INK);

      expect(leftOf(copy.tileShare)).toBe(PAD);
    });

    it("should run the top row left to right in even columns", () => {
      careerTiles(copy, CARD, INK);
      const column = leftOf(copy.tileFool) - leftOf(copy.tileShare);

      expect(leftOf(copy.tileFool) + column).toBe(GRID_RIGHT);
    });

    it("should wrap back to the left margin after a full row", () => {
      careerTiles(copy, CARD, INK);

      expect(leftOf(copy.tileFirst)).toBe(PAD);
      expect(leftOf(copy.tileFirstMove)).toBe(leftOf(copy.tileFool));
    });

    it("should hold the top row on the tiles' own top", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(copy.tileShare).y).toBe(TILES_TOP);
      expect(attributesOf(copy.tileFool).y).toBe(TILES_TOP);
    });

    it("should drop the second row by exactly one tile row", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(copy.tileFirst).y).toBe(TILES_TOP + TILE_ROW_HEIGHT);
    });

    it("should hang each value below its own label", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(pct(SHARE)).y).toBe(TILES_TOP + TILE_VALUE_DROP);
      expect(attributesOf(pct(FIRST_RATE)).y).toBe(TILES_TOP + TILE_ROW_HEIGHT + TILE_VALUE_DROP);
    });

    it("should stack the two notes below the value in the order they were written", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(copy.tileShareScale).y).toBe(TILES_TOP + TILE_NOTE_DROP);
      expect(attributesOf(copy.tileSeatPredicts(pct(AN_EVEN_SPLIT))).y).toBe(
        TILES_TOP + TILE_SECOND_NOTE_DROP
      );
      expect(TILE_SECOND_NOTE_DROP).toBeGreaterThan(TILE_NOTE_DROP);
    });

    it("should leave no note line of a tile empty, since an empty band reads as a fault", () => {
      careerTiles(copy, CARD, INK);

      expect(drawnAt(TILES_TOP + TILE_NOTE_DROP)).toHaveLength(TILES_PER_ROW);
      expect(drawnAt(TILES_TOP + TILE_SECOND_NOTE_DROP)).toHaveLength(TILES_PER_ROW);
    });
  });

  describe("the colour decisions", () => {
    it("should print the share in the colour it was handed, tying it to its own chart line", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(pct(SHARE)).fill).toBe(INK);
    });

    it("should print the fool tile's own figure in the fool's red", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(pct(FOOL_RATE)).fill).toBe(palette.cellFool);
    });

    it("should print every other figure in the card's plain ink", () => {
      careerTiles(copy, CARD, INK);

      for (const value of [pct(FIRST_RATE), pct(OPEN_RATE)]) {
        expect(attributesOf(value).fill).toBe(palette.ink);
      }
    });

    it("should never print a figure in the fool's red by accident", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(pct(FIRST_RATE)).fill).not.toBe(palette.cellFool);
    });
  });

  describe("how the lines of a tile are set", () => {
    it("should set the label small, tracked and in the key ink", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(copy.tileShare).fill).toBe(palette.inkKey);
      expect(attributesOf(copy.tileShare)["font-size"]).toBe(personalFont.tileLabel);
      expect(attributesOf(copy.tileShare)["letter-spacing"]).toBe(TILE_TRACKING);
      expect(attributesOf(copy.tileShare)["font-weight"]).toBeUndefined();
    });

    it("should set the value bold and far larger than its label", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(pct(SHARE))["font-weight"]).toBe("bold");
      expect(attributesOf(pct(SHARE))["font-size"]).toBe(personalFont.tileValue);
      expect(personalFont.tileValue).toBeGreaterThan(personalFont.tileLabel);
    });

    it("should set the note faint, small and unbolded", () => {
      careerTiles(copy, CARD, INK);

      expect(attributesOf(copy.tileShareScale).fill).toBe(palette.inkFaint);
      expect(attributesOf(copy.tileShareScale)["font-size"]).toBe(personalFont.tileNote);
      expect(attributesOf(copy.tileShareScale)["font-weight"]).toBeUndefined();
    });

    it("should draw four tiles' worth of lines and hand back every one it drew", () => {
      const lines = careerTiles(copy, CARD, INK);

      expect(textSpy).toHaveBeenCalledTimes(DRAWN_ELEMENTS);
      expect(lines).toHaveLength(DRAWN_ELEMENTS);
    });

    it("should repeat the prediction on two tiles read against the same whole", () => {
      const lines = careerTiles(copy, CARD, INK);
      const predicted = lines.filter((line) => line.includes(copy.tileSeatPredicts(pct(CHANCE))));

      expect(predicted).toHaveLength(TILES_PER_ROW);
    });
  });
});

const BOTH_TABLES = [
  ["en", copy],
  ["ru", russian],
] as const;

describe.each(BOTH_TABLES)("careerTiles() and the room a %s note has", (_named, table) => {
  const A_LONG_CAREER = 999;

  const EVERY_ONE = 999;

  const A_FEW_DRAWN = 11;

  const THE_WIDEST_PERCENT = "100%";

  beforeEach(() => {
    vi.clearAllMocks();

    percentLabelSpy.mockReturnValue(THE_WIDEST_PERCENT);
    textSpy.mockImplementation((value: string) => `<text:${value}>`);
  });

  it("should keep every note inside its own column, even at the widest numbers", () => {
    const columnWidth = (GRID_RIGHT - PAD) / TILES_PER_ROW;

    careerTiles(
      table,
      {
        ...CARD,
        tally: {
          ...CARD.tally,
          games: A_LONG_CAREER,
          decided: A_LONG_CAREER - A_FEW_DRAWN,
          fools: EVERY_ONE,
          firsts: EVERY_ONE,
          opens: EVERY_ONE,
        },
      } as unknown as CareerCard,
      INK
    );

    const notes = textSpy.mock.calls
      .filter(([, attributes]) => attributes["font-size"] === personalFont.tileNote)
      .map(([value]) => String(value));

    for (const note of notes) {
      expect(note.length * personalFont.tileNote * USUAL_FALLBACK, note).toBeLessThan(columnWidth);
    }
  });
});
