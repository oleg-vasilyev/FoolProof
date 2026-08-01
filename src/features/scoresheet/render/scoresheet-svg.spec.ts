import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { Sheet } from "#scoresheet/render/sheet-layout.ts";


const IMAGE_WIDTH = 1620;

const SHEET_HEIGHT = 2000;

const CHART_TOP = 1400;

const GRID_BOTTOM = 1210;

const GRID_RIGHT = 1560;

const PAD = 60;

const ROUNDS = 12;

const PLAYERS = 5;

const columnNamesSpy = vi.fn();

const chronologyGridSpy = vi.fn();

const cellKeySpy = vi.fn();

const shareChartSpy = vi.fn();

const shareLegendSpy = vi.fn();

const layoutOfSpy = vi.fn();

const gameTallySpy = vi.fn();

const playerTallySpy = vi.fn();

const rectSpy = vi.fn();

const lineSpy = vi.fn();

const textSpy = vi.fn();

const svgOfSpy = vi.fn();

vi.mock("#scoresheet/render/chronology-grid.ts", () => ({
  columnNames: (sheet: unknown) => columnNamesSpy(sheet),
  chronologyGrid: (sheet: unknown) => chronologyGridSpy(sheet),
}));

vi.mock("#scoresheet/render/cell-key.ts", () => ({
  cellKey: (sheet: unknown) => cellKeySpy(sheet),
}));

vi.mock("#scoresheet/render/sheet-layout.ts", () => ({
  FONT_FAMILY: "Test Sans",
  GRID_RIGHT,
  IMAGE_WIDTH,
  PAD,
  fontSize: { eyebrow: 30, title: 126, date: 52, subtitle: 42, sectionLabel: 30, hint: 24 },
  layoutOf: (chronology: unknown) => layoutOfSpy(chronology),
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: { sheet: "sheet", ink: "ink", inkMuted: "muted", inkFaint: "faint", ruling: "ruling" },
}));

vi.mock("#scoresheet/render/share-chart.ts", () => ({
  shareChart: (sheet: unknown) => shareChartSpy(sheet),
}));

vi.mock("#scoresheet/render/share-legend.ts", () => ({
  shareLegend: (sheet: unknown) => shareLegendSpy(sheet),
}));

vi.mock("#scoresheet/render/session-tally.ts", () => ({
  gameTally: (games: number) => gameTallySpy(games),
  playerTally: (players: number) => playerTallySpy(players),
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
  svgOf: (width: number, height: number, body: readonly string[]) => svgOfSpy(width, height, body),
}));

const { renderScoresheet } = await import("#scoresheet/render/scoresheet-svg.ts");

const NONE = 0;

const STARTED_ON = "2026-07-24";

const CHRONOLOGY = { startedOn: STARTED_ON, players: [], games: [] } as SeriesChronology;

const playerOf = (index: number): ScoredPlayer => ({
  playerId: index,
  displayName: `P${index}`,
  cells: [],
  running: [],
  share: NONE,
  games: NONE,
});

const sheetWith = (omitted: number): Sheet =>
  ({
    startedOn: STARTED_ON,
    players: Array.from({ length: PLAYERS }, (_unused, index) => playerOf(index)),
    rounds: ROUNDS,
    omitted,
    rowHeight: 50,
    columnWidth: 200,
    gridHeight: 600,
    gridBottom: GRID_BOTTOM,
    chartTop: CHART_TOP,
    height: SHEET_HEIGHT,
  }) satisfies Sheet;

const printed = (): readonly string[] => textSpy.mock.calls.map((call) => String(call[0]));

const body = (): readonly string[] => (svgOfSpy.mock.calls[0]?.[2] ?? []) as readonly string[];

const attributesOfText = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("renderScoresheet()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    layoutOfSpy.mockReturnValue(sheetWith(NONE));
    columnNamesSpy.mockReturnValue(["<names/>"]);
    chronologyGridSpy.mockReturnValue(["<grid/>"]);
    cellKeySpy.mockReturnValue(["<key/>"]);
    shareChartSpy.mockReturnValue(["<chart/>"]);
    shareLegendSpy.mockReturnValue(["<legend/>"]);
    gameTallySpy.mockImplementation((games: number) => `tally(${String(games)})`);
    playerTallySpy.mockImplementation((players: number) => `roster(${String(players)})`);
    rectSpy.mockImplementation(() => "<background/>");
    lineSpy.mockImplementation(() => "<divider/>");
    textSpy.mockImplementation(() => "<text/>");
    svgOfSpy.mockImplementation(() => "<svg/>");
  });

  describe("what it delegates", () => {
    it("should lay the sheet out from the chronology it was given", () => {
      renderScoresheet(CHRONOLOGY);

      expect(layoutOfSpy).toHaveBeenCalledWith(CHRONOLOGY);
    });

    it("should hand the same sheet to every part that draws", () => {
      renderScoresheet(CHRONOLOGY);
      const sheet = layoutOfSpy.mock.results[0]?.value;

      expect(columnNamesSpy).toHaveBeenCalledWith(sheet);
      expect(chronologyGridSpy).toHaveBeenCalledWith(sheet);
      expect(cellKeySpy).toHaveBeenCalledWith(sheet);
      expect(shareChartSpy).toHaveBeenCalledWith(sheet);
      expect(shareLegendSpy).toHaveBeenCalledWith(sheet);
    });

    it("should ask the tally renderers for the session's own size, not the layout's", () => {
      renderScoresheet(CHRONOLOGY);

      expect(gameTallySpy).toHaveBeenCalledWith(ROUNDS);
      expect(playerTallySpy).toHaveBeenCalledWith(PLAYERS);
    });

    it("should return whatever the document builder produced", () => {
      expect(renderScoresheet(CHRONOLOGY)).toBe("<svg/>");
    });
  });

  describe("the document", () => {
    it("should be as wide as the design and as tall as the layout says", () => {
      renderScoresheet(CHRONOLOGY);

      expect(svgOfSpy).toHaveBeenCalledWith(IMAGE_WIDTH, SHEET_HEIGHT, expect.any(Array));
    });

    it("should paint a background over the whole sheet", () => {
      renderScoresheet(CHRONOLOGY);

      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ width: IMAGE_WIDTH, height: SHEET_HEIGHT, fill: "sheet" })
      );
    });

    it("should put the background behind everything else", () => {
      renderScoresheet(CHRONOLOGY);

      expect(body()[0]).toBe("<background/>");
    });

    it("should draw the grid before the chart", () => {
      renderScoresheet(CHRONOLOGY);

      expect(body().indexOf("<grid/>")).toBeLessThan(body().indexOf("<chart/>"));
    });

    it("should draw the headings before the grid they label", () => {
      renderScoresheet(CHRONOLOGY);

      expect(body().indexOf("<names/>")).toBeLessThan(body().indexOf("<grid/>"));
    });

    it("should include the cell colour key", () => {
      renderScoresheet(CHRONOLOGY);

      expect(body()).toContain("<key/>");
    });

    it("should draw the colour key after the grid it explains", () => {
      renderScoresheet(CHRONOLOGY);

      expect(body().indexOf("<grid/>")).toBeLessThan(body().indexOf("<key/>"));
    });
  });

  describe("the divider between the two sections", () => {
    const dividerDrawn = (): Record<string, number> =>
      (lineSpy.mock.calls[0]?.[0] ?? {}) as Record<string, number>;

    it("should rule across the sheet from margin to margin", () => {
      renderScoresheet(CHRONOLOGY);

      expect(lineSpy).toHaveBeenCalledWith(
        expect.objectContaining({ x1: PAD, x2: GRID_RIGHT, stroke: "ruling" })
      );
    });

    it("should be flat", () => {
      renderScoresheet(CHRONOLOGY);

      expect(dividerDrawn().y1).toBe(dividerDrawn().y2);
    });

    it("should hang off the grid's own bottom edge, not a recomputed one", () => {
      renderScoresheet(CHRONOLOGY);

      expect(dividerDrawn().y1).toBeGreaterThan(GRID_BOTTOM);
    });

    it("should sit above the label of the section it opens", () => {
      renderScoresheet(CHRONOLOGY);

      expect(dividerDrawn().y1).toBeLessThan(
        Number(attributesOfText(copy.sheetShareLabel).y)
      );
    });

    it("should be drawn after the key and before the chart", () => {
      renderScoresheet(CHRONOLOGY);

      expect(body().indexOf("<key/>")).toBeLessThan(body().indexOf("<divider/>"));
      expect(body().indexOf("<divider/>")).toBeLessThan(body().indexOf("<chart/>"));
    });

    it("should draw the legend after the chart it explains", () => {
      renderScoresheet(CHRONOLOGY);

      expect(body().indexOf("<chart/>")).toBeLessThan(body().indexOf("<legend/>"));
    });
  });

  describe("the heading", () => {
    it("should print the title and its eyebrow", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(copy.sheetTitle);
      expect(printed()).toContain(copy.sheetEyebrow);
    });

    it("should print the session's date, formatted", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(copy.sheetDate(STARTED_ON));
    });

    it("should print how big the session was, from the two finished tallies", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(copy.sheetSubtitle(`tally(${String(ROUNDS)})`, `roster(${String(PLAYERS)})`));
    });

    it("should label the chart below", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(copy.sheetShareLabel);
    });

    it("should put the chart's label above the chart", () => {
      renderScoresheet(CHRONOLOGY);

      expect(Number(attributesOfText(copy.sheetShareLabel).y)).toBeLessThan(CHART_TOP);
    });

    it("should print the score hint alongside the section label", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(copy.sheetShareHint);
    });

    it("should right-anchor the score hint against the grid's right edge", () => {
      renderScoresheet(CHRONOLOGY);
      const hint = attributesOfText(copy.sheetShareHint);

      expect(hint.x).toBe(GRID_RIGHT);
      expect(hint["text-anchor"]).toBe("end");
    });

    it("should set the score hint on the same baseline as its section label", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(copy.sheetShareHint).y).toBe(
        attributesOfText(copy.sheetShareLabel).y
      );
    });

    it("should set the eyebrow and the title against the left margin", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(copy.sheetEyebrow).x).toBe(PAD);
      expect(attributesOfText(copy.sheetTitle).x).toBe(PAD);
    });

    it("should put the title below its eyebrow", () => {
      renderScoresheet(CHRONOLOGY);

      expect(Number(attributesOfText(copy.sheetTitle).y)).toBeGreaterThan(
        Number(attributesOfText(copy.sheetEyebrow).y)
      );
    });

    it("should set the title in bold and larger than its eyebrow", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(copy.sheetTitle)["font-weight"]).toBe("bold");
      expect(Number(attributesOfText(copy.sheetTitle)["font-size"])).toBeGreaterThan(
        Number(attributesOfText(copy.sheetEyebrow)["font-size"])
      );
    });

    it("should right-align the subtitle under the date", () => {
      renderScoresheet(CHRONOLOGY);
      const subtitle = attributesOfText(copy.sheetSubtitle(`tally(${String(ROUNDS)})`, `roster(${String(PLAYERS)})`));

      expect(subtitle.x).toBe(GRID_RIGHT);
      expect(subtitle["text-anchor"]).toBe("end");
      expect(Number(subtitle.y)).toBeGreaterThan(
        Number(attributesOfText(copy.sheetDate(STARTED_ON)).y)
      );
    });

    it("should set the chart's label against the left margin", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(copy.sheetShareLabel).x).toBe(PAD);
    });

    it("should hang the date off the right edge", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(copy.sheetDate(STARTED_ON)).x).toBe(GRID_RIGHT);
      expect(attributesOfText(copy.sheetDate(STARTED_ON))["text-anchor"]).toBe("end");
    });
  });

  describe("a session too long to draw", () => {
    it("should say nothing when every game fits", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).not.toContain(copy.sheetOmitted(NONE));
    });

    it("should own up to the games it left out", () => {
      const DROPPED = 7;
      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));

      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(copy.sheetOmitted(DROPPED));
    });

    it("should add exactly one element to the drawing when it owns up", () => {
      const DROPPED = 7;
      renderScoresheet(CHRONOLOGY);
      const withoutNote = body().length;

      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));
      svgOfSpy.mockClear();
      renderScoresheet(CHRONOLOGY);

      expect(body().length).toBe(withoutNote + 1);
    });

    it("should hang the note off the right edge, clear of the title", () => {
      const DROPPED = 7;
      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));

      renderScoresheet(CHRONOLOGY);
      const note = attributesOfText(copy.sheetOmitted(DROPPED));

      expect(note.x).toBe(GRID_RIGHT);
      expect(note["text-anchor"]).toBe("end");
    });
  });
});
