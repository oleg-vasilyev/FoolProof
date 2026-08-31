import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";
import { Standing } from "#scoresheet/render/personal/tile-standings.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";


const A_GRID_RIGHT = 1500;

const A_PAD = 50;

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY: "Test Sans",
  GRID_RIGHT: A_GRID_RIGHT,
  PAD: A_PAD,
}));

const A_PLAYER_INK = "player-ink";

const FOOL_INK = "fool-ink";

const FIGURE_INK = "figure-ink";

const FAINT_INK = "faint-ink";

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: {
    ink: "ink",
    inkKey: "key-ink",
    inkHint: "hint-ink",
    inkFaint: FAINT_INK,
    inkFigure: FIGURE_INK,
    cellFool: FOOL_INK,
    cellPlaced: "track-ink",
  },
}));

const percentLabelSpy = vi.fn();

vi.mock("#scoresheet/render/percent-label.ts", () => ({
  percentLabel: (share: number) => percentLabelSpy(share),
}));

const gameTallySpy = vi.fn();

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

const A_BAR_WIDTH = 300;

const A_BAR_DROP = 150;

const A_TILES_TOP = 400;

const A_ROW_HEIGHT = 280;

const A_NOTE_DROP = 210;

const A_NOTE_BASELINE = 940;

vi.mock("#scoresheet/render/personal/personal-metrics.ts", () => ({
  TILES_PER_ROW: 2,
  TILES_TOP: A_TILES_TOP,
  TILE_BAR_DROP: A_BAR_DROP,
  TILE_BAR_HEIGHT: 12,
  TILE_BAR_RADIUS: 6,
  TILE_BAR_WIDTH: A_BAR_WIDTH,
  TILE_MARK_GAP: 25,
  TILE_MARK_LIFT: 15,
  TILE_NOTE_DROP: A_NOTE_DROP,
  TILES_NOTE_BASELINE: A_NOTE_BASELINE,
  TILE_ROW_HEIGHT: A_ROW_HEIGHT,
  TILE_TICK_DROP: 20,
  TILE_TICK_RISE: 7,
  TILE_TICK_WIDTH: 2,
  TILE_TRACKING: 3,
  TILE_VALUE_DROP: 120,
  personalFont: { tileLabel: 28, tileValue: 110, tileNote: 27 },
}));

const gapOfSpy = vi.fn();

vi.mock("#scoresheet/render/personal/tile-gap.ts", () => ({
  gapOf: (value: number, expected: number, decided: number, favours: boolean) =>
    gapOfSpy(value, expected, decided, favours),
}));

const rectSpy = vi.fn();

const lineSpy = vi.fn();

const textSpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { careerTiles } = await import("#scoresheet/render/personal/career-tiles.ts");

const NOTHING = 0;

const EVERY_TILE = 4;

const A_SHARE = 0.61;

const A_SHARE_CHANCE = 0.5;

const A_FOOL_RATE = 0.41;

const A_SEAT_IN_DECIDED = 0.22;

const A_FIRST_RATE = 0.15;

const A_SEAT_CHANCE = 0.19;

const AN_OPEN_RATE = 0.24;

const GAMES = 33;

const DECIDED = 32;

const FOOLS = 13;

const FIRSTS = 5;

const OPENS = 8;

const A_TALLY = "tally-text";

const cardOf = (): CareerCard =>
  ({
    share: A_SHARE,
    tally: {
      games: GAMES,
      decided: DECIDED,
      fools: FOOLS,
      firsts: FIRSTS,
      opens: OPENS,
      shareChance: A_SHARE_CHANCE,
      foolRate: A_FOOL_RATE,
      firstRate: A_FIRST_RATE,
      openRate: AN_OPEN_RATE,
      seatChance: A_SEAT_CHANCE,
      seatChanceInDecided: A_SEAT_IN_DECIDED,
    },
  }) as CareerCard;

const drawn = (): readonly string[] => careerTiles(copy, cardOf(), A_PLAYER_INK);

const fillsOf = (): readonly unknown[] =>
  rectSpy.mock.calls.map((call) => (call[NOTHING] as Record<string, unknown>).fill);

describe("careerTiles()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    percentLabelSpy.mockImplementation((share: number) => `pct(${String(share)})`);
    gameTallySpy.mockReturnValue(A_TALLY);
    gapOfSpy.mockReturnValue({ standing: Standing.Level, from: NOTHING, to: NOTHING });
    rectSpy.mockImplementation(() => "<rect/>");
    lineSpy.mockImplementation(() => "<line/>");
    textSpy.mockImplementation((value: string) => `<text>${value}</text>`);
  });

  describe("what each tile says", () => {
    it("should label every tile from the copy table", () => {
      drawn();

      const labels = textSpy.mock.calls.map((call) => call[NOTHING]);

      expect(labels).toContain(copy.tileShare);
      expect(labels).toContain(copy.tileFool);
      expect(labels).toContain(copy.tileFirst);
      expect(labels).toContain(copy.tileFirstMove);
    });

    it("should print each tile's own rate through the percent label", () => {
      drawn();

      const printed = textSpy.mock.calls.map((call) => call[NOTHING]);

      expect(printed).toContain(`pct(${String(A_SHARE)})`);
      expect(printed).toContain(`pct(${String(A_FOOL_RATE)})`);
      expect(printed).toContain(`pct(${String(A_FIRST_RATE)})`);
      expect(printed).toContain(`pct(${String(AN_OPEN_RATE)})`);
    });

    it("should count the share tile in games and the rest against their own whole", () => {
      drawn();

      const printed = textSpy.mock.calls.map((call) => call[NOTHING]);

      expect(gameTallySpy).toHaveBeenCalledWith(copy, GAMES);
      expect(printed).toContain(A_TALLY);
      expect(printed).toContain(copy.tileOutOf(FOOLS, DECIDED));
      expect(printed).toContain(copy.tileOutOf(FIRSTS, GAMES));
      expect(printed).toContain(copy.tileOutOf(OPENS, GAMES));
    });

    it("should say once, under the tiles, what the mark on the bar means", () => {
      drawn();

      expect(textSpy).toHaveBeenCalledWith(
        copy.tileExpectationNote,
        expect.objectContaining({ y: A_NOTE_BASELINE, fill: FAINT_INK })
      );
    });
  });

  describe("the bar under each figure", () => {
    it("should lay a track and fill it as far as the figure reaches", () => {
      drawn();

      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ width: A_BAR_WIDTH, y: A_TILES_TOP + A_BAR_DROP })
      );
      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ width: A_BAR_WIDTH * A_SHARE })
      );
    });

    it("should mark where the figure was expected to land", () => {
      drawn();

      expect(lineSpy).toHaveBeenCalledTimes(EVERY_TILE);
      expect(lineSpy).toHaveBeenCalledWith(
        expect.objectContaining({ x1: A_PAD + A_BAR_WIDTH * A_SHARE_CHANCE })
      );
    });

    it("should print the expected figure beside the bar it belongs to", () => {
      drawn();

      expect(textSpy).toHaveBeenCalledWith(
        `pct(${String(A_SHARE_CHANCE)})`,
        expect.objectContaining({ fill: "hint-ink" })
      );
    });
  });

  describe("the gap between the figure and its expectation", () => {
    it("should read each tile against the whole its own rate came out of", () => {
      drawn();

      expect(gapOfSpy).toHaveBeenCalledWith(A_SHARE, A_SHARE_CHANCE, GAMES, true);
      expect(gapOfSpy).toHaveBeenCalledWith(A_FOOL_RATE, A_SEAT_IN_DECIDED, DECIDED, false);
      expect(gapOfSpy).toHaveBeenCalledWith(A_FIRST_RATE, A_SEAT_CHANCE, GAMES, true);
    });

    it("should never let the first move be judged, because it is dealt and not played", () => {
      drawn();

      expect(gapOfSpy).toHaveBeenCalledWith(AN_OPEN_RATE, A_SEAT_CHANCE, NOTHING, true);
    });

    it("should paint a gap in the player's favour in the player's own colour", () => {
      const A_TENTH = 0.1;

      gapOfSpy.mockReturnValue({ standing: Standing.Better, from: A_TENTH, to: A_SHARE });

      drawn();

      expect(fillsOf()).toContain(A_PLAYER_INK);
    });

    it("should paint a gap against the player in the fool's red", () => {
      const A_TENTH = 0.1;

      gapOfSpy.mockReturnValue({ standing: Standing.Worse, from: A_TENTH, to: A_SHARE });

      drawn();

      expect(fillsOf()).toContain(FOOL_INK);
    });

    it("should leave a record too short to judge in the quiet grey", () => {
      const A_TENTH = 0.1;

      gapOfSpy.mockReturnValue({ standing: Standing.Unproven, from: A_TENTH, to: A_SHARE });

      drawn();

      expect(fillsOf()).toContain(FIGURE_INK);
    });

    it("should draw no gap at all when the figure sits on its expectation", () => {
      drawn();

      expect(fillsOf()).not.toContain(A_PLAYER_INK);
      expect(fillsOf()).not.toContain(FOOL_INK);
      expect(rectSpy).toHaveBeenCalledTimes(EVERY_TILE * 2);
    });

    it("should span the gap from where it starts to where it ends", () => {
      const A_TENTH = 0.1;

      gapOfSpy.mockReturnValue({ standing: Standing.Worse, from: A_TENTH, to: A_SHARE });

      drawn();

      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          x: A_PAD + A_BAR_WIDTH * A_TENTH,
          width: A_BAR_WIDTH * (A_SHARE - A_TENTH),
        })
      );
    });
  });
});
