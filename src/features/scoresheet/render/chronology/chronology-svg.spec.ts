import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";


const A_BIGGEST_TABLE = 7;

const IMAGE_WIDTH = 900;

const SECTION_LABEL_FONT = 33;

const HINT_FONT = 29;

const SHEET_HEIGHT = 2000;

const CHART_TOP = 1400;

const GRID_BOTTOM = 1210;

const GRID_RIGHT = 860;

const GRID_LABEL_BASELINE = 428;

const PAD = 40;

const ROUNDS = 12;

const A_TALLY = "12 games";

const PLAYERS = 5;

const columnNamesSpy = vi.fn();

const chronologyGridSpy = vi.fn();

const cellKeySpy = vi.fn();

const shareChartSpy = vi.fn();

const shareLegendSpy = vi.fn();

const layoutOfSpy = vi.fn();

const cardHeadingSpy = vi.fn();

const rectSpy = vi.fn();

const lineSpy = vi.fn();

const textSpy = vi.fn();

const svgOfSpy = vi.fn();

const gameTallySpy = vi.fn();

vi.mock("#scoresheet/render/chronology/chronology-grid.ts", () => ({
  columnNames: (sheet: unknown) => columnNamesSpy(sheet),
  chronologyGrid: (sheet: unknown) => chronologyGridSpy(sheet),
}));

vi.mock("#scoresheet/render/chronology/cell-key.ts", () => ({
  cellKey: (table: unknown, sheet: unknown) => cellKeySpy(table, sheet),
}));

vi.mock("#scoresheet/render/chronology/chronology-layout.ts", () => ({
  GRID_LABEL_BASELINE,
  layoutOf: (chronology: unknown) => layoutOfSpy(chronology),
}));

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY: "Test Sans",
  GRID_RIGHT,
  IMAGE_WIDTH,
  PAD,
  fontSize: { sectionLabel: SECTION_LABEL_FONT, hint: HINT_FONT },
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: {
    sheet: "sheet",
    ink: "ink",
    inkHint: "hint",
    inkMuted: "muted",
    inkFaint: "faint",
    ruling: "ruling",
  },
}));

vi.mock("#scoresheet/render/card-heading.ts", () => ({
  EYEBROW_TRACKING: 3,
  cardHeading: (table: unknown, heading: unknown) => cardHeadingSpy(table, heading),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

vi.mock("#scoresheet/render/chronology/share-chart.ts", () => ({
  shareChart: (sheet: unknown) => shareChartSpy(sheet),
}));

vi.mock("#scoresheet/render/chronology/share-legend.ts", () => ({
  shareLegend: (table: unknown, sheet: unknown) => shareLegendSpy(table, sheet),
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
  svgOf: (width: number, height: number, body: readonly string[]) => svgOfSpy(width, height, body),
}));

const { renderScoresheet } = await import("#scoresheet/render/chronology/chronology-svg.ts");

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
    biggestTable: A_BIGGEST_TABLE,
    played: ROUNDS + omitted,
    rounds: ROUNDS,
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

const dividerFor = (label: string): Record<string, number> => {
  const baseline = Number(attributesOfText(label).y);

  return lineSpy.mock.calls
    .map((call) => call[0] as Record<string, number>)
    .filter((divider) => Number(divider.y1) < baseline)
    .reduce((closest, divider) => (Number(divider.y1) > Number(closest.y1) ? divider : closest));
};

describe("renderScoresheet()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    layoutOfSpy.mockReturnValue(sheetWith(NONE));
    columnNamesSpy.mockReturnValue(["<names/>"]);
    chronologyGridSpy.mockReturnValue(["<grid/>"]);
    cellKeySpy.mockReturnValue(["<key/>"]);
    shareChartSpy.mockReturnValue(["<chart/>"]);
    shareLegendSpy.mockReturnValue(["<legend/>"]);
    cardHeadingSpy.mockReturnValue(["<heading/>"]);
    rectSpy.mockImplementation(() => "<background/>");
    lineSpy.mockImplementation(() => "<divider/>");
    textSpy.mockImplementation(() => "<text/>");
    svgOfSpy.mockImplementation(() => "<svg/>");
    gameTallySpy.mockReturnValue(A_TALLY);
  });

  describe("what it delegates", () => {
    it("should lay the sheet out from the chronology it was given", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(layoutOfSpy).toHaveBeenCalledWith(CHRONOLOGY);
    });

    it("should hand the same sheet to every part that draws", () => {
      renderScoresheet(copy, CHRONOLOGY);
      const sheet = layoutOfSpy.mock.results[0]?.value;

      expect(columnNamesSpy).toHaveBeenCalledWith(sheet);
      expect(chronologyGridSpy).toHaveBeenCalledWith(sheet);
      expect(cellKeySpy).toHaveBeenCalledWith(copy, sheet);
      expect(shareChartSpy).toHaveBeenCalledWith(sheet);
      expect(shareLegendSpy).toHaveBeenCalledWith(copy, sheet);
    });

    it("should return whatever the document builder produced", () => {
      expect(renderScoresheet(copy, CHRONOLOGY)).toBe("<svg/>");
    });
  });

  describe("the document", () => {
    it("should be as wide as the design and as tall as the layout says", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(svgOfSpy).toHaveBeenCalledWith(IMAGE_WIDTH, SHEET_HEIGHT, expect.any(Array));
    });

    it("should paint a background over the whole sheet", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ width: IMAGE_WIDTH, height: SHEET_HEIGHT, fill: "sheet" })
      );
    });

    it("should put the background behind everything else", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body()[0]).toBe("<background/>");
    });

    it("should draw the grid before the chart", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body().indexOf("<grid/>")).toBeLessThan(body().indexOf("<chart/>"));
    });

    it("should draw the headings before the grid they label", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body().indexOf("<names/>")).toBeLessThan(body().indexOf("<grid/>"));
    });

    it("should include the cell colour key", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body()).toContain("<key/>");
    });

    it("should draw the colour key after the grid it explains", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body().indexOf("<grid/>")).toBeLessThan(body().indexOf("<key/>"));
    });
  });

  describe("the two sections", () => {
    const SECTIONS = 2;

    it("should open a section over the grid and another over the chart", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(lineSpy).toHaveBeenCalledTimes(SECTIONS);
      expect(printed()).toContain(copy.sheetGridLabel);
      expect(printed()).toContain(copy.sheetShareLabel);
    });

    it("should rule each section across the sheet from margin to margin", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(lineSpy).toHaveBeenCalledWith(
        expect.objectContaining({ x1: PAD, x2: GRID_RIGHT, stroke: "ruling" })
      );
    });

    it("should keep each divider flat", () => {
      renderScoresheet(copy, CHRONOLOGY);
      const divider = dividerFor(copy.sheetShareLabel);

      expect(divider.y1).toBe(divider.y2);
    });

    it("should open the grid's section above the grid it labels", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(dividerFor(copy.sheetGridLabel).y1).toBeLessThan(GRID_LABEL_BASELINE);
      expect(Number(attributesOfText(copy.sheetGridLabel).y)).toBe(GRID_LABEL_BASELINE);
    });

    it("should hang the chart's divider off the grid's own bottom edge, not a recomputed one", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(dividerFor(copy.sheetShareLabel).y1).toBeGreaterThan(GRID_BOTTOM);
    });

    it("should sit each divider above the label of the section it opens", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(dividerFor(copy.sheetShareLabel).y1).toBeLessThan(
        Number(attributesOfText(copy.sheetShareLabel).y)
      );
    });

    it("should print the grid's hint alongside its label", () => {
      renderScoresheet(copy, CHRONOLOGY);
      const hint = attributesOfText(copy.sheetGridHint);

      expect(hint.x).toBe(GRID_RIGHT);
      expect(hint["text-anchor"]).toBe("end");
      expect(hint.y).toBe(attributesOfText(copy.sheetGridLabel).y);
    });

    it("should set every hint in the ink kept for a hint", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(attributesOfText(copy.sheetGridHint).fill).toBe("hint");
      expect(attributesOfText(copy.sheetShareHint).fill).toBe("hint");
    });

    it("should set a label and its hint at their own two sizes from the type scale", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(attributesOfText(copy.sheetGridLabel)["font-size"]).toBe(SECTION_LABEL_FONT);
      expect(attributesOfText(copy.sheetGridHint)["font-size"]).toBe(HINT_FONT);
    });

    it("should open the grid's section before the headings it covers", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body().indexOf("<divider/>")).toBeLessThan(body().indexOf("<names/>"));
    });

    it("should draw the chart's section after the key and before the chart", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body().indexOf("<key/>")).toBeLessThan(body().lastIndexOf("<divider/>"));
      expect(body().lastIndexOf("<divider/>")).toBeLessThan(body().indexOf("<chart/>"));
    });

    it("should draw the legend after the chart it explains", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body().indexOf("<chart/>")).toBeLessThan(body().indexOf("<legend/>"));
    });
  });

  describe("the heading", () => {
    it("should ask cardHeading for this sheet's own title", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(cardHeadingSpy).toHaveBeenCalledWith(copy, expect.objectContaining({ title: copy.sheetTitle }));
    });

    it("should head the sheet with the whole evening, not with the rows the grid drew", () => {
      const DROPPED = 7;
      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));

      renderScoresheet(copy, CHRONOLOGY);

      expect(cardHeadingSpy).toHaveBeenCalledWith(copy,
        expect.objectContaining({ games: ROUNDS + DROPPED, players: PLAYERS })
      );
    });

    it("should still head an untrimmed sheet with the games it drew, since they are the same", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(cardHeadingSpy).toHaveBeenCalledWith(copy,
        expect.objectContaining({ games: ROUNDS, players: PLAYERS })
      );
    });

    it("should carry the session's date through to the heading", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(cardHeadingSpy).toHaveBeenCalledWith(copy, expect.objectContaining({ startedOn: STARTED_ON }));
    });

    it("should draw whatever the heading produced", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body()).toContain("<heading/>");
    });

    it("should draw the heading before the grid it sits above", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(body().indexOf("<heading/>")).toBeLessThan(body().indexOf("<grid/>"));
    });

    it("should label the chart below", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(printed()).toContain(copy.sheetShareLabel);
    });

    it("should put the chart's label above the chart", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(Number(attributesOfText(copy.sheetShareLabel).y)).toBeLessThan(CHART_TOP);
    });

    it("should print the score hint alongside the section label", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(printed()).toContain(copy.sheetShareHint);
    });

    it("should right-anchor the score hint against the grid's right edge", () => {
      renderScoresheet(copy, CHRONOLOGY);
      const hint = attributesOfText(copy.sheetShareHint);

      expect(hint.x).toBe(GRID_RIGHT);
      expect(hint["text-anchor"]).toBe("end");
    });

    it("should set the score hint on the same baseline as its section label", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(attributesOfText(copy.sheetShareHint).y).toBe(
        attributesOfText(copy.sheetShareLabel).y
      );
    });

    it("should set the chart's label against the left margin", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(attributesOfText(copy.sheetShareLabel).x).toBe(PAD);
    });
  });

  describe("a session too long to draw", () => {
    it("should say nothing when every game fits", () => {
      renderScoresheet(copy, CHRONOLOGY);

      expect(printed()).not.toContain(copy.sheetTableShows(A_TALLY));
    });

    it("should say how much of the evening the table below is showing", () => {
      const DROPPED = 7;
      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));

      renderScoresheet(copy, CHRONOLOGY);

      expect(printed()).toContain(copy.sheetTableShows(A_TALLY));
    });

    it("should count that note in drawn rows, not in the games the evening had", () => {
      const DROPPED = 7;
      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));

      renderScoresheet(copy, CHRONOLOGY);

      expect(gameTallySpy).toHaveBeenCalledWith(copy, ROUNDS);
    });

    it("should add exactly one element to the drawing when it owns up", () => {
      const DROPPED = 7;
      renderScoresheet(copy, CHRONOLOGY);
      const withoutNote = body().length;

      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));
      svgOfSpy.mockClear();
      renderScoresheet(copy, CHRONOLOGY);

      expect(body().length).toBe(withoutNote + 1);
    });

    it("should hang the note off the right edge, clear of the title", () => {
      const DROPPED = 7;
      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));

      renderScoresheet(copy, CHRONOLOGY);
      const note = attributesOfText(copy.sheetTableShows(A_TALLY));

      expect(note.x).toBe(GRID_RIGHT);
      expect(note["text-anchor"]).toBe("end");
    });
  });
});
