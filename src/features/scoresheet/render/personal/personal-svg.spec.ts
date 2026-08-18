import { beforeEach, describe, expect, it, vi } from "vitest";
import { GRID_RIGHT, IMAGE_WIDTH, PAD, fontSize } from "#scoresheet/render/card-metrics.ts";
import { PLAYER_COLOURS, palette } from "#scoresheet/render/palette.ts";
import { HEADING_RULE, SECTION_LABEL_DROP, TILE_TRACKING, personalFont } from "#scoresheet/render/personal/personal-metrics.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { PersonalLayout } from "#scoresheet/render/personal/personal-layout.ts";


const personalLayoutOfSpy = vi.fn();

const careerTilesSpy = vi.fn();

const eveningChartSpy = vi.fn();

const factRowsSpy = vi.fn();

const rivalPlateSpy = vi.fn();

const eveningTallySpy = vi.fn();

const gameTallySpy = vi.fn();

const sessionDateSpy = vi.fn();

const lineSpy = vi.fn();

const rectSpy = vi.fn();

const svgOfSpy = vi.fn();

const textSpy = vi.fn();

const EYEBROW_TRACKING = 9;

vi.mock("#scoresheet/render/personal/personal-layout.ts", () => ({
  personalLayoutOf: (card: unknown) => personalLayoutOfSpy(card),
}));

vi.mock("#scoresheet/render/personal/career-tiles.ts", () => ({
  careerTiles: (table: unknown, card: unknown) => careerTilesSpy(table, card),
}));

vi.mock("#scoresheet/render/personal/evening-chart.ts", () => ({
  eveningChart: (chart: unknown) => eveningChartSpy(chart),
}));

vi.mock("#scoresheet/render/personal/fact-rows.ts", () => ({
  factRows: (table: unknown, card: unknown, facts: unknown, ink: unknown) =>
    factRowsSpy(table, card, facts, ink),
}));

vi.mock("#scoresheet/render/personal/rival-plate.ts", () => ({
  rivalPlate: (table: unknown, rival: unknown, subject: unknown, top: unknown) =>
    rivalPlateSpy(table, rival, subject, top),
}));

vi.mock("#scoresheet/render/card-heading.ts", () => ({ EYEBROW_TRACKING }));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  eveningTally: (table: unknown, evenings: number) => eveningTallySpy(table, evenings),
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

vi.mock("#scoresheet/render/session-date.ts", () => ({
  sessionDate: (table: unknown, isoDate: string) => sessionDateSpy(table, isoDate),
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

const ORIGIN = 0;

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

const RIVAL = { playerId: 3, displayName: "Anna", duels: 7, lost: 4 };

const NIGHTS = [{ seriesNo: 1, playedOn: SINCE, games: 3, fools: 0, share: 0.5 }];

const BEST = NIGHTS[0];

const WORST = null;

const FACTS = [{ top: FACT_TOP }] as unknown as PersonalLayout["facts"];

const INK = PLAYER_COLOURS[COLUMN];

const BACKGROUND_MARK = "<background/>";

const RULE_MARK = "<line/>";

const TILES_MARK = "<tiles/>";

const CHART_MARK = "<chart/>";

const FACTS_MARK = "<facts/>";

const PLATE_MARK = "<plate/>";

const DATE_MARK = "the-date";

const GAME_TALLY_MARK = "the-games";

const EVENING_TALLY_MARK = "the-evenings";

const CARD = {
  displayName: SUBJECT,
  since: SINCE,
  tally: { games: GAMES, evenings: EVENINGS },
  nights: NIGHTS,
  best: BEST,
  worst: WORST,
  rival: RIVAL,
} as unknown as CareerCard;

const sheetOf = (overrides: Partial<PersonalLayout> = {}): PersonalLayout =>
  ({
    height: SHEET_HEIGHT,
    chartLabel: CHART_LABEL,
    plotTop: PLOT_TOP,
    factsLabel: FACTS_LABEL,
    facts: FACTS,
    plateTop: PLATE_TOP,
    ...overrides,
  }) as unknown as PersonalLayout;

const BARE_SHEET: Partial<PersonalLayout> = {
  chartLabel: null,
  plotTop: null,
  factsLabel: null,
  facts: [],
  plateTop: null,
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
    factRowsSpy.mockReturnValue([FACTS_MARK]);
    rivalPlateSpy.mockReturnValue([PLATE_MARK]);
    eveningTallySpy.mockReturnValue(EVENING_TALLY_MARK);
    gameTallySpy.mockReturnValue(GAME_TALLY_MARK);
    sessionDateSpy.mockReturnValue(DATE_MARK);
    lineSpy.mockImplementation(() => RULE_MARK);
    rectSpy.mockImplementation(() => BACKGROUND_MARK);
    svgOfSpy.mockImplementation(() => "<svg/>");
    textSpy.mockImplementation((value: string) => marked(value));
  });

  describe("the sheet it draws on", () => {
    it("should lay the card out exactly once, from the card it was given", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(personalLayoutOfSpy).toHaveBeenCalledTimes(ONCE);
      expect(personalLayoutOfSpy).toHaveBeenCalledWith(CARD);
    });

    it("should size the drawing to the layout's own height", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(svgOfSpy).toHaveBeenCalledWith(IMAGE_WIDTH, SHEET_HEIGHT, expect.anything());
    });

    it("should follow the layout when it says the sheet is shorter", () => {
      const SHORT_SHEET = 1056;
      personalLayoutOfSpy.mockReturnValue(sheetOf({ ...BARE_SHEET, height: SHORT_SHEET }));

      renderPersonalCard(copy, CARD, COLUMN);

      expect(svgOfSpy).toHaveBeenCalledWith(IMAGE_WIDTH, SHORT_SHEET, expect.anything());
    });

    it("should paint a background over the whole sheet", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(rectSpy).toHaveBeenCalledWith({
        x: ORIGIN,
        y: ORIGIN,
        width: IMAGE_WIDTH,
        height: SHEET_HEIGHT,
        fill: palette.sheet,
      });
    });

    it("should paint the background before anything else", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(body()[0]).toBe(BACKGROUND_MARK);
    });

    it("should hand back whatever svgOf built", () => {
      expect(renderPersonalCard(copy, CARD, COLUMN)).toBe("<svg/>");
    });
  });

  describe("the heading", () => {
    it("should print the card's own eyebrow, tracked as a heading eyebrow is", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(attributesOf(copy.personalEyebrow)["letter-spacing"]).toBe(EYEBROW_TRACKING);
      expect(attributesOf(copy.personalEyebrow).fill).toBe(palette.inkMuted);
      expect(attributesOf(copy.personalEyebrow)["font-size"]).toBe(fontSize.eyebrow);
    });

    it("should title the card with the player's own name", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(attributesOf(SUBJECT).x).toBe(PAD);
      expect(attributesOf(SUBJECT)["font-weight"]).toBe("bold");
      expect(attributesOf(SUBJECT)["font-size"]).toBe(fontSize.title);
    });

    it("should hang the title below the eyebrow that introduces it", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(attributesOf(SUBJECT).y as number).toBeGreaterThan(
        attributesOf(copy.personalEyebrow).y as number
      );
    });

    it("should date the card from when the player started, through the date table", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(sessionDateSpy).toHaveBeenCalledWith(copy, SINCE);
      expect(attributesOf(SINCE_LINE)["text-anchor"]).toBe("end");
      expect(attributesOf(SINCE_LINE).x).toBe(GRID_RIGHT);
    });

    it("should build the subtitle from the games and the evenings, each through its own tally", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(gameTallySpy).toHaveBeenCalledWith(copy, GAMES);
      expect(eveningTallySpy).toHaveBeenCalledWith(copy, EVENINGS);
      expect(textSpy).toHaveBeenCalledWith(SUBTITLE, expect.anything());
    });

    it("should not build the subtitle out of the raw counts", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(textSpy).not.toHaveBeenCalledWith(
        copy.personalSubtitle(String(GAMES), String(EVENINGS)),
        expect.anything()
      );
    });

    it("should hang the subtitle under the date on the right-hand edge", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(attributesOf(SUBTITLE).x).toBe(GRID_RIGHT);
      expect(attributesOf(SUBTITLE)["text-anchor"]).toBe("end");
      expect(attributesOf(SUBTITLE).y as number).toBeGreaterThan(
        attributesOf(SINCE_LINE).y as number
      );
    });

    it("should rule the heading off across the card", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(ruledAt(HEADING_RULE)).toHaveLength(ONCE);
      expect(ruledAt(HEADING_RULE)[0]).toEqual(
        expect.objectContaining({ x1: PAD, x2: GRID_RIGHT, y2: HEADING_RULE, stroke: palette.ruling })
      );
    });
  });

  describe("the player's own colour", () => {
    it("should title the card in the colour of the column it was given", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(attributesOf(SUBJECT).fill).toBe(INK);
    });

    it("should give the chart and the facts the same ink as the title", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(eveningChartSpy).toHaveBeenCalledWith(expect.objectContaining({ ink: INK }));
      expect(factRowsSpy).toHaveBeenCalledWith(copy, CARD, FACTS, INK);
    });

    it("should change the ink with the column, not fix it", () => {
      const ANOTHER_COLUMN = 5;

      renderPersonalCard(copy, CARD, ANOTHER_COLUMN);

      expect(attributesOf(SUBJECT).fill).toBe(PLAYER_COLOURS[ANOTHER_COLUMN]);
      expect(attributesOf(SUBJECT).fill).not.toBe(INK);
    });
  });

  describe("the tiles", () => {
    it("should draw the tiles from the card itself, not from the layout", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(careerTilesSpy).toHaveBeenCalledTimes(ONCE);
      expect(careerTilesSpy).toHaveBeenCalledWith(copy, CARD);
    });

    it("should draw the tiles under the heading", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(body().indexOf(TILES_MARK)).toBeGreaterThan(body().indexOf(marked(SUBJECT)));
    });
  });

  describe("the evening chart", () => {
    it("should label the section where the layout put the label", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(attributesOf(copy.personalChartLabel).y).toBe(CHART_LABEL);
      expect(attributesOf(copy.personalChartLabel).x).toBe(PAD);
      expect(attributesOf(copy.personalChartLabel)["letter-spacing"]).toBe(TILE_TRACKING);
      expect(attributesOf(copy.personalChartLabel)["font-size"]).toBe(personalFont.sectionLabel);
    });

    it("should hang the section's hint off the right edge on the label's baseline", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(attributesOf(copy.personalChartHint).x).toBe(GRID_RIGHT);
      expect(attributesOf(copy.personalChartHint).y).toBe(CHART_LABEL);
      expect(attributesOf(copy.personalChartHint)["text-anchor"]).toBe("end");
    });

    it("should rule the section off above its own label, flat across the card", () => {
      renderPersonalCard(copy, CARD, COLUMN);

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
      renderPersonalCard(copy, CARD, COLUMN);

      expect(eveningChartSpy).toHaveBeenCalledTimes(ONCE);
      expect(eveningChartSpy).toHaveBeenCalledWith({
        nights: NIGHTS,
        top: PLOT_TOP,
        best: BEST,
        worst: WORST,
        ink: INK,
      });
    });

    it("should print no chart label when the layout left it out", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ chartLabel: null }));

      renderPersonalCard(copy, CARD, COLUMN);

      expect(textSpy).not.toHaveBeenCalledWith(copy.personalChartLabel, expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith(copy.personalChartHint, expect.anything());
    });

    it("should plot nothing when the layout left the plot out", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ plotTop: null }));

      renderPersonalCard(copy, CARD, COLUMN);

      expect(eveningChartSpy).toHaveBeenCalledTimes(NEVER);
      expect(body()).not.toContain(CHART_MARK);
    });
  });

  describe("the facts", () => {
    it("should label the facts where the layout put the label, with no hint beside it", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(attributesOf(copy.personalFactsLabel).y).toBe(FACTS_LABEL);
      expect(
        textSpy.mock.calls.filter(
          (call) => (call[1] as Record<string, unknown>).y === FACTS_LABEL
        )
      ).toHaveLength(ONCE);
    });

    it("should rule the facts off above their own label, flat across the card", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(ruledAt(FACTS_LABEL - SECTION_LABEL_DROP)).toHaveLength(ONCE);
      expect(ruledAt(FACTS_LABEL - SECTION_LABEL_DROP)[0]).toEqual(
        expect.objectContaining({
          x1: PAD,
          x2: GRID_RIGHT,
          y2: FACTS_LABEL - SECTION_LABEL_DROP,
        })
      );
    });

    it("should give the facts a rule and a label and nothing more", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ ...BARE_SHEET, factsLabel: FACTS_LABEL }));
      factRowsSpy.mockReturnValue([]);

      renderPersonalCard(copy, CARD, COLUMN);

      expect(body()).toEqual([
        BACKGROUND_MARK,
        marked(copy.personalEyebrow),
        marked(SUBJECT),
        marked(SINCE_LINE),
        marked(SUBTITLE),
        RULE_MARK,
        TILES_MARK,
        RULE_MARK,
        marked(copy.personalFactsLabel),
      ]);
    });

    it("should print no facts label when the layout left it out", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ factsLabel: null }));

      renderPersonalCard(copy, CARD, COLUMN);

      expect(textSpy).not.toHaveBeenCalledWith(copy.personalFactsLabel, expect.anything());
    });

    it("should hand the fact rows the very facts the layout placed", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(factRowsSpy).toHaveBeenCalledTimes(ONCE);
      expect(factRowsSpy).toHaveBeenCalledWith(copy, CARD, FACTS, INK);
    });

    it("should draw the facts under the chart", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(body().indexOf(FACTS_MARK)).toBeGreaterThan(body().indexOf(CHART_MARK));
    });
  });

  describe("the rival plate", () => {
    it("should draw the plate where the layout put it, naming the card's own player", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(rivalPlateSpy).toHaveBeenCalledTimes(ONCE);
      expect(rivalPlateSpy).toHaveBeenCalledWith(copy, RIVAL, SUBJECT, PLATE_TOP);
    });

    it("should draw the plate last of all", () => {
      renderPersonalCard(copy, CARD, COLUMN);

      expect(body().at(-ONCE)).toBe(PLATE_MARK);
    });

    it("should draw no plate when the layout left it out", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf({ plateTop: null }));

      renderPersonalCard(copy, CARD, COLUMN);

      expect(rivalPlateSpy).toHaveBeenCalledTimes(NEVER);
      expect(body()).not.toContain(PLATE_MARK);
    });

    it("should draw no plate when the card found no rival to name", () => {
      renderPersonalCard(copy, { ...CARD, rival: null } as unknown as CareerCard, COLUMN);

      expect(rivalPlateSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("a card with nothing but tiles on it", () => {
    it("should omit the chart, the facts and the plate, and nothing else", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));
      factRowsSpy.mockReturnValue([]);

      renderPersonalCard(copy, CARD, COLUMN);

      expect(body()).toEqual([
        BACKGROUND_MARK,
        marked(copy.personalEyebrow),
        marked(SUBJECT),
        marked(SINCE_LINE),
        marked(SUBTITLE),
        RULE_MARK,
        TILES_MARK,
      ]);
    });

    it("should still ask the fact rows for whatever the layout placed", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));
      factRowsSpy.mockReturnValue([]);

      renderPersonalCard(copy, CARD, COLUMN);

      expect(factRowsSpy).toHaveBeenCalledWith(copy, CARD, [], INK);
    });

    it("should rule off the heading and nothing more", () => {
      personalLayoutOfSpy.mockReturnValue(sheetOf(BARE_SHEET));

      renderPersonalCard(copy, CARD, COLUMN);

      expect(lineSpy).toHaveBeenCalledTimes(ONCE);
    });
  });
});
