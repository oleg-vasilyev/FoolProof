import { beforeEach, describe, expect, it, vi } from "vitest";
import { GRID_RIGHT, IMAGE_WIDTH, USUAL_ADVANCE, PAD, WIDEST_ADVANCE, fontSize } from "#scoresheet/render/card-metrics.ts";
import { PLAYER_COLOURS, palette } from "#scoresheet/render/palette.ts";
import {
  HEADING_RULE,
  SECTION_LABEL_DROP,
  TEASER_FLOOR_DROP,
  TEASER_TEXT_DROP,
  TILE_TRACKING,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { PersonalLayout } from "#scoresheet/render/personal/personal-layout.ts";


const personalLayoutOfSpy = vi.fn();

const posterBaseboardSpy = vi.fn();

const careerTilesSpy = vi.fn();

const eveningChartSpy = vi.fn();

const chartTeaserSpy = vi.fn();

const factRowsSpy = vi.fn();

const topFactPlateSpy = vi.fn();

const eveningTallySpy = vi.fn();

const gameTallySpy = vi.fn();

const sessionDateSpy = vi.fn();

const lineSpy = vi.fn();

const rectSpy = vi.fn();

const svgOfSpy = vi.fn();

const textSpy = vi.fn();

const nameToFitSpy = vi.fn();

const widthOfSpy = vi.fn();

const A_HANDLE = "@a_handle";

const EYEBROW_TRACKING = 9;

vi.mock("#scoresheet/render/personal/personal-layout.ts", () => ({
  personalLayoutOf: (card: unknown) => personalLayoutOfSpy(card),
}));

vi.mock("#scoresheet/render/personal/career-tiles.ts", () => ({
  careerTiles: (table: unknown, card: unknown) => careerTilesSpy(table, card),
}));

vi.mock("#scoresheet/render/personal/evening-chart.ts", () => ({
  eveningChart: (table: unknown, chart: unknown) => eveningChartSpy(table, chart),
}));

vi.mock("#scoresheet/render/personal/chart-teaser.ts", () => ({
  chartTeaser: (table: unknown, nights: unknown) => chartTeaserSpy(table, nights),
}));

vi.mock("#scoresheet/render/personal/fact-rows.ts", () => ({
  factRows: (table: unknown, facts: unknown, ink: unknown) => factRowsSpy(table, facts, ink),
}));

vi.mock("#scoresheet/render/personal/top-fact-plate.ts", () => ({
  topFactPlate: (table: unknown, placed: unknown, ink: unknown) =>
    topFactPlateSpy(table, placed, ink),
}));

vi.mock("#scoresheet/render/card-heading.ts", () => ({ EYEBROW_TRACKING }));

vi.mock("#scoresheet/render/name-to-fit.ts", () => ({
  nameToFit: (name: string, width: number, size: number, advance: number) =>
    nameToFitSpy(name, width, size, advance),
  widthOf: (name: string, size: number, advance: number) => widthOfSpy(name, size, advance),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  eveningTally: (table: unknown, evenings: number) => eveningTallySpy(table, evenings),
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

vi.mock("#scoresheet/render/session-date.ts", () => ({
  sessionDate: (table: unknown, isoDate: string) => sessionDateSpy(table, isoDate),
}));

vi.mock("#scoresheet/render/poster-baseboard.ts", () => ({
  posterBaseboard: (handle: unknown, height: unknown) => posterBaseboardSpy(handle, height),
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  svgOf: (width: number, height: number, body: readonly string[]) => svgOfSpy(width, height, body),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { renderPersonalCard } = await import("#scoresheet/render/personal/personal-svg.ts");

const NEVER = 0;

const ONCE = 1;

const TWICE = 2;

const HALVES = 2;

const A_DASH_PATTERN = /^\d+ \d+$/;

const FIVE_RULES = 5;

const CHART_FLOOR = 2;

const ORIGIN = 0;

const FIRST_CALL = 0;

const ROOM_ASKED_FOR = 1;

const COLUMN = 2;

const SHEET_HEIGHT = 2400;

const CHART_LABEL = 1070;

const PLOT_TOP = 1194;

const FACTS_LABEL = 1708;

const PLATE_TOP = 2100;

const FACT_TOP = 1746;

const GAMES = 42;

const EVENINGS = 11;

const SINCE = "2026-01-05";

const SUBJECT = "Oleg";

const FITTED_NAME = "the-fitted-name";

const SUBTITLE_WIDTH = 500;

const NIGHTS = [{ seriesNo: 1, playedOn: SINCE, games: 3, decided: 3, fools: 0, firsts: 1, share: 0.5 }];

const BEST = NIGHTS[0];

const WORST = null;

const ROW_FACT = { name: CareerFactName.TheBlinder } as unknown as CareerFact;

const PLATE_FACT = { name: CareerFactName.TheBogey } as unknown as CareerFact;

const FACTS = [{ fact: ROW_FACT, top: FACT_TOP }] as unknown as PersonalLayout["facts"];

const PLATE = { fact: PLATE_FACT, top: PLATE_TOP } as unknown as PersonalLayout["plate"];

const INK = PLAYER_COLOURS[COLUMN];

const BASEBOARD_MARK = "<baseboard/>";

const BACKGROUND_MARK = "<background/>";

const RULE_MARK = "<line/>";

const TILES_MARK = "<tiles/>";

const CHART_MARK = "<chart/>";

const FACTS_MARK = "<facts/>";

const PLATE_MARK = "<plate/>";

const DATE_MARK = "the-date";

const GAME_TALLY_MARK = "the-games";

const EVENING_TALLY_MARK = "the-evenings";

const TEASER_HINT_MARK = "the-teaser-hint";

const CARD = {
  displayName: SUBJECT,
  since: SINCE,
  tally: { games: GAMES, evenings: EVENINGS },
  nights: NIGHTS,
  best: BEST,
  worst: WORST,
} as unknown as CareerCard;

const sheetOf = (overrides: Partial<PersonalLayout> = {}): PersonalLayout =>
  ({
    height: SHEET_HEIGHT,
    chartLabel: CHART_LABEL,
    plotTop: PLOT_TOP,
    factsLabel: FACTS_LABEL,
    facts: FACTS,
    plate: PLATE,
    ...overrides,
  }) as unknown as PersonalLayout;

const BARE_SHEET: Partial<PersonalLayout> = {
  plotTop: null,
  facts: [],
  plate: null,
};

const body = (): readonly string[] => (svgOfSpy.mock.calls[0]?.[2] ?? []) as readonly string[];

const marked = (value: string): string => `<text:${value}>`;

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

const ruledAt = (y: number): readonly Record<string, unknown>[] =>
  lineSpy.mock.calls
    .map((call) => call[0] as Record<string, unknown>)
    .filter((attributes) => attributes.y1 === y);

const SUBTITLE = copy.personalSubtitle(GAME_TALLY_MARK, EVENING_TALLY_MARK);

const SINCE_LINE = copy.personalSince(DATE_MARK);

describe("renderPersonalCard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    personalLayoutOfSpy.mockReturnValue(sheetOf());
    careerTilesSpy.mockReturnValue([TILES_MARK]);
    eveningChartSpy.mockReturnValue([CHART_MARK]);
    chartTeaserSpy.mockReturnValue(TEASER_HINT_MARK);
    posterBaseboardSpy.mockReturnValue([BASEBOARD_MARK]);
    factRowsSpy.mockReturnValue([FACTS_MARK]);
    topFactPlateSpy.mockReturnValue([PLATE_MARK]);
    eveningTallySpy.mockReturnValue(EVENING_TALLY_MARK);
    gameTallySpy.mockReturnValue(GAME_TALLY_MARK);
    sessionDateSpy.mockReturnValue(DATE_MARK);
    nameToFitSpy.mockReturnValue(FITTED_NAME);
    widthOfSpy.mockReturnValue(SUBTITLE_WIDTH);
    lineSpy.mockImplementation(() => RULE_MARK);
    rectSpy.mockImplementation(() => BACKGROUND_MARK);
    svgOfSpy.mockImplementation(() => "<svg/>");
    textSpy.mockImplementation((value: string) => marked(value));
  });

  describe("the sheet it draws on", () => {
    it("should lay the card out exactly once, from the card it was given", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(personalLayoutOfSpy).toHaveBeenCalledTimes(ONCE);
      expect(personalLayoutOfSpy).toHaveBeenCalledWith(CARD);
    });

    it("should size the drawing to the layout's own height", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(svgOfSpy).toHaveBeenCalledWith(IMAGE_WIDTH, SHEET_HEIGHT, expect.anything());
    });

    it("should follow the layout when it says the sheet is shorter", () => {
      const SHORT_SHEET = 1056;
      personalLayoutOfSpy.mockReturnValue(sheetOf({ ...BARE_SHEET, height: SHORT_SHEET }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(svgOfSpy).toHaveBeenCalledWith(IMAGE_WIDTH, SHORT_SHEET, expect.anything());
    });

    it("should paint a background over the whole sheet", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(rectSpy).toHaveBeenCalledWith({
        x: ORIGIN,
        y: ORIGIN,
        width: IMAGE_WIDTH,
        height: SHEET_HEIGHT,
        fill: palette.sheet,
      });
    });

    it("should paint the background before anything else", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(body()[0]).toBe(BACKGROUND_MARK);
    });

    it("should hand back whatever svgOf built", () => {
      expect(renderPersonalCard(copy, CARD, COLUMN, A_HANDLE)).toBe("<svg/>");
    });
  });

  describe("the heading", () => {
    it("should print the card's own eyebrow, tracked as a heading eyebrow is", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(attributesOf(copy.personalEyebrow)["letter-spacing"]).toBe(EYEBROW_TRACKING);
      expect(attributesOf(copy.personalEyebrow).fill).toBe(palette.inkMuted);
      expect(attributesOf(copy.personalEyebrow)["font-size"]).toBe(fontSize.eyebrow);
    });

    it("should title the card with the player's own name", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(attributesOf(FITTED_NAME).x).toBe(PAD);
      expect(attributesOf(FITTED_NAME)["font-weight"]).toBe("bold");
      expect(attributesOf(FITTED_NAME)["font-size"]).toBe(fontSize.title);
    });

    it("should print the name it was handed back, never the name it was given", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(nameToFitSpy).toHaveBeenCalledWith(
        SUBJECT,
        expect.any(Number),
        fontSize.title,
        WIDEST_ADVANCE
      );
      expect(textSpy).not.toHaveBeenCalledWith(SUBJECT, expect.anything());
    });

    it("should measure the subtitle at the size and weight it is actually set in", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(widthOfSpy).toHaveBeenCalledWith(SUBTITLE, fontSize.subtitle, USUAL_ADVANCE);
    });

    it("should take the subtitle's own width out of the room the name is fitted to", () => {
      const A_WIDER_SUBTITLE = SUBTITLE_WIDTH * 2;

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);
      const roomy = nameToFitSpy.mock.calls[FIRST_CALL]?.[ROOM_ASKED_FOR] as number;

      widthOfSpy.mockReturnValue(A_WIDER_SUBTITLE);
      nameToFitSpy.mockClear();
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);
      const tight = nameToFitSpy.mock.calls[FIRST_CALL]?.[ROOM_ASKED_FOR] as number;

      expect(roomy - tight).toBe(A_WIDER_SUBTITLE - SUBTITLE_WIDTH);
    });

    it("should leave the name a gap short of the subtitle rather than butt them together", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);
      const room = nameToFitSpy.mock.calls[FIRST_CALL]?.[ROOM_ASKED_FOR] as number;

      expect(room).toBeLessThan(GRID_RIGHT - PAD - SUBTITLE_WIDTH);
    });

    it("should hang the title below the eyebrow that introduces it", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(attributesOf(FITTED_NAME).y as number).toBeGreaterThan(
        attributesOf(copy.personalEyebrow).y as number
      );
    });

    it("should date the card from when the player started, through the date table", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(sessionDateSpy).toHaveBeenCalledWith(copy, SINCE);
      expect(attributesOf(SINCE_LINE)["text-anchor"]).toBe("end");
      expect(attributesOf(SINCE_LINE).x).toBe(GRID_RIGHT);
    });

    it("should build the subtitle from the games and the evenings, each through its own tally", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(gameTallySpy).toHaveBeenCalledWith(copy, GAMES);
      expect(eveningTallySpy).toHaveBeenCalledWith(copy, EVENINGS);
      expect(textSpy).toHaveBeenCalledWith(SUBTITLE, expect.anything());
    });

    it("should not build the subtitle out of the raw counts", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(textSpy).not.toHaveBeenCalledWith(
        copy.personalSubtitle(String(GAMES), String(EVENINGS)),
        expect.anything()
      );
    });

    it("should hang the subtitle under the date on the right-hand edge", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(attributesOf(SUBTITLE).x).toBe(GRID_RIGHT);
      expect(attributesOf(SUBTITLE)["text-anchor"]).toBe("end");
      expect(attributesOf(SUBTITLE).y as number).toBeGreaterThan(
        attributesOf(SINCE_LINE).y as number
      );
    });

    it("should rule the heading off across the card", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(ruledAt(HEADING_RULE)).toHaveLength(ONCE);
      expect(ruledAt(HEADING_RULE)[0]).toEqual(
        expect.objectContaining({ x1: PAD, x2: GRID_RIGHT, y2: HEADING_RULE, stroke: palette.ruling })
      );
    });
  });

  describe("the player's own colour", () => {
    it("should title the card in the colour of the column it was given", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(attributesOf(FITTED_NAME).fill).toBe(INK);
    });

    it("should give the chart, the rows and the plate the same ink as the title", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(eveningChartSpy).toHaveBeenCalledWith(copy, expect.objectContaining({ ink: INK }));
      expect(factRowsSpy).toHaveBeenCalledWith(copy, FACTS, INK);
      expect(topFactPlateSpy).toHaveBeenCalledWith(copy, PLATE, INK);
    });

    it("should change the ink with the column, not fix it", () => {
      const ANOTHER_COLUMN = 5;

      renderPersonalCard(copy, CARD, ANOTHER_COLUMN, A_HANDLE);

      expect(attributesOf(FITTED_NAME).fill).toBe(PLAYER_COLOURS[ANOTHER_COLUMN]);
      expect(attributesOf(FITTED_NAME).fill).not.toBe(INK);
    });
  });

  describe("the tiles", () => {
    it("should draw the tiles from the card itself, not from the layout", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(careerTilesSpy).toHaveBeenCalledTimes(ONCE);
      expect(careerTilesSpy).toHaveBeenCalledWith(copy, CARD);
    });

    it("should draw the tiles under the heading", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(body().indexOf(TILES_MARK)).toBeGreaterThan(body().indexOf(marked(FITTED_NAME)));
    });
  });

  describe("the evening chart", () => {
    it("should label the section where the layout put the label", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(attributesOf(copy.personalChartLabel).y).toBe(CHART_LABEL);
      expect(attributesOf(copy.personalChartLabel).x).toBe(PAD);
      expect(attributesOf(copy.personalChartLabel)["letter-spacing"]).toBe(TILE_TRACKING);
      expect(attributesOf(copy.personalChartLabel)["font-size"]).toBe(personalFont.sectionLabel);
    });

    it("should rule the section off above its own label, flat across the card", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(ruledAt(CHART_LABEL - SECTION_LABEL_DROP)).toHaveLength(ONCE);
      expect(ruledAt(CHART_LABEL - SECTION_LABEL_DROP)[0]).toEqual(
        expect.objectContaining({
          x1: PAD,
          x2: GRID_RIGHT,
          y2: CHART_LABEL - SECTION_LABEL_DROP,
        })
      );
    });

    it("should plot the card's own nights where the layout put the plot", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(eveningChartSpy).toHaveBeenCalledTimes(ONCE);
      expect(eveningChartSpy).toHaveBeenCalledWith(copy, {
        nights: NIGHTS,
        top: PLOT_TOP,
        best: BEST,
        worst: WORST,
        ink: INK,
      });
    });

    it("should hint at the chart to come where a drawn one would stand", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ plotTop: null }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(textSpy).toHaveBeenCalledWith(TEASER_HINT_MARK, expect.anything());
    });

    it("should never repeat the chronology's scale line, drawn chart or not", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(textSpy).not.toHaveBeenCalledWith(copy.sheetShareHint, expect.anything());

      personalLayoutOfSpy.mockReturnValue(sheetOf({ plotTop: null }));
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(textSpy).not.toHaveBeenCalledWith(copy.sheetShareHint, expect.anything());
    });

    it("should keep calling the section by the chart's own name with no chart in it", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ plotTop: null }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(textSpy).toHaveBeenCalledWith(copy.personalChartLabel, expect.anything());
      expect(attributesOf(copy.personalChartLabel)["y"]).toBe(CHART_LABEL);
    });

    it("should ask the teaser about the nights the card actually holds", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ plotTop: null }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(chartTeaserSpy).toHaveBeenCalledTimes(ONCE);
      expect(chartTeaserSpy).toHaveBeenCalledWith(copy, NIGHTS.length);
    });

    it("should leave the teaser unasked when there is a chart to draw", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(chartTeaserSpy).toHaveBeenCalledTimes(NEVER);
      expect(textSpy).toHaveBeenCalledWith(copy.personalChartLabel, expect.anything());
    });

    it("should stand the teaser on the same baseline the chart's scale would use", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ plotTop: null }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(attributesOf(TEASER_HINT_MARK)["y"]).toBe(CHART_LABEL + TEASER_TEXT_DROP);
    });

    it("should plot nothing when the layout left the plot out", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ plotTop: null }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(eveningChartSpy).toHaveBeenCalledTimes(NEVER);
      expect(body()).not.toContain(CHART_MARK);
    });
  });

  describe("the fact rows", () => {
    it("should label the facts where the layout put the label, with no hint beside it", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(attributesOf(copy.personalFactsLabel).y).toBe(FACTS_LABEL);
      expect(
        textSpy.mock.calls.filter(
          (call) => (call[1] as Record<string, unknown>).y === FACTS_LABEL
        )
      ).toHaveLength(ONCE);
    });

    it("should rule the facts off above their own label, flat across the card", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(ruledAt(FACTS_LABEL - SECTION_LABEL_DROP)).toHaveLength(ONCE);
      expect(ruledAt(FACTS_LABEL - SECTION_LABEL_DROP)[0]).toEqual(
        expect.objectContaining({
          x1: PAD,
          x2: GRID_RIGHT,
          y2: FACTS_LABEL - SECTION_LABEL_DROP,
        })
      );
    });

    it("should give the facts a rule, a label and the promise under it", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ ...BARE_SHEET, factsLabel: FACTS_LABEL }));
      factRowsSpy.mockReturnValue([]);

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(body()).toEqual([
        BACKGROUND_MARK,
        marked(copy.personalEyebrow),
        marked(FITTED_NAME),
        marked(SINCE_LINE),
        marked(SUBTITLE),
        RULE_MARK,
        TILES_MARK,
        RULE_MARK,
        marked(copy.personalChartLabel),
        marked(TEASER_HINT_MARK),
        RULE_MARK,
        RULE_MARK,
        marked(copy.personalFactsLabel),
        marked(copy.personalFactsAwait),
        RULE_MARK,
        BASEBOARD_MARK,
      ]);
    });

    it("should keep the facts label on a card that has no facts to put under it", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(textSpy).toHaveBeenCalledWith(copy.personalFactsLabel, expect.anything());
    });

    it("should say what the empty facts section is waiting for", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(textSpy).toHaveBeenCalledWith(copy.personalFactsAwait, expect.anything());
    });

    it("should keep that promise off a card whose only fact went on the plate", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ facts: [], plate: PLATE }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(textSpy).not.toHaveBeenCalledWith(copy.personalFactsAwait, expect.anything());
    });

    it("should hand the fact rows the very facts the layout placed, and not the card", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(factRowsSpy).toHaveBeenCalledTimes(ONCE);
      expect(factRowsSpy).toHaveBeenCalledWith(copy, FACTS, INK);
    });

    it("should draw the rows under the chart", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(body().indexOf(FACTS_MARK)).toBeGreaterThan(body().indexOf(CHART_MARK));
    });
  });

  describe("the top fact plate", () => {
    it("should plate the very fact the layout placed there", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(topFactPlateSpy).toHaveBeenCalledTimes(ONCE);
      expect(topFactPlateSpy).toHaveBeenCalledWith(copy, PLATE, INK);
    });

    it("should draw the plate below everything but the baseboard", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(body().at(-TWICE)).toBe(PLATE_MARK);
      expect(body().at(-ONCE)).toBe(BASEBOARD_MARK);
    });

    it("should sign the card at its own foot, from the height the layout settled on", () => {
      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(posterBaseboardSpy).toHaveBeenCalledWith(A_HANDLE, SHEET_HEIGHT);
    });

    it("should draw no plate when the layout left it out", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ plate: null }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(topFactPlateSpy).toHaveBeenCalledTimes(NEVER);
      expect(body()).not.toContain(PLATE_MARK);
      expect(svgOfSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should follow the plate the layout picked rather than reading the card", () => {
      const ANOTHER_PLATE = { fact: ROW_FACT, top: PLATE_TOP } as unknown as PersonalLayout["plate"];

      personalLayoutOfSpy.mockReturnValue(sheetOf({ plate: ANOTHER_PLATE }));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(topFactPlateSpy).toHaveBeenCalledWith(copy, ANOTHER_PLATE, INK);
    });
  });

  describe("a card with tiles and a promise on it", () => {
    it("should omit the chart, the facts and the plate, and nothing else", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));
      factRowsSpy.mockReturnValue([]);

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(body()).toEqual([
        BACKGROUND_MARK,
        marked(copy.personalEyebrow),
        marked(FITTED_NAME),
        marked(SINCE_LINE),
        marked(SUBTITLE),
        RULE_MARK,
        TILES_MARK,
        RULE_MARK,
        marked(copy.personalChartLabel),
        marked(TEASER_HINT_MARK),
        RULE_MARK,
        RULE_MARK,
        marked(copy.personalFactsLabel),
        marked(copy.personalFactsAwait),
        RULE_MARK,
        BASEBOARD_MARK,
      ]);
    });

    it("should still ask the fact rows for whatever the layout placed", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));
      factRowsSpy.mockReturnValue([]);

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(factRowsSpy).toHaveBeenCalledWith(copy, [], INK);
    });

    it("should rule off the heading, both promises and the floor under each", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      expect(lineSpy).toHaveBeenCalledTimes(FIVE_RULES);
    });

    it("should hold the chart's place with a dashed floor rather than empty space", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      const floor = lineSpy.mock.calls[CHART_FLOOR]?.[0] as Record<string, unknown>;

      expect(String(floor["stroke-dasharray"])).toMatch(A_DASH_PATTERN);
      expect(floor["y1"]).toBe(CHART_LABEL + TEASER_FLOOR_DROP);
      expect(floor["y2"]).toBe(floor["y1"]);
    });

    it("should centre the sentence over the card rather than hang it off an edge", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));

      renderPersonalCard(copy, CARD, COLUMN, A_HANDLE);

      const sentence = attributesOf(TEASER_HINT_MARK);

      expect(sentence["x"]).toBe(IMAGE_WIDTH / HALVES);
      expect(sentence["text-anchor"]).toBe("middle");
    });
  });
});
