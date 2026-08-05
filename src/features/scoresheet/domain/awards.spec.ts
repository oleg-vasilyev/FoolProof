import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Award } from "#scoresheet/domain/award-catalogue.ts";


const eveningOfSpy = vi.fn();

vi.mock("#scoresheet/domain/evening.ts", () => ({
  eveningOf: (chronology: unknown) => eveningOfSpy(chronology),
}));

const ruleSpies = {
  king: vi.fn(),
  untouchable: vi.fn(),
  teflon: vi.fn(),
  sweetRevenge: vi.fn(),
  ironSeat: vi.fn(),
  theTruce: vi.fn(),
  allOrNothing: vi.fn(),
  theInvisible: vi.fn(),
  theIrishGoodbye: vi.fn(),
  dealersCurse: vi.fn(),
  encore: vi.fn(),
  firstBlood: vi.fn(),
  foolOfTheNight: vi.fn(),
};

const tableCurseSpy = vi.fn();

vi.mock("#scoresheet/domain/share-awards.ts", () => ({
  kingOfTheTable: (evening: unknown) => ruleSpies.king(evening),
  foolOfTheNight: (evening: unknown) => ruleSpies.foolOfTheNight(evening),
}));

vi.mock("#scoresheet/domain/position-awards.ts", () => ({
  untouchable: (evening: unknown) => ruleSpies.untouchable(evening),
  allOrNothing: (evening: unknown) => ruleSpies.allOrNothing(evening),
  theInvisible: (evening: unknown) => ruleSpies.theInvisible(evening),
}));

vi.mock("#scoresheet/domain/streak-awards.ts", () => ({
  teflon: (evening: unknown) => ruleSpies.teflon(evening),
  sweetRevenge: (evening: unknown) => ruleSpies.sweetRevenge(evening),
  encore: (evening: unknown) => ruleSpies.encore(evening),
}));

vi.mock("#scoresheet/domain/attendance-awards.ts", () => ({
  ironSeat: (evening: unknown) => ruleSpies.ironSeat(evening),
  theTruce: (evening: unknown) => ruleSpies.theTruce(evening),
  theIrishGoodbye: (evening: unknown) => ruleSpies.theIrishGoodbye(evening),
  firstBlood: (evening: unknown) => ruleSpies.firstBlood(evening),
}));

vi.mock("#scoresheet/domain/dealer-awards.ts", () => ({
  dealersCurse: (evening: unknown) => ruleSpies.dealersCurse(evening),
  tableCurse: (evening: unknown) => tableCurseSpy(evening),
}));

const { EVENING_MINIMUM, honoursFor } = await import("#scoresheet/domain/awards.ts");

const NOTHING = 0;

const ONCE = 1;

const MOST_AWARDS = 9;

const ROMANI = 6;

const OLEG = 3;

const SOME_EVENING = { rounds: NOTHING, players: [], starters: [] };

const CURSE = { burns: ONCE, games: EVENING_MINIMUM };

const awardOf = (name: Award["name"], winner = OLEG): Award =>
  ({ name, winners: [winner], games: NOTHING, percent: NOTHING }) as Award;

const chronologyOf = (games: number) => ({
  startedOn: "2026-07-31",
  players: [],
  games: Array.from({ length: games }, (_unused, index) => ({
    gameId: index,
    starterId: null,
    placements: [],
  })),
});

const ENOUGH = chronologyOf(EVENING_MINIMUM);

const everyRuleFires = (): void => {
  for (const [name, spy] of Object.entries(ruleSpies)) {
    spy.mockReturnValue(awardOf(name as Award["name"]));
  }
};

const namesOf = (games = ENOUGH): readonly string[] =>
  honoursFor(games)?.awards.map((award) => award.name) ?? [];

beforeEach(() => {
  vi.clearAllMocks();

  eveningOfSpy.mockReturnValue(SOME_EVENING);
  tableCurseSpy.mockReturnValue(null);

  for (const spy of Object.values(ruleSpies)) {
    spy.mockReturnValue(null);
  }
});

describe("honoursFor()", () => {
  it("should refuse an evening one game short", () => {
    expect(honoursFor(chronologyOf(EVENING_MINIMUM - ONCE))).toBeNull();
  });

  it("should accept an evening of exactly five games", () => {
    expect(honoursFor(ENOUGH)).not.toBeNull();
  });

  it("should read the evening out of the chronology once", () => {
    honoursFor(ENOUGH);

    expect(eveningOfSpy).toHaveBeenCalledWith(ENOUGH);
    expect(eveningOfSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should judge every rule against that same evening", () => {
    honoursFor(ENOUGH);

    for (const spy of Object.values(ruleSpies)) {
      expect(spy).toHaveBeenCalledWith(SOME_EVENING);
    }
  });

  it("should leave out the rules that did not fire", () => {
    ruleSpies.teflon.mockReturnValue(awardOf("teflon"));

    expect(namesOf()).toEqual(["teflon"]);
  });

  it("should print the awards from glory to disgrace", () => {
    ruleSpies.dealersCurse.mockReturnValue(awardOf("dealersCurse"));
    ruleSpies.king.mockReturnValue(awardOf("king"));
    ruleSpies.ironSeat.mockReturnValue(awardOf("ironSeat"));

    expect(namesOf()).toEqual(["king", "ironSeat", "dealersCurse"]);
  });

  it("should keep the fool of the night last, however early it was judged", () => {
    ruleSpies.foolOfTheNight.mockReturnValue(awardOf("foolOfTheNight", ROMANI));
    ruleSpies.king.mockReturnValue(awardOf("king"));

    expect(namesOf()).toEqual(["king", "foolOfTheNight"]);
  });

  it("should hand over the table's own fact alongside the awards", () => {
    tableCurseSpy.mockReturnValue(CURSE);

    expect(honoursFor(ENOUGH)?.curse).toBe(CURSE);
  });

  describe("when more rules fire than fit on the card", () => {
    it("should print no more than nine", () => {
      everyRuleFires();

      expect(namesOf()).toHaveLength(MOST_AWARDS);
    });

    it("should keep the fool of the night even when the card is full", () => {
      everyRuleFires();

      expect(namesOf().at(-ONCE)).toBe("foolOfTheNight");
    });

    it("should drop the tail of the catalogue rather than the head", () => {
      everyRuleFires();

      expect(namesOf()).toEqual([
        "king",
        "untouchable",
        "teflon",
        "sweetRevenge",
        "ironSeat",
        "theTruce",
        "allOrNothing",
        "theInvisible",
        "foolOfTheNight",
      ]);
    });

    it("should still print nine when there is no fool of the night to pin", () => {
      everyRuleFires();
      ruleSpies.foolOfTheNight.mockReturnValue(null);

      expect(namesOf()).toHaveLength(MOST_AWARDS);
    });
  });

  describe("first blood", () => {
    it("should be dropped when it would name the fool of the night twice", () => {
      ruleSpies.firstBlood.mockReturnValue(awardOf("firstBlood", ROMANI));
      ruleSpies.foolOfTheNight.mockReturnValue(awardOf("foolOfTheNight", ROMANI));

      expect(namesOf()).toEqual(["foolOfTheNight"]);
    });

    it("should stay when somebody else opened the evening badly", () => {
      ruleSpies.firstBlood.mockReturnValue(awardOf("firstBlood", OLEG));
      ruleSpies.foolOfTheNight.mockReturnValue(awardOf("foolOfTheNight", ROMANI));

      expect(namesOf()).toEqual(["firstBlood", "foolOfTheNight"]);
    });

    it("should stay when nobody was fool of the night at all", () => {
      ruleSpies.firstBlood.mockReturnValue(awardOf("firstBlood", ROMANI));

      expect(namesOf()).toEqual(["firstBlood"]);
    });
  });
});
