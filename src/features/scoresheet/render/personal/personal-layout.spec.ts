import { describe, expect, it } from "vitest";
import {
  CHART_BOTTOM_GAP,
  CHART_TOP_DROP,
  FACTS_TOP_DROP,
  FACT_HEIGHT,
  PLATE_GAP,
  PLATE_HEIGHT,
  PLOT_HEIGHT,
  SECTION_LABEL_DROP,
  SHEET_BOTTOM,
  TILES_TOP,
  TILE_BOTTOM_GAP,
  TILE_NOTE_DROP,
  TILE_ROW_HEIGHT,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { IMAGE_MAX_HEIGHT } from "#scoresheet/render/card-metrics.ts";
import { ENOUGH_NIGHTS_TO_CHART } from "#scoresheet/domain/career/career-evenings.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { CleanStreak } from "#scoresheet/domain/career/clean-streak.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";
import type { Rival } from "#scoresheet/domain/career/career-rival.ts";
import {
  FactName,
  personalLayoutOf,
} from "#scoresheet/render/personal/personal-layout.ts";


const NOTHING = 0;

const ONE_FACT = 1;

const TWO_FACTS = 2;

const THREE_FACTS = 3;

const A_NIGHT = 3;

const HALF = 0.5;

const A_DATE = "2026-07-24";

const ANOTHER_DATE = "2026-08-01";

const STREAK_GAMES = 6;

const DUELS = 7;

const LOST = 4;

const RIVAL_ID = 2;

const EMPTY_SHEET_HEIGHT = 1046;

const FULL_SHEET_HEIGHT = 2540;

const eveningOf = (seriesNo: number): EveningShare => ({
  seriesNo,
  playedOn: A_DATE,
  games: A_NIGHT,
  fools: NOTHING,
  share: HALF,
});

const nightsOf = (count: number): readonly EveningShare[] =>
  Array.from({ length: count }, (_unused, index) => eveningOf(index));

const STREAK: CleanStreak = { games: STREAK_GAMES, from: A_DATE, until: ANOTHER_DATE };

const RIVAL: Rival = { playerId: RIVAL_ID, displayName: "Anna", duels: DUELS, lost: LOST };

const cardOf = (overrides: Partial<CareerCard> = {}): CareerCard =>
  ({
    nights: [],
    best: null,
    worst: null,
    streak: null,
    rival: null,
    ...overrides,
  }) as unknown as CareerCard;

const AFTER_TILES = TILES_TOP + TILE_ROW_HEIGHT + TILE_NOTE_DROP + TILE_BOTTOM_GAP;

const chartedCard = (overrides: Partial<CareerCard> = {}): CareerCard =>
  cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART), ...overrides });

const fullCard = (): CareerCard =>
  chartedCard({
    best: eveningOf(NOTHING),
    worst: eveningOf(ONE_FACT),
    streak: STREAK,
    rival: RIVAL,
  });

describe("personalLayoutOf()", () => {
  describe("whether the evening chart is drawn at all", () => {
    it("should draw no chart one night short of enough", () => {
      const sheet = personalLayoutOf(cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART - ONE_FACT) }));

      expect(sheet.chartLabel).toBeNull();
      expect(sheet.plotTop).toBeNull();
    });

    it("should draw the chart on exactly the night that makes it worth drawing", () => {
      const sheet = personalLayoutOf(cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART) }));

      expect(sheet.chartLabel).not.toBeNull();
      expect(sheet.plotTop).not.toBeNull();
    });

    it("should keep drawing the chart well past the threshold", () => {
      const sheet = personalLayoutOf(cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART + ONE_FACT) }));

      expect(sheet.plotTop).not.toBeNull();
    });

    it("should draw no chart for a card with no nights at all", () => {
      const sheet = personalLayoutOf(cardOf());

      expect(sheet.chartLabel).toBeNull();
    });

    it("should make the sheet shorter when the chart is left out", () => {
      const charted = personalLayoutOf(cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART) }));
      const bare = personalLayoutOf(cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART - ONE_FACT) }));

      expect(bare.height).toBeLessThan(charted.height);
    });
  });

  describe("where the chart sits", () => {
    it("should label the chart a section drop below the tiles", () => {
      const sheet = personalLayoutOf(chartedCard());

      expect(sheet.chartLabel).toBe(AFTER_TILES + SECTION_LABEL_DROP);
    });

    it("should hang the plot below its own label", () => {
      const sheet = personalLayoutOf(chartedCard());

      expect(sheet.plotTop).toBe((sheet.chartLabel ?? NOTHING) + CHART_TOP_DROP);
    });
  });

  describe("which facts the sheet holds", () => {
    it("should hold nothing when the card has no fact to tell", () => {
      const sheet = personalLayoutOf(cardOf());

      expect(sheet.facts).toHaveLength(NOTHING);
    });

    it("should label no facts section when the card has no fact to tell", () => {
      const sheet = personalLayoutOf(cardOf());

      expect(sheet.factsLabel).toBeNull();
    });

    it("should hold every fact the card has, best then worst then streak", () => {
      const sheet = personalLayoutOf(fullCard());

      expect(sheet.facts.map((fact) => fact.name)).toEqual([
        FactName.Best,
        FactName.Worst,
        FactName.Streak,
      ]);
    });

    it("should skip the fact the card is missing without disturbing the order", () => {
      const sheet = personalLayoutOf(cardOf({ best: eveningOf(NOTHING), streak: STREAK }));

      expect(sheet.facts.map((fact) => fact.name)).toEqual([FactName.Best, FactName.Streak]);
    });

    it("should hold the worst evening on its own when it is the only one", () => {
      const sheet = personalLayoutOf(cardOf({ worst: eveningOf(NOTHING) }));

      expect(sheet.facts.map((fact) => fact.name)).toEqual([FactName.Worst]);
    });

    it("should hold the streak on its own when it is the only one", () => {
      const sheet = personalLayoutOf(cardOf({ streak: STREAK }));

      expect(sheet.facts.map((fact) => fact.name)).toEqual([FactName.Streak]);
    });

    it("should label the section as soon as one fact qualifies", () => {
      const sheet = personalLayoutOf(cardOf({ streak: STREAK }));

      expect(sheet.factsLabel).toBe(AFTER_TILES + SECTION_LABEL_DROP);
    });

    it("should push the facts below the chart when there is one", () => {
      const charted = personalLayoutOf(chartedCard({ streak: STREAK }));
      const bare = personalLayoutOf(cardOf({ streak: STREAK }));

      expect(charted.facts[0]?.top).toBeGreaterThan(bare.facts[0]?.top ?? NOTHING);
    });
  });

  describe("stacking the facts", () => {
    it("should start the first fact a facts drop below the tiles", () => {
      const sheet = personalLayoutOf(cardOf({ streak: STREAK }));

      expect(sheet.facts[0]?.top).toBe(AFTER_TILES + FACTS_TOP_DROP);
    });

    it("should start the first fact below the chart the card earned", () => {
      const sheet = personalLayoutOf(chartedCard({ streak: STREAK }));
      const afterChart = (sheet.plotTop ?? NOTHING) + PLOT_HEIGHT + CHART_BOTTOM_GAP;

      expect(sheet.facts[0]?.top).toBe(afterChart + FACTS_TOP_DROP);
    });

    it("should set each fact exactly one fact height below the one before it", () => {
      const sheet = personalLayoutOf(fullCard());

      expect((sheet.facts[ONE_FACT]?.top ?? NOTHING) - (sheet.facts[NOTHING]?.top ?? NOTHING)).toBe(
        FACT_HEIGHT
      );
      expect(
        (sheet.facts[TWO_FACTS]?.top ?? NOTHING) - (sheet.facts[ONE_FACT]?.top ?? NOTHING)
      ).toBe(FACT_HEIGHT);
    });

    it("should place the facts below the label that introduces them", () => {
      const sheet = personalLayoutOf(fullCard());

      expect(sheet.facts[0]?.top).toBeGreaterThan(sheet.factsLabel ?? NOTHING);
    });
  });

  describe("the rival plate", () => {
    it("should place no plate when the card found no rival", () => {
      const sheet = personalLayoutOf(cardOf());

      expect(sheet.plateTop).toBeNull();
    });

    it("should hang the plate below the tiles when nothing else was drawn", () => {
      const sheet = personalLayoutOf(cardOf({ rival: RIVAL }));

      expect(sheet.plateTop).toBe(AFTER_TILES + PLATE_GAP);
    });

    it("should hang the plate below every fact the sheet held", () => {
      const sheet = personalLayoutOf(fullCard());
      const lastFact = sheet.facts.at(-ONE_FACT);

      expect(sheet.plateTop).toBe((lastFact?.top ?? NOTHING) + FACT_HEIGHT + PLATE_GAP);
    });

    it("should make the sheet shorter when there is no rival to name", () => {
      const withRival = personalLayoutOf(cardOf({ rival: RIVAL }));
      const without = personalLayoutOf(cardOf());

      expect(without.height).toBeLessThan(withRival.height);
    });
  });

  describe("how tall the sheet ends up", () => {
    it("should leave the sheet's own bottom margin under an empty card", () => {
      expect(personalLayoutOf(cardOf()).height).toBe(AFTER_TILES + SHEET_BOTTOM);
    });

    it("should measure an empty card at exactly the tiles plus the margin", () => {
      expect(personalLayoutOf(cardOf()).height).toBe(EMPTY_SHEET_HEIGHT);
    });

    it("should measure a card with everything on it at its own stacked height", () => {
      expect(personalLayoutOf(fullCard()).height).toBe(FULL_SHEET_HEIGHT);
    });

    it("should keep even the richest card inside the height Telegram will accept", () => {
      expect(personalLayoutOf(fullCard()).height).toBeLessThanOrEqual(IMAGE_MAX_HEIGHT);
    });

    it("should end the sheet below the plate it drew", () => {
      const sheet = personalLayoutOf(fullCard());

      expect(sheet.height).toBe((sheet.plateTop ?? NOTHING) + PLATE_HEIGHT + SHEET_BOTTOM);
    });

    it("should grow by exactly one fact height for each fact it gained", () => {
      const one = personalLayoutOf(cardOf({ streak: STREAK }));
      const two = personalLayoutOf(cardOf({ worst: eveningOf(NOTHING), streak: STREAK }));

      expect(two.height - one.height).toBe(FACT_HEIGHT);
    });

    it("should make the empty card shorter than any card carrying a section", () => {
      const empty = personalLayoutOf(cardOf());

      expect(empty.height).toBeLessThan(personalLayoutOf(fullCard()).height);
      expect(empty.height).toBeLessThan(personalLayoutOf(cardOf({ rival: RIVAL })).height);
      expect(empty.height).toBeLessThan(personalLayoutOf(cardOf({ streak: STREAK })).height);
      expect(empty.height).toBeLessThan(personalLayoutOf(chartedCard()).height);
    });

    it("should count all three facts, not only the first", () => {
      const three = personalLayoutOf(
        cardOf({ best: eveningOf(NOTHING), worst: eveningOf(ONE_FACT), streak: STREAK })
      );
      const one = personalLayoutOf(cardOf({ streak: STREAK }));

      expect(three.height - one.height).toBe(FACT_HEIGHT * TWO_FACTS);
      expect(three.facts).toHaveLength(THREE_FACTS);
    });
  });
});
