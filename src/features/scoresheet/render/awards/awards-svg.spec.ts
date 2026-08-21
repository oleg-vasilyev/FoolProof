import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { Honours } from "#scoresheet/domain/awards/award-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { AwardsSheet, Placed } from "#scoresheet/render/awards/awards-layout.ts";


const awardsLayoutOfSpy = vi.fn();

const posterBaseboardSpy = vi.fn();

const cardHeadingSpy = vi.fn();

const awardRowSpy = vi.fn();

const foolPlateSpy = vi.fn();

const gameTallySpy = vi.fn();

const rectSpy = vi.fn();

const lineSpy = vi.fn();

const textSpy = vi.fn();

const svgOfSpy = vi.fn();

const A_HANDLE = "@a_handle";

const FONT_FAMILY = "Test Sans";

const GRID_RIGHT = 1560;

const IMAGE_WIDTH = 1620;

const PAD = 60;

const ROWS_TOP = 360;

const CURSE_BASELINE_DROP = 34;

const CURSE_FACT_FONT = 30;

const CURSE_LABEL_FONT = 24;

const CURSE_TRACKING = 4;

vi.mock("#scoresheet/render/awards/awards-layout.ts", () => ({
  ROWS_TOP,
  CURSE_BASELINE_DROP,
  CURSE_FACT_FONT,
  CURSE_LABEL_FONT,
  CURSE_TRACKING,
  awardsLayoutOf: (chronology: unknown, honours: unknown) => awardsLayoutOfSpy(chronology, honours),
}));

vi.mock("#scoresheet/render/card-heading.ts", () => ({
  cardHeading: (table: unknown, heading: unknown) => cardHeadingSpy(table, heading),
}));

vi.mock("#scoresheet/render/awards/award-row.ts", () => ({
  awardRow: (table: unknown, placed: unknown, density: unknown) => awardRowSpy(table, placed, density),
}));

vi.mock("#scoresheet/render/poster-baseboard.ts", () => ({
  posterBaseboard: (handle: unknown, height: unknown) => posterBaseboardSpy(handle, height),
}));

vi.mock("#scoresheet/render/awards/fool-plate.ts", () => ({
  foolPlate: (table: unknown, placed: unknown, density: unknown) => foolPlateSpy(table, placed, density),
}));

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY,
  GRID_RIGHT,
  IMAGE_WIDTH,
  PAD,
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: { sheet: "sheet", cellFool: "fool-red", inkMuted: "muted" },
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
  svgOf: (width: number, height: number, body: readonly string[]) => svgOfSpy(width, height, body),
}));

const { renderAwards } = await import("#scoresheet/render/awards/awards-svg.ts");

const ONCE = 1;

const NEVER = 0;

const CURSE_TOP = 2100;

const SHEET_HEIGHT = 2200;

const STARTED_ON = "2026-07-24";

const GAMES = 7;

const PLAYERS = 5;

const CHRONOLOGY = { startedOn: STARTED_ON, players: [], games: [] } as unknown as SeriesChronology;

const HONOURS = { awards: [], curse: null } as unknown as Honours;

const placedOf = (rank: number): Placed =>
  ({
    award: { name: AwardName.Untouchable, winners: [rank], games: 1 },
    names: [`P${rank}`],
    colour: "colour",
    rank,
    top: 0,
    height: 0,
  }) as unknown as Placed;

const sheetOf = (overrides: Partial<AwardsSheet> = {}): AwardsSheet =>
  ({
    startedOn: STARTED_ON,
    games: GAMES,
    players: PLAYERS,
    rows: [placedOf(0), placedOf(1)],
    fool: placedOf(2),
    curse: null,
    density: {},
    height: SHEET_HEIGHT,
    ...overrides,
  }) as unknown as AwardsSheet;

const body = (): readonly string[] => (svgOfSpy.mock.calls[0]?.[2] ?? []) as readonly string[];

describe("renderAwards()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    awardsLayoutOfSpy.mockReturnValue(sheetOf());
    cardHeadingSpy.mockReturnValue(["<heading/>"]);
    awardRowSpy.mockImplementation((_table: unknown, placed: Placed) => [`row-${String(placed.rank)}`]);
    foolPlateSpy.mockReturnValue(["<fool-plate/>"]);
    posterBaseboardSpy.mockReturnValue(["<baseboard/>"]);
    gameTallySpy.mockImplementation((_table: unknown, games: number) => `tally(${String(games)})`);
    rectSpy.mockImplementation(() => "<background/>");
    lineSpy.mockImplementation(() => "<line/>");
    textSpy.mockImplementation(() => "<text/>");
    svgOfSpy.mockImplementation(() => "<svg/>");
  });

  it("should lay the sheet out exactly once, from the chronology and honours it was given", () => {
    renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

    expect(awardsLayoutOfSpy).toHaveBeenCalledTimes(ONCE);
    expect(awardsLayoutOfSpy).toHaveBeenCalledWith(CHRONOLOGY, HONOURS);
  });

  it("should paint a background sized to the sheet, not the chronology", () => {
    renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

    expect(rectSpy).toHaveBeenCalledWith(
      expect.objectContaining({ width: IMAGE_WIDTH, height: SHEET_HEIGHT, fill: "sheet" })
    );
  });

  it("should draw the heading with the awards title, not the chronology sheet's title", () => {
    renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

    expect(cardHeadingSpy).toHaveBeenCalledWith(copy, 
      expect.objectContaining({ title: copy.awardsTitle, startedOn: STARTED_ON, games: GAMES, players: PLAYERS })
    );
  });

  it("should draw one row per sheet.rows, in the order they came", () => {
    renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

    expect(awardRowSpy).toHaveBeenCalledTimes(2);
    expect(body().indexOf("row-0")).toBeLessThan(body().indexOf("row-1"));
  });

  it("should draw the fool plate after every row", () => {
    renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

    expect(body().indexOf("row-1")).toBeLessThan(body().indexOf("<fool-plate/>"));
  });

  it("should draw no plate at all when the sheet has no fool", () => {
    awardsLayoutOfSpy.mockReturnValue(sheetOf({ fool: null }));

    renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

    expect(foolPlateSpy).toHaveBeenCalledTimes(NEVER);
    expect(body()).not.toContain("<fool-plate/>");
  });

  it("should print no curse note when the sheet has no curse", () => {
    awardsLayoutOfSpy.mockReturnValue(sheetOf({ curse: null }));

    renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

    expect(textSpy).not.toHaveBeenCalledWith(copy.awardsCurseLabel, expect.anything());
  });

  it("should print the curse note when the sheet has a curse", () => {
    const CURSE = { burns: 2, games: 8, predicted: 1 };
    awardsLayoutOfSpy.mockReturnValue(sheetOf({ curse: { fact: CURSE, top: CURSE_TOP } }));

    renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

    expect(textSpy).toHaveBeenCalledWith(copy.awardsCurseLabel, expect.anything());
    expect(textSpy).toHaveBeenCalledWith(
      copy.curseFact(CURSE.burns, `tally(${String(CURSE.games)})`, CURSE.predicted),
      expect.anything()
    );
  });

  describe("where the furniture sits", () => {
    const attributesOf = (value: string): Record<string, unknown> =>
      (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

    const withCurse = (): void => {
      awardsLayoutOfSpy.mockReturnValue(
        sheetOf({ curse: { fact: { burns: 2, games: 8, predicted: 1 }, top: CURSE_TOP } })
      );
      renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);
    };

    it("should rule off the heading across the card's own width", () => {
      renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

      expect(lineSpy).toHaveBeenCalledWith(
        expect.objectContaining({ x1: PAD, x2: GRID_RIGHT, y1: ROWS_TOP, y2: ROWS_TOP })
      );
    });

    it("should rule off the curse note where the layout placed it", () => {
      withCurse();

      expect(lineSpy).toHaveBeenCalledWith(
        expect.objectContaining({ x1: PAD, x2: GRID_RIGHT, y1: CURSE_TOP, y2: CURSE_TOP })
      );
    });

    it("should set the curse label against the left margin, below its own rule", () => {
      withCurse();

      expect(attributesOf(copy.awardsCurseLabel).x).toBe(PAD);
      expect(attributesOf(copy.awardsCurseLabel).y).toBe(CURSE_TOP + CURSE_BASELINE_DROP);
    });

    it("should hang the curse fact off the right edge on the label's own baseline", () => {
      withCurse();
      const fact = copy.curseFact(2, "tally(8)", 1);

      expect(attributesOf(fact).x).toBe(GRID_RIGHT);
      expect(attributesOf(fact)["text-anchor"]).toBe("end");
      expect(attributesOf(fact).y).toBe(CURSE_TOP + CURSE_BASELINE_DROP);
    });

    it("should set the label bold and smaller than the fact it introduces", () => {
      withCurse();

      expect(attributesOf(copy.awardsCurseLabel)["font-weight"]).toBe("bold");
      expect(attributesOf(copy.awardsCurseLabel)["font-size"]).toBe(CURSE_LABEL_FONT);
      expect(attributesOf(copy.curseFact(2, "tally(8)", 1))["font-size"]).toBe(CURSE_FACT_FONT);
    });

    it("should sign the sheet at its own foot, whatever the sheet turned out to hold", () => {
      awardsLayoutOfSpy.mockReturnValue(sheetOf({ fool: null, curse: null, rows: [] }));

      renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

      expect(posterBaseboardSpy).toHaveBeenCalledWith(A_HANDLE, SHEET_HEIGHT);
    });

    it("should add nothing but its baseboard for a card with neither a fool nor a curse", () => {
      awardsLayoutOfSpy.mockReturnValue(sheetOf({ fool: null, curse: null, rows: [] }));

      renderAwards(copy, CHRONOLOGY, HONOURS, A_HANDLE);

      expect(body()).toEqual(["<background/>", "<heading/>", "<line/>", "<baseboard/>"]);
    });
  });
});
