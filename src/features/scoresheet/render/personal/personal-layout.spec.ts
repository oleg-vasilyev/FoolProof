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
  TEASER_BOTTOM_GAP,
  TILES_TOP,
  TILE_BOTTOM_GAP,
  TILE_NOTE_DROP,
  TILE_ROW_HEIGHT,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { IMAGE_MAX_HEIGHT } from "#scoresheet/render/card-metrics.ts";
import { ENOUGH_NIGHTS_TO_CHART } from "#scoresheet/domain/career/career-evenings.ts";
import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";
import {
  MOST_ROWS,
  aboutARival,
  personalLayoutOf,
  plateFactIn,
  rowFactsIn,
} from "#scoresheet/render/personal/personal-layout.ts";


const NOTHING = 0;

const ONE_FACT = 1;

const TWO_FACTS = 2;

const A_NIGHT = 3;

const NO_FOOLS = 0;

const NO_FIRSTS = 0;

const HALF = 0.5;

const A_DATE = "2026-07-24";

const EMPTY_SHEET_HEIGHT = 1180;

const TALLEST_SHEET_HEIGHT = 2540;

const ABOUT_A_RIVAL: Readonly<Record<CareerFactName, boolean>> = {
  [CareerFactName.TheBlinder]: false,
  [CareerFactName.TheNightmare]: false,
  [CareerFactName.TheCharm]: true,
  [CareerFactName.TheJinx]: true,
  [CareerFactName.ThePatsy]: true,
  [CareerFactName.TheBogey]: true,
  [CareerFactName.BigTableCharm]: false,
  [CareerFactName.BigTableCurse]: false,
  [CareerFactName.OpenersGift]: false,
  [CareerFactName.OpenersCurse]: false,
  [CareerFactName.TheHomecoming]: false,
  [CareerFactName.NeverDealt]: false,
  [CareerFactName.TheHeadStart]: false,
  [CareerFactName.TheBadPatch]: false,
  [CareerFactName.TheCleanRun]: false,
  [CareerFactName.TheSurvivor]: false,
  [CareerFactName.LightningRod]: false,
  [CareerFactName.EverPresent]: false,
  [CareerFactName.FoundingMember]: false,
  [CareerFactName.TheNewcomer]: false,
};

const A_RIVALS_NAME = "Anya";

const factOf = (name: CareerFactName): CareerFact =>
  ({
    name,
    ...(ABOUT_A_RIVAL[name] ? { rival: A_RIVALS_NAME } : {}),
  }) as unknown as CareerFact;

const RIVAL_FACT = factOf(CareerFactName.TheBogey);

const ANOTHER_RIVAL_FACT = factOf(CareerFactName.TheCharm);

const PLAIN_FACTS: readonly CareerFact[] = [
  factOf(CareerFactName.TheBlinder),
  factOf(CareerFactName.TheNightmare),
  factOf(CareerFactName.TheHomecoming),
  factOf(CareerFactName.NeverDealt),
  factOf(CareerFactName.TheHeadStart),
];

const plainFacts = (count: number): readonly CareerFact[] => PLAIN_FACTS.slice(NOTHING, count);

const eveningOf = (seriesNo: number): EveningShare => ({
  seriesNo,
  playedOn: A_DATE,
  games: A_NIGHT,
  decided: A_NIGHT,
  fools: NO_FOOLS,
  firsts: NO_FIRSTS,
  share: HALF,
});

const nightsOf = (count: number): readonly EveningShare[] =>
  Array.from({ length: count }, (_unused, index) => eveningOf(index));

const cardOf = (overrides: Partial<CareerCard> = {}): CareerCard =>
  ({ nights: [], facts: [], ...overrides }) as unknown as CareerCard;

const chartedCard = (overrides: Partial<CareerCard> = {}): CareerCard =>
  cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART), ...overrides });

const AFTER_TILES = TILES_TOP + TILE_ROW_HEIGHT + TILE_NOTE_DROP + TILE_BOTTOM_GAP;

const AFTER_TEASER = AFTER_TILES + SECTION_LABEL_DROP + TEASER_BOTTOM_GAP;

const TALLEST_FACTS: readonly CareerFact[] = [RIVAL_FACT, ...plainFacts(MOST_ROWS + ONE_FACT)];

const tallestCard = (): CareerCard => chartedCard({ facts: TALLEST_FACTS });

describe("aboutARival()", () => {
  it("should judge every fact the catalogue names", () => {
    expect(Object.keys(ABOUT_A_RIVAL).sort()).toEqual([...Object.values(CareerFactName)].sort());
  });

  it.each(Object.values(CareerFactName))(
    "should say whether %s is about another player at the table",
    (name) => {
      expect(aboutARival(factOf(name))).toBe(ABOUT_A_RIVAL[name]);
    }
  );

  it("should find some facts about another player and leave the rest alone", () => {
    const judged = Object.values(CareerFactName).map((name) => aboutARival(factOf(name)));

    expect(judged).toContain(true);
    expect(judged).toContain(false);
  });
});

describe("plateFactIn()", () => {
  it("should find nothing to plate in a card with no facts at all", () => {
    expect(plateFactIn([])).toBeNull();
  });

  it("should find nothing to plate when no fact is about another player", () => {
    expect(plateFactIn(plainFacts(MOST_ROWS))).toBeNull();
  });

  it("should plate the one fact that names another player", () => {
    expect(plateFactIn([...plainFacts(TWO_FACTS), RIVAL_FACT])).toBe(RIVAL_FACT);
  });

  it("should plate the first such fact when the card has two", () => {
    expect(plateFactIn([RIVAL_FACT, ANOTHER_RIVAL_FACT])).toBe(RIVAL_FACT);
  });

  it("should keep the card's own order rather than preferring one kind", () => {
    expect(plateFactIn([ANOTHER_RIVAL_FACT, RIVAL_FACT])).toBe(ANOTHER_RIVAL_FACT);
  });
});

describe("rowFactsIn()", () => {
  it("should hold nothing for a card with no facts at all", () => {
    expect(rowFactsIn([])).toEqual([]);
  });

  it("should hold every fact the card has when it has room for them", () => {
    expect(rowFactsIn(plainFacts(TWO_FACTS))).toEqual(plainFacts(TWO_FACTS));
  });

  it("should hold no more rows than the sheet has room for", () => {
    expect(rowFactsIn(PLAIN_FACTS)).toHaveLength(MOST_ROWS);
    expect(PLAIN_FACTS.length).toBeGreaterThan(MOST_ROWS);
  });

  it("should keep the rarest facts, which the card lists first", () => {
    expect(rowFactsIn(PLAIN_FACTS)).toEqual(plainFacts(MOST_ROWS));
  });

  it("should leave the plated fact out of the rows", () => {
    expect(rowFactsIn([RIVAL_FACT, ...plainFacts(TWO_FACTS)])).toEqual(plainFacts(TWO_FACTS));
  });

  it("should fill the rows from the facts left after the plate takes one", () => {
    expect(rowFactsIn(TALLEST_FACTS)).toEqual(plainFacts(MOST_ROWS));
  });

  it("should drop only the fact that was plated, not every fact about a rival", () => {
    expect(rowFactsIn([RIVAL_FACT, ANOTHER_RIVAL_FACT])).toEqual([ANOTHER_RIVAL_FACT]);
  });
});

describe("personalLayoutOf()", () => {
  describe("whether the evening chart is drawn at all", () => {
    it("should draw no chart one night short of enough", () => {
      const sheet = personalLayoutOf(cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART - ONE_FACT) }));

      expect(sheet.plotTop).toBeNull();
    });

    it("should draw the chart on exactly the night that makes it worth drawing", () => {
      const sheet = personalLayoutOf(cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART) }));

      expect(sheet.plotTop).not.toBeNull();
    });

    it("should keep drawing the chart well past the threshold", () => {
      const sheet = personalLayoutOf(cardOf({ nights: nightsOf(ENOUGH_NIGHTS_TO_CHART + ONE_FACT) }));

      expect(sheet.plotTop).not.toBeNull();
    });

    it("should draw no chart for a card with no nights at all", () => {
      const sheet = personalLayoutOf(cardOf());

      expect(sheet.plotTop).toBeNull();
    });

    it("should keep the section labelled even when there is no chart to draw", () => {
      const sheet = personalLayoutOf(cardOf());

      expect(sheet.chartLabel).toBe(AFTER_TILES + SECTION_LABEL_DROP);
    });

    it("should label the section in the same place whether the chart is drawn or not", () => {
      const charted = personalLayoutOf(chartedCard());
      const bare = personalLayoutOf(cardOf());

      expect(bare.chartLabel).toBe(charted.chartLabel);
    });

    it("should leave the teaser its own gap instead of a plot's height", () => {
      const bare = personalLayoutOf(cardOf({ facts: plainFacts(ONE_FACT) }));

      expect(bare.facts[0]?.top).toBe(AFTER_TEASER + FACTS_TOP_DROP);
    });

    it("should make the sheet shorter when the chart is left out", () => {
      const charted = personalLayoutOf(chartedCard());
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

      expect(sheet.plotTop).toBe(sheet.chartLabel + CHART_TOP_DROP);
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

    it("should carry the card's own facts, not merely their names", () => {
      const sheet = personalLayoutOf(cardOf({ facts: plainFacts(TWO_FACTS) }));

      expect(sheet.facts.map((placed) => placed.fact)).toEqual(plainFacts(TWO_FACTS));
    });

    it("should hold the rows the row helper picked out of the card", () => {
      const sheet = personalLayoutOf(cardOf({ facts: TALLEST_FACTS }));

      expect(sheet.facts.map((placed) => placed.fact)).toEqual(rowFactsIn(TALLEST_FACTS));
    });

    it("should label the section as soon as one fact qualifies", () => {
      const sheet = personalLayoutOf(cardOf({ facts: plainFacts(ONE_FACT) }));

      expect(sheet.factsLabel).toBe(AFTER_TEASER + SECTION_LABEL_DROP);
    });

    it("should label the section even when the card's only fact goes on the plate", () => {
      const sheet = personalLayoutOf(cardOf({ facts: [RIVAL_FACT] }));

      expect(sheet.facts).toHaveLength(NOTHING);
      expect(sheet.factsLabel).not.toBeNull();
    });

    it("should push the facts below the chart when there is one", () => {
      const charted = personalLayoutOf(chartedCard({ facts: plainFacts(ONE_FACT) }));
      const bare = personalLayoutOf(cardOf({ facts: plainFacts(ONE_FACT) }));

      expect(charted.facts[0]?.top).toBeGreaterThan(bare.facts[0]?.top ?? NOTHING);
    });
  });

  describe("stacking the facts", () => {
    it("should start the first fact a facts drop below the teaser", () => {
      const sheet = personalLayoutOf(cardOf({ facts: plainFacts(ONE_FACT) }));

      expect(sheet.facts[0]?.top).toBe(AFTER_TEASER + FACTS_TOP_DROP);
    });

    it("should start the first fact below the chart the card earned", () => {
      const sheet = personalLayoutOf(chartedCard({ facts: plainFacts(ONE_FACT) }));
      const afterChart = (sheet.plotTop ?? NOTHING) + PLOT_HEIGHT + CHART_BOTTOM_GAP;

      expect(sheet.facts[0]?.top).toBe(afterChart + FACTS_TOP_DROP);
    });

    it("should set each fact exactly one fact height below the one before it", () => {
      const sheet = personalLayoutOf(cardOf({ facts: PLAIN_FACTS }));

      expect((sheet.facts[ONE_FACT]?.top ?? NOTHING) - (sheet.facts[NOTHING]?.top ?? NOTHING)).toBe(
        FACT_HEIGHT
      );
      expect(
        (sheet.facts[TWO_FACTS]?.top ?? NOTHING) - (sheet.facts[ONE_FACT]?.top ?? NOTHING)
      ).toBe(FACT_HEIGHT);
    });

    it("should place the facts below the label that introduces them", () => {
      const sheet = personalLayoutOf(cardOf({ facts: PLAIN_FACTS }));

      expect(sheet.facts[0]?.top).toBeGreaterThan(sheet.factsLabel ?? NOTHING);
    });
  });

  describe("the plate at the foot of the sheet", () => {
    it("should place no plate when no fact is about another player", () => {
      const sheet = personalLayoutOf(cardOf({ facts: PLAIN_FACTS }));

      expect(sheet.plate).toBeNull();
    });

    it("should plate the fact the plate helper picked out of the card", () => {
      const sheet = personalLayoutOf(cardOf({ facts: TALLEST_FACTS }));

      expect(sheet.plate?.fact).toBe(plateFactIn(TALLEST_FACTS));
    });

    it("should hang the plate below the teaser when nothing else was drawn", () => {
      const sheet = personalLayoutOf(cardOf({ facts: [RIVAL_FACT] }));

      expect(sheet.plate?.top).toBe(AFTER_TEASER + FACTS_TOP_DROP + PLATE_GAP);
    });

    it("should keep the plate clear of the section label when it carries the only fact", () => {
      const sheet = personalLayoutOf(cardOf({ facts: [RIVAL_FACT] }));

      expect(sheet.facts).toHaveLength(NOTHING);
      expect(sheet.plate?.top ?? NOTHING).toBeGreaterThan(sheet.factsLabel ?? NOTHING);
    });

    it("should hang the plate below every row the sheet held", () => {
      const sheet = personalLayoutOf(cardOf({ facts: TALLEST_FACTS }));
      const lastRow = sheet.facts.at(-ONE_FACT);

      expect(sheet.plate?.top).toBe((lastRow?.top ?? NOTHING) + FACT_HEIGHT + PLATE_GAP);
    });

    it("should make the sheet shorter when there is no plate to draw", () => {
      const plated = personalLayoutOf(cardOf({ facts: [RIVAL_FACT] }));
      const without = personalLayoutOf(cardOf());

      expect(without.height).toBeLessThan(plated.height);
    });
  });

  describe("how tall the sheet ends up", () => {
    it("should leave the sheet's own bottom margin under an empty card", () => {
      expect(personalLayoutOf(cardOf()).height).toBe(AFTER_TEASER + SHEET_BOTTOM);
    });

    it("should measure an empty card at exactly the teaser plus the margin", () => {
      expect(personalLayoutOf(cardOf()).height).toBe(EMPTY_SHEET_HEIGHT);
    });

    it("should end the sheet below the plate it drew", () => {
      const sheet = personalLayoutOf(tallestCard());

      expect(sheet.height).toBe((sheet.plate?.top ?? NOTHING) + PLATE_HEIGHT + SHEET_BOTTOM);
    });

    it("should grow by exactly one fact height for each row it gained", () => {
      const one = personalLayoutOf(cardOf({ facts: plainFacts(ONE_FACT) }));
      const two = personalLayoutOf(cardOf({ facts: plainFacts(TWO_FACTS) }));

      expect(two.height - one.height).toBe(FACT_HEIGHT);
    });

    it("should count every row it placed, not only the first", () => {
      const many = personalLayoutOf(cardOf({ facts: plainFacts(MOST_ROWS) }));
      const one = personalLayoutOf(cardOf({ facts: plainFacts(ONE_FACT) }));

      expect(many.height - one.height).toBe(FACT_HEIGHT * (MOST_ROWS - ONE_FACT));
      expect(many.facts).toHaveLength(MOST_ROWS);
    });

    it("should make the empty card shorter than any card carrying a section", () => {
      const empty = personalLayoutOf(cardOf());

      expect(empty.height).toBeLessThan(personalLayoutOf(tallestCard()).height);
      expect(empty.height).toBeLessThan(personalLayoutOf(cardOf({ facts: [RIVAL_FACT] })).height);
      expect(empty.height).toBeLessThan(
        personalLayoutOf(cardOf({ facts: plainFacts(ONE_FACT) })).height
      );
      expect(empty.height).toBeLessThan(personalLayoutOf(chartedCard()).height);
    });
  });

  describe("the tallest sheet the layout can produce", () => {
    it("should draw a chart, a full set of rows and a plate all at once", () => {
      const sheet = personalLayoutOf(tallestCard());

      expect(sheet.plotTop).not.toBeNull();
      expect(sheet.facts).toHaveLength(MOST_ROWS);
      expect(sheet.plate).not.toBeNull();
    });

    it("should measure that sheet at its own stacked height", () => {
      expect(personalLayoutOf(tallestCard()).height).toBe(TALLEST_SHEET_HEIGHT);
    });

    it("should keep even that sheet inside the height Telegram will accept", () => {
      expect(personalLayoutOf(tallestCard()).height).toBeLessThanOrEqual(IMAGE_MAX_HEIGHT);
    });

    it("should grow no further however many facts the card turns up", () => {
      const every = Object.values(CareerFactName).map(factOf);
      const sheet = personalLayoutOf(chartedCard({ facts: [RIVAL_FACT, ...every] }));

      expect(sheet.height).toBe(TALLEST_SHEET_HEIGHT);
    });

    it("should be taller than the same card without its plate", () => {
      const tallest = personalLayoutOf(tallestCard());
      const unplated = personalLayoutOf(chartedCard({ facts: plainFacts(MOST_ROWS) }));

      expect(unplated.height).toBeLessThan(tallest.height);
      expect(tallest.height - unplated.height).toBe(PLATE_GAP + PLATE_HEIGHT);
    });
  });
});
