import { beforeEach, describe, expect, it, vi } from "vitest";
import { PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import {
  FACT_HEIGHT,
  FACT_HOLDER_DROP,
  FACT_INDEX_INDENT,
  FACT_REASON_DROP,
  FACT_SPINE_INSET,
  FACT_SPINE_WIDTH,
  FACT_TEXT_INDENT,
  FACT_TITLE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { FactName, type PlacedFact } from "#scoresheet/render/personal/personal-layout.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";


const rectSpy = vi.fn();

const textSpy = vi.fn();

const percentLabelSpy = vi.fn();

const gameTallySpy = vi.fn();

const sessionDateSpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

vi.mock("#scoresheet/render/percent-label.ts", () => ({
  percentLabel: (share: number) => percentLabelSpy(share),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

vi.mock("#scoresheet/render/session-date.ts", () => ({
  sessionDate: (table: unknown, isoDate: string) => sessionDateSpy(table, isoDate),
}));

const { factRows } = await import("#scoresheet/render/personal/fact-rows.ts");

const NEVER = 0;

const ONCE = 1;

const LINES_IN_A_ROW = 4;

const A_NIGHT = 3;

const NO_FOOLS = 0;

const TOP = 1000;

const NEXT_TOP = 2000;

const INK = "player-ink";

const BEST_SERIES = 1;

const WORST_SERIES = 2;

const BEST_GAMES = 7;

const WORST_GAMES = 5;

const STREAK_GAMES = 9;

const BEST_SHARE = 0.8;

const WORST_SHARE = 0.2;

const BEST_DATE = "2026-03-01";

const WORST_DATE = "2026-04-02";

const STREAK_FROM = "2026-05-03";

const STREAK_UNTIL = "2026-06-04";

const TENTH_PLACE = 10;

const CARD = {
  best: {
    seriesNo: BEST_SERIES,
    playedOn: BEST_DATE,
    games: BEST_GAMES,
    fools: NO_FOOLS,
    share: BEST_SHARE,
  },
  worst: {
    seriesNo: WORST_SERIES,
    playedOn: WORST_DATE,
    games: WORST_GAMES,
    fools: A_NIGHT,
    share: WORST_SHARE,
  },
  streak: { games: STREAK_GAMES, from: STREAK_FROM, until: STREAK_UNTIL },
} as unknown as CareerCard;

const cardWithout = (missing: FactName): CareerCard =>
  ({ ...CARD, [missing]: null }) as unknown as CareerCard;

const placed = (name: FactName, top = TOP): PlacedFact => ({ name, top });

const pct = (share: number): string => `pct(${String(share)})`;

const games = (count: number): string => `games(${String(count)})`;

const dated = (isoDate: string): string => `dated(${isoDate})`;

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

const TITLES: Readonly<Record<FactName, string>> = {
  [FactName.Best]: copy.factBest,
  [FactName.Worst]: copy.factWorst,
  [FactName.Streak]: copy.factStreak,
};

describe("factRows()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    percentLabelSpy.mockImplementation((share: number) => pct(share));
    gameTallySpy.mockImplementation((_table: unknown, count: number) => games(count));
    sessionDateSpy.mockImplementation((_table: unknown, isoDate: string) => dated(isoDate));
    rectSpy.mockImplementation(() => "<spine/>");
    textSpy.mockImplementation((value: string) => `<text:${value}>`);
  });

  describe("the catalogue of facts a sheet can hold", () => {
    it("should have a title for every fact the layout can place", () => {
      expect(Object.keys(TITLES).sort()).toEqual([...Object.values(FactName)].sort());
    });

    it("should title each fact from its own copy key", () => {
      for (const name of Object.values(FactName)) {
        vi.clearAllMocks();
        textSpy.mockImplementation((value: string) => `<text:${value}>`);

        factRows(copy, CARD, [placed(name)], INK);

        expect(textSpy).toHaveBeenCalledWith(TITLES[name], expect.anything());
      }
    });

    it("should give every fact a different title", () => {
      expect(new Set(Object.values(TITLES)).size).toBe(Object.values(FactName).length);
    });

    it("should draw a spine and four lines for whichever fact it is given", () => {
      for (const name of Object.values(FactName)) {
        expect(factRows(copy, CARD, [placed(name)], INK)).toHaveLength(LINES_IN_A_ROW + ONCE);
      }
    });
  });

  describe("a fact the card cannot tell", () => {
    it("should draw nothing for a best evening the card does not have", () => {
      expect(factRows(copy, cardWithout(FactName.Best), [placed(FactName.Best)], INK)).toEqual([]);
    });

    it("should draw nothing for a worst evening the card does not have", () => {
      expect(factRows(copy, cardWithout(FactName.Worst), [placed(FactName.Worst)], INK)).toEqual([]);
    });

    it("should draw nothing for a streak the card does not have", () => {
      expect(factRows(copy, cardWithout(FactName.Streak), [placed(FactName.Streak)], INK)).toEqual(
        []
      );
    });

    it("should still draw the facts around the one it skipped", () => {
      const drawn = factRows(
        copy,
        cardWithout(FactName.Worst),
        [placed(FactName.Worst), placed(FactName.Streak, NEXT_TOP)],
        INK
      );

      expect(drawn).toHaveLength(LINES_IN_A_ROW + ONCE);
      expect(textSpy).toHaveBeenCalledWith(copy.factStreak, expect.anything());
    });

    it("should draw nothing at all when the sheet placed no facts", () => {
      expect(factRows(copy, CARD, [], INK)).toEqual([]);
      expect(rectSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("the best evening", () => {
    it("should hold the evening's own date, run through the date table", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(sessionDateSpy).toHaveBeenCalledWith(copy, BEST_DATE);
      expect(textSpy).toHaveBeenCalledWith(dated(BEST_DATE), expect.anything());
    });

    it("should give the reason as that evening's games and share", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(gameTallySpy).toHaveBeenCalledWith(copy, BEST_GAMES);
      expect(percentLabelSpy).toHaveBeenCalledWith(BEST_SHARE);
      expect(textSpy).toHaveBeenCalledWith(
        copy.bestReason(games(BEST_GAMES), pct(BEST_SHARE)),
        expect.anything()
      );
    });

    it("should take the ink it was handed", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(attributesOf(dated(BEST_DATE)).fill).toBe(INK);
      expect(rectSpy).toHaveBeenCalledWith(expect.objectContaining({ fill: INK }));
    });
  });

  describe("the worst evening", () => {
    it("should hold the evening's own date and its own reason", () => {
      factRows(copy, CARD, [placed(FactName.Worst)], INK);

      expect(sessionDateSpy).toHaveBeenCalledWith(copy, WORST_DATE);
      expect(textSpy).toHaveBeenCalledWith(
        copy.worstReason(games(WORST_GAMES), pct(WORST_SHARE)),
        expect.anything()
      );
    });

    it("should be drawn in the fool's red rather than the ink it was handed", () => {
      factRows(copy, CARD, [placed(FactName.Worst)], INK);

      expect(attributesOf(dated(WORST_DATE)).fill).toBe(palette.cellFool);
      expect(attributesOf(dated(WORST_DATE)).fill).not.toBe(INK);
      expect(rectSpy).toHaveBeenCalledWith(expect.objectContaining({ fill: palette.cellFool }));
    });
  });

  describe("the clean streak", () => {
    it("should hold the run's own length rather than a date", () => {
      factRows(copy, CARD, [placed(FactName.Streak)], INK);

      expect(gameTallySpy).toHaveBeenCalledWith(copy, STREAK_GAMES);
      expect(textSpy).toHaveBeenCalledWith(copy.streakHolder(games(STREAK_GAMES)), expect.anything());
    });

    it("should give the reason as the two ends of the run", () => {
      factRows(copy, CARD, [placed(FactName.Streak)], INK);

      expect(sessionDateSpy).toHaveBeenCalledWith(copy, STREAK_FROM);
      expect(sessionDateSpy).toHaveBeenCalledWith(copy, STREAK_UNTIL);
      expect(textSpy).toHaveBeenCalledWith(
        copy.streakReason(dated(STREAK_FROM), dated(STREAK_UNTIL)),
        expect.anything()
      );
    });

    it("should take the ink it was handed", () => {
      factRows(copy, CARD, [placed(FactName.Streak)], INK);

      expect(attributesOf(copy.streakHolder(games(STREAK_GAMES))).fill).toBe(INK);
    });
  });

  describe("numbering the rows", () => {
    it("should count the rows from one, not from zero", () => {
      factRows(copy, CARD, [placed(FactName.Best), placed(FactName.Worst, NEXT_TOP)], INK);

      expect(textSpy).toHaveBeenCalledWith("01", expect.anything());
      expect(textSpy).toHaveBeenCalledWith("02", expect.anything());
    });

    it("should pad a single digit to two places", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(textSpy).toHaveBeenCalledWith("01", expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith("1", expect.anything());
    });

    it("should leave a two-digit place unpadded", () => {
      const facts = Array.from({ length: TENTH_PLACE }, () => placed(FactName.Best));

      factRows(copy, CARD, facts, INK);

      expect(textSpy).toHaveBeenCalledWith(String(TENTH_PLACE), expect.anything());
    });

    it("should count the place among the facts placed, not among the ones drawn", () => {
      factRows(
        copy,
        cardWithout(FactName.Best),
        [placed(FactName.Best), placed(FactName.Worst, NEXT_TOP)],
        INK
      );

      expect(textSpy).toHaveBeenCalledWith("02", expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith("01", expect.anything());
    });
  });

  describe("where a row's four lines sit", () => {
    it("should stand the spine at the left margin, inset from both ends of the row", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          x: PAD,
          y: TOP + FACT_SPINE_INSET,
          width: FACT_SPINE_WIDTH,
          height: FACT_HEIGHT - FACT_SPINE_INSET - FACT_SPINE_INSET,
        })
      );
    });

    it("should set the place between the spine and the title", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(attributesOf("01").x).toBe(PAD + FACT_INDEX_INDENT);
      expect(attributesOf("01").x as number).toBeLessThan(attributesOf(copy.factBest).x as number);
    });

    it("should share one baseline between the place and the title", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(attributesOf(copy.factBest).y).toBe(TOP + FACT_TITLE_DROP);
      expect(attributesOf("01").y).toBe(TOP + FACT_TITLE_DROP);
    });

    it("should stack the holder and the reason under the title", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(attributesOf(dated(BEST_DATE)).y).toBe(TOP + FACT_HOLDER_DROP);
      expect(
        attributesOf(copy.bestReason(games(BEST_GAMES), pct(BEST_SHARE))).y
      ).toBe(TOP + FACT_REASON_DROP);
    });

    it("should indent the title, the holder and the reason to the same text edge", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      for (const value of [
        copy.factBest,
        dated(BEST_DATE),
        copy.bestReason(games(BEST_GAMES), pct(BEST_SHARE)),
      ]) {
        expect(attributesOf(value).x).toBe(PAD + FACT_TEXT_INDENT);
      }
    });

    it("should draw a second row against its own top, not the first one's", () => {
      factRows(copy, CARD, [placed(FactName.Best), placed(FactName.Worst, NEXT_TOP)], INK);

      expect(attributesOf(copy.factWorst).y).toBe(NEXT_TOP + FACT_TITLE_DROP);
    });
  });

  describe("how a row is set", () => {
    it("should set the title bold, largest, in the card's plain ink", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(attributesOf(copy.factBest)["font-weight"]).toBe("bold");
      expect(attributesOf(copy.factBest)["font-size"]).toBe(personalFont.factTitle);
      expect(attributesOf(copy.factBest).fill).toBe(palette.ink);
    });

    it("should set the holder bold and smaller than the title", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(attributesOf(dated(BEST_DATE))["font-weight"]).toBe("bold");
      expect(attributesOf(dated(BEST_DATE))["font-size"]).toBe(personalFont.factHolder);
    });

    it("should set the reason muted and unbolded", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);
      const reason = copy.bestReason(games(BEST_GAMES), pct(BEST_SHARE));

      expect(attributesOf(reason).fill).toBe(palette.inkMuted);
      expect(attributesOf(reason)["font-size"]).toBe(personalFont.factReason);
      expect(attributesOf(reason)["font-weight"]).toBeUndefined();
    });

    it("should set the place in the figure ink, apart from the title beside it", () => {
      factRows(copy, CARD, [placed(FactName.Best)], INK);

      expect(attributesOf("01").fill).toBe(palette.inkFigure);
      expect(attributesOf("01")["font-size"]).toBe(personalFont.factIndex);
    });
  });
});
