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

const TILES_ACROSS = 2;

const A_MARK_GAP = 25;

const A_MARK_LIFT = 15;

const A_TICK_DROP = 20;

const A_TICK_RISE = 9;

const A_VALUE_DROP = 120;

vi.mock("#scoresheet/render/personal/personal-metrics.ts", () => ({
  TILES_PER_ROW: TILES_ACROSS,
  TILES_TOP: A_TILES_TOP,
  TILE_BAR_DROP: A_BAR_DROP,
  TILE_BAR_HEIGHT: 12,
  TILE_BAR_RADIUS: 6,
  TILE_BAR_WIDTH: A_BAR_WIDTH,
  TILE_MARK_GAP: A_MARK_GAP,
  TILE_MARK_LIFT: A_MARK_LIFT,
  TILE_NOTE_DROP: A_NOTE_DROP,
  TILES_NOTE_BASELINE: A_NOTE_BASELINE,
  TILE_ROW_HEIGHT: A_ROW_HEIGHT,
  TILE_TICK_DROP: A_TICK_DROP,
  TILE_TICK_RISE: A_TICK_RISE,
  TILE_TICK_WIDTH: 2,
  TILE_TRACKING: 3,
  TILE_VALUE_DROP: A_VALUE_DROP,
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

const A_TRACK_AND_ITS_FILL = 2;

const ELEMENTS_IN_A_LEVEL_TILE = 7;

const THE_NOTE = 1;

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

const AN_ATTRIBUTE_BAG = 1;

const attributesOf = (call: readonly unknown[] | undefined, at: number): Record<string, unknown> =>
  (call?.[at] ?? {}) as Record<string, unknown>;

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

    it("should set the rate itself in bold, so the figure carries the tile", () => {
      drawn();

      expect(textSpy).toHaveBeenCalledWith(
        `pct(${String(A_SHARE)})`,
        expect.objectContaining({ "font-weight": "bold" })
      );
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

  describe("where each tile is laid", () => {
    const A_COLUMN = (A_GRID_RIGHT - A_PAD) / TILES_ACROSS;

    const SECOND_COLUMN = A_PAD + A_COLUMN;

    const SECOND_ROW = A_TILES_TOP + A_ROW_HEIGHT;

    const positionOf = (label: string): Record<string, unknown> =>
      attributesOf(
        textSpy.mock.calls.find((call) => call[NOTHING] === label),
        AN_ATTRIBUTE_BAG
      );

    it("should fill the row across before starting the next one", () => {
      drawn();

      expect(
        [copy.tileShare, copy.tileFool, copy.tileFirst, copy.tileFirstMove].map((label) => {
          const at = positionOf(label);

          return [at.x, at.y];
        })
      ).toEqual([
        [A_PAD, A_TILES_TOP],
        [SECOND_COLUMN, A_TILES_TOP],
        [A_PAD, SECOND_ROW],
        [SECOND_COLUMN, SECOND_ROW],
      ]);
    });

    it("should drop the figure, the bar and the count below the label by their own measures", () => {
      drawn();

      expect([
        positionOf(`pct(${String(A_SHARE)})`).y,
        attributesOf(rectSpy.mock.calls[NOTHING], NOTHING).y,
        positionOf(A_TALLY).y,
      ]).toEqual([A_TILES_TOP + A_VALUE_DROP, A_TILES_TOP + A_BAR_DROP, A_TILES_TOP + A_NOTE_DROP]);
    });

    it("should carry every measure down to the second row, not only the label", () => {
      drawn();

      expect(positionOf(copy.tileOutOf(FIRSTS, GAMES)).y).toBe(SECOND_ROW + A_NOTE_DROP);
    });

    it("should stand the expectation's tick across the bar it belongs to", () => {
      drawn();

      const tick = attributesOf(lineSpy.mock.calls[NOTHING], NOTHING);

      expect([tick.x1, tick.x2, tick.y1, tick.y2]).toEqual([
        A_PAD + A_BAR_WIDTH * A_SHARE_CHANCE,
        A_PAD + A_BAR_WIDTH * A_SHARE_CHANCE,
        A_TILES_TOP + A_BAR_DROP - A_TICK_RISE,
        A_TILES_TOP + A_BAR_DROP + A_TICK_DROP,
      ]);
    });

    it("should set the expectation's figure past the end of the bar, not over it", () => {
      drawn();

      const beside = positionOf(`pct(${String(A_SHARE_CHANCE)})`);

      expect([beside.x, beside.y]).toEqual([
        A_PAD + A_BAR_WIDTH + A_MARK_GAP,
        A_TILES_TOP + A_BAR_DROP + A_MARK_LIFT,
      ]);
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
        expect.objectContaining({ fill: "hint-ink", "font-weight": "bold" })
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

    it("should put the painted gap into the drawing, not only ask for it", () => {
      const A_TENTH = 0.1;

      gapOfSpy.mockReturnValue({ standing: Standing.Better, from: A_TENTH, to: A_SHARE });
      rectSpy.mockImplementation(
        (attributes: Record<string, unknown>) => `<rect fill="${String(attributes.fill)}"/>`
      );

      expect(drawn()).toContain(`<rect fill="${A_PLAYER_INK}"/>`);
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
      expect(rectSpy).toHaveBeenCalledTimes(EVERY_TILE * A_TRACK_AND_ITS_FILL);
    });

    it("should leave nothing behind it either, so the tile is only what it drew", () => {
      expect(drawn()).toHaveLength(EVERY_TILE * ELEMENTS_IN_A_LEVEL_TILE + THE_NOTE);
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
