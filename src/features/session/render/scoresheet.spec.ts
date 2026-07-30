import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SeriesChronology } from "../../../shared/repository/types.ts";
import { strings } from "../strings.ts";


const IMAGE_WIDTH = 1620;

const SHEET_HEIGHT = 2000;

const CHART_TOP = 1400;

const GRID_RIGHT = 1560;

const PAD = 60;

const ROUNDS = 12;

const PLAYERS = 5;

const columnNamesSpy = vi.fn();

const chronologyGridSpy = vi.fn();

const scoreChartSpy = vi.fn();

const layoutOfSpy = vi.fn();

const rectSpy = vi.fn();

const textSpy = vi.fn();

const svgOfSpy = vi.fn();

vi.mock("./chronology.ts", () => ({
  columnNames: (sheet: unknown) => columnNamesSpy(sheet),
  chronologyGrid: (sheet: unknown) => chronologyGridSpy(sheet),
}));

vi.mock("./layout.ts", () => ({
  FONT_FAMILY: "Test Sans",
  GRID_RIGHT,
  IMAGE_WIDTH,
  PAD,
  fontSize: { eyebrow: 30, title: 126, date: 52, subtitle: 42, sectionLabel: 30 },
  layoutOf: (chronology: unknown) => layoutOfSpy(chronology),
}));

vi.mock("./palette.ts", () => ({
  palette: { sheet: "sheet", ink: "ink", inkMuted: "muted", inkFaint: "faint" },
}));

vi.mock("./scorechart.ts", () => ({
  scoreChart: (sheet: unknown) => scoreChartSpy(sheet),
}));

vi.mock("./svg.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
  svgOf: (width: number, height: number, body: readonly string[]) => svgOfSpy(width, height, body),
}));

const { renderScoresheet } = await import("./scoresheet.ts");

const NONE = 0;

const STARTED_ON = "2026-07-24";

const CHRONOLOGY = { startedOn: STARTED_ON, players: [], games: [] } as SeriesChronology;

const sheetWith = (omitted: number) => ({
  startedOn: STARTED_ON,
  players: Array.from({ length: PLAYERS }, (_unused, index) => ({
    playerId: index,
    displayName: `P${index}`,
    cells: [],
    running: [],
    total: NONE,
  })),
  rounds: ROUNDS,
  omitted,
  rowHeight: 50,
  columnWidth: 200,
  gridHeight: 600,
  chartTop: CHART_TOP,
  height: SHEET_HEIGHT,
});

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
    scoreChartSpy.mockReturnValue(["<chart/>"]);
    rectSpy.mockImplementation(() => "<background/>");
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
      expect(scoreChartSpy).toHaveBeenCalledWith(sheet);
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
  });

  describe("the heading", () => {
    it("should print the title and its eyebrow", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(strings.sheetTitle);
      expect(printed()).toContain(strings.sheetEyebrow);
    });

    it("should print the session's date, formatted", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(strings.sheetDate(STARTED_ON));
    });

    it("should print how big the session was", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(strings.sheetSubtitle(ROUNDS, PLAYERS));
    });

    it("should label the chart below", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(strings.sheetScoreLabel);
    });

    it("should put the chart's label above the chart", () => {
      renderScoresheet(CHRONOLOGY);

      expect(Number(attributesOfText(strings.sheetScoreLabel).y)).toBeLessThan(CHART_TOP);
    });

    it("should set the eyebrow and the title against the left margin", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(strings.sheetEyebrow).x).toBe(PAD);
      expect(attributesOfText(strings.sheetTitle).x).toBe(PAD);
    });

    it("should put the title below its eyebrow", () => {
      renderScoresheet(CHRONOLOGY);

      expect(Number(attributesOfText(strings.sheetTitle).y)).toBeGreaterThan(
        Number(attributesOfText(strings.sheetEyebrow).y)
      );
    });

    it("should set the title in bold and larger than its eyebrow", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(strings.sheetTitle)["font-weight"]).toBe("bold");
      expect(Number(attributesOfText(strings.sheetTitle)["font-size"])).toBeGreaterThan(
        Number(attributesOfText(strings.sheetEyebrow)["font-size"])
      );
    });

    it("should keep the whole heading above the grid it introduces", () => {
      renderScoresheet(CHRONOLOGY);
      const GRID_TOP = 486;

      for (const value of [strings.sheetEyebrow, strings.sheetTitle]) {
        expect(Number(attributesOfText(value).y), value).toBeLessThan(GRID_TOP);
      }
    });

    it("should right-align the subtitle under the date", () => {
      renderScoresheet(CHRONOLOGY);
      const subtitle = attributesOfText(strings.sheetSubtitle(ROUNDS, PLAYERS));

      expect(subtitle.x).toBe(GRID_RIGHT);
      expect(subtitle["text-anchor"]).toBe("end");
      expect(Number(subtitle.y)).toBeGreaterThan(
        Number(attributesOfText(strings.sheetDate(STARTED_ON)).y)
      );
    });

    it("should set the chart's label against the left margin", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(strings.sheetScoreLabel).x).toBe(PAD);
    });

    it("should hang the date off the right edge", () => {
      renderScoresheet(CHRONOLOGY);

      expect(attributesOfText(strings.sheetDate(STARTED_ON)).x).toBe(GRID_RIGHT);
      expect(attributesOfText(strings.sheetDate(STARTED_ON))["text-anchor"]).toBe("end");
    });
  });

  describe("a session too long to draw", () => {
    it("should say nothing when every game fits", () => {
      renderScoresheet(CHRONOLOGY);

      expect(printed()).not.toContain(strings.sheetOmitted(NONE));
    });

    it("should own up to the games it left out", () => {
      const DROPPED = 7;
      layoutOfSpy.mockReturnValue(sheetWith(DROPPED));

      renderScoresheet(CHRONOLOGY);

      expect(printed()).toContain(strings.sheetOmitted(DROPPED));
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
      const note = attributesOfText(strings.sheetOmitted(DROPPED));

      expect(note.x).toBe(GRID_RIGHT);
      expect(note["text-anchor"]).toBe("end");
    });
  });
});
