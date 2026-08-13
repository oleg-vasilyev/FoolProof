import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, LONG_ENOUGH } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";
import {
  appearanceOf,
  eveningOf,
  playerAppearing,
} from "#scoresheet/domain/session-appearances.stub.ts";


const bestBySpy = vi.fn();

const soleBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
  soleBy: (players: unknown, qualifies: unknown) => soleBySpy(players, qualifies),
}));

const foolByRoundSpy = vi.fn();

const lastRoundOfSpy = vi.fn();

const firstRoundOfSpy = vi.fn();

const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  foolByRound: (evening: unknown) => foolByRoundSpy(evening),
  lastRoundOf: (player: unknown) => lastRoundOfSpy(player),
  firstRoundOf: (player: unknown) => firstRoundOfSpy(player),
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const MOCKED_MIDDLE = 0.4;

vi.mock("#scoresheet/domain/scoring.ts", () => ({ NEUTRAL: MOCKED_MIDDLE }));

const { firstBlood, ironSeat, revolvingDoor, theCameo, theIrishGoodbye, theLatecomer } =
  await import("#scoresheet/domain/awards/attendance-awards.ts");

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const THRICE = 3;

const SEVEN = 7;

const EIGHT = 8;

const NINE = 9;

const TEN = 10;

const NINETEEN = 19;

const JUST_ABOVE_MOCKED = 0.45;

const JUST_BELOW_MOCKED = 0.35;

const PERCENT_POINTS = 100;

const A_REAL_GAP = 2;

const DIMA = 2;

const VERONIKA = 5;

const eveningFor = (players: readonly PlayerAppearances[], rounds = NINETEEN) =>
  eveningOf(rounds, players);

const SOMEBODY = playerAppearing(DIMA, [appearanceOf(NOTHING, Finish.First)]);

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

const qualifierGiven = () =>
  soleBySpy.mock.calls[NOTHING]?.[ONCE] as (player: PlayerAppearances) => boolean;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  soleBySpy.mockReturnValue(null);
  foolByRoundSpy.mockReturnValue([]);
  lastRoundOfSpy.mockReturnValue(null);
  firstRoundOfSpy.mockReturnValue(NOTHING);
  playedGamesSpy.mockReturnValue(NOTHING);
});

describe("ironSeat()", () => {
  it("should not even look for a winner in an evening shorter than ten games", () => {
    ironSeat(eveningFor([SOMEBODY], NINE));

    expect(soleBySpy).not.toHaveBeenCalled();
  });

  it("should award nothing when more than one player sat through everything", () => {
    expect(ironSeat(eveningFor([SOMEBODY], TEN))).toBeNull();
  });

  it("should report the whole evening as the games sat", () => {
    soleBySpy.mockReturnValue(SOMEBODY);
    const award = ironSeat(eveningFor([SOMEBODY], NINETEEN));

    expect(award?.name === AwardName.IronSeat ? [award.winners, award.games] : []).toEqual([
      [DIMA],
      NINETEEN,
    ]);
  });

  describe("who qualifies", () => {
    it("should accept a player who played every game of the evening", () => {
      ironSeat(eveningFor([SOMEBODY], TEN));
      playedGamesSpy.mockReturnValue(TEN);

      expect(qualifierGiven()(SOMEBODY)).toBe(true);
    });

    it("should refuse a player who missed one", () => {
      ironSeat(eveningFor([SOMEBODY], TEN));
      playedGamesSpy.mockReturnValue(NINE);

      expect(qualifierGiven()(SOMEBODY)).toBe(false);
    });
  });
});

describe("theIrishGoodbye()", () => {
  const SLIPPED_AWAY = playerAppearing(VERONIKA, [
    appearanceOf(NOTHING, Finish.First),
    appearanceOf(ONCE, Finish.Fool),
    appearanceOf(SEVEN, Finish.Middle),
  ]);

  const LEFT_BEATEN = playerAppearing(VERONIKA, [
    appearanceOf(NOTHING, Finish.First),
    appearanceOf(ONCE, Finish.Middle),
    appearanceOf(SEVEN, Finish.Fool),
  ]);

  const NEVER_SAT_DOWN = playerAppearing(DIMA, []);

  it("should award nothing when the ranking found nobody", () => {
    expect(theIrishGoodbye(eveningFor([SLIPPED_AWAY]))).toBeNull();
  });

  it("should report the game they left after, counted from one", () => {
    bestBySpy.mockReturnValue(SLIPPED_AWAY);
    lastRoundOfSpy.mockReturnValue(SEVEN);
    const award = theIrishGoodbye(eveningFor([SLIPPED_AWAY]));

    expect(award?.name === AwardName.TheIrishGoodbye ? [award.leftAfter, award.games] : []).toEqual([
      EIGHT,
      NINETEEN,
    ]);
  });

  it("should name the player who left early", () => {
    bestBySpy.mockReturnValue(SLIPPED_AWAY);
    lastRoundOfSpy.mockReturnValue(SEVEN);

    expect(theIrishGoodbye(eveningFor([SLIPPED_AWAY]))?.winners).toEqual([VERONIKA]);
  });

  describe("who is eligible", () => {
    it("should prefer whoever left earliest", () => {
      theIrishGoodbye(eveningFor([SLIPPED_AWAY]));
      lastRoundOfSpy.mockReturnValue(SEVEN);

      expect(meritGiven()(SLIPPED_AWAY)).toBe(-SEVEN);
    });

    it("should refuse somebody who was still there for the last game", () => {
      theIrishGoodbye(eveningFor([SLIPPED_AWAY]));
      lastRoundOfSpy.mockReturnValue(NINETEEN - ONCE);

      expect(meritGiven()(SLIPPED_AWAY)).toBeNull();
    });

    it("should refuse somebody whose last game left them the fool", () => {
      theIrishGoodbye(eveningFor([LEFT_BEATEN]));
      lastRoundOfSpy.mockReturnValue(SEVEN);

      expect(meritGiven()(LEFT_BEATEN)).toBeNull();
    });

    it("should refuse somebody who never played at all", () => {
      theIrishGoodbye(eveningFor([NEVER_SAT_DOWN]));
      lastRoundOfSpy.mockReturnValue(null);

      expect(meritGiven()(NEVER_SAT_DOWN)).toBeNull();
    });
  });
});

describe("revolvingDoor()", () => {
  const WENT_AND_CAME_BACK = playerAppearing(DIMA, [
    appearanceOf(NOTHING, Finish.First),
    appearanceOf(ONCE, Finish.Middle),
    appearanceOf(TEN, Finish.Middle),
  ]);

  const NEVER_LEFT = playerAppearing(DIMA, [
    appearanceOf(NOTHING, Finish.First),
    appearanceOf(ONCE, Finish.Middle),
    appearanceOf(TWICE, Finish.Middle),
  ]);

  const MISSED_ONE = playerAppearing(DIMA, [
    appearanceOf(NOTHING, Finish.First),
    appearanceOf(TWICE, Finish.Middle),
  ]);

  const MISSED_EXACTLY_TWO = playerAppearing(DIMA, [
    appearanceOf(NOTHING, Finish.First),
    appearanceOf(THRICE, Finish.Middle),
  ]);

  it("should award nothing when the ranking found nobody", () => {
    expect(revolvingDoor(eveningFor([WENT_AND_CAME_BACK]))).toBeNull();
  });

  it("should report the games missed inside their own stretch of the evening", () => {
    bestBySpy.mockReturnValue(WENT_AND_CAME_BACK);
    firstRoundOfSpy.mockReturnValue(NOTHING);
    lastRoundOfSpy.mockReturnValue(TEN);
    playedGamesSpy.mockReturnValue(THRICE);
    const award = revolvingDoor(eveningFor([WENT_AND_CAME_BACK]));

    expect(award?.name === AwardName.RevolvingDoor ? [award.missed, award.games] : []).toEqual([
      EIGHT,
      THRICE,
    ]);
  });

  it("should name the player who came back", () => {
    bestBySpy.mockReturnValue(WENT_AND_CAME_BACK);

    expect(revolvingDoor(eveningFor([WENT_AND_CAME_BACK]))?.winners).toEqual([DIMA]);
  });

  it("should report nothing missed for somebody whose stretch cannot be measured", () => {
    bestBySpy.mockReturnValue(WENT_AND_CAME_BACK);
    firstRoundOfSpy.mockReturnValue(null);
    const award = revolvingDoor(eveningFor([WENT_AND_CAME_BACK]));

    expect(award?.name === AwardName.RevolvingDoor ? award.missed : ONCE).toBe(NOTHING);
  });

  it("should report nothing missed when only the first game cannot be found", () => {
    bestBySpy.mockReturnValue(WENT_AND_CAME_BACK);
    firstRoundOfSpy.mockReturnValue(null);
    lastRoundOfSpy.mockReturnValue(TEN);
    playedGamesSpy.mockReturnValue(THRICE);
    const award = revolvingDoor(eveningFor([WENT_AND_CAME_BACK]));

    expect(award?.name === AwardName.RevolvingDoor ? award.missed : ONCE).toBe(NOTHING);
  });

  it("should report nothing missed when only the last game cannot be found", () => {
    bestBySpy.mockReturnValue(WENT_AND_CAME_BACK);
    firstRoundOfSpy.mockReturnValue(TWICE);
    lastRoundOfSpy.mockReturnValue(null);
    playedGamesSpy.mockReturnValue(THRICE);
    const award = revolvingDoor(eveningFor([WENT_AND_CAME_BACK]));

    expect(award?.name === AwardName.RevolvingDoor ? award.missed : ONCE).toBe(NOTHING);
  });

  it("should subtract the first game from the last, not add them", () => {
    bestBySpy.mockReturnValue(WENT_AND_CAME_BACK);
    firstRoundOfSpy.mockReturnValue(TWICE);
    lastRoundOfSpy.mockReturnValue(TEN);
    playedGamesSpy.mockReturnValue(THRICE);
    const award = revolvingDoor(eveningFor([WENT_AND_CAME_BACK]));

    expect(award?.name === AwardName.RevolvingDoor ? award.missed : NOTHING).toBe(
      TEN - TWICE + ONCE - THRICE
    );
  });

  describe("who is eligible", () => {
    it("should rank a player by their widest absence", () => {
      revolvingDoor(eveningFor([WENT_AND_CAME_BACK]));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

      expect(meritGiven()(WENT_AND_CAME_BACK)).toBe(EIGHT);
    });

    it("should refuse a player who never missed a game in their stretch", () => {
      revolvingDoor(eveningFor([NEVER_LEFT]));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

      expect(meritGiven()(NEVER_LEFT)).toBeNull();
    });

    it("should refuse a single missed game, which is not going home", () => {
      revolvingDoor(eveningFor([MISSED_ONE]));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

      expect(meritGiven()(MISSED_ONE)).toBeNull();
    });

    it("should accept an absence sitting exactly on the real-gap threshold", () => {
      revolvingDoor(eveningFor([MISSED_EXACTLY_TWO]));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

      expect(meritGiven()(MISSED_EXACTLY_TWO)).toBe(A_REAL_GAP);
    });

    it("should refuse a player one game short", () => {
      revolvingDoor(eveningFor([WENT_AND_CAME_BACK]));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES - ONCE);

      expect(meritGiven()(WENT_AND_CAME_BACK)).toBeNull();
    });
  });
});

describe("theLatecomer()", () => {
  const LATE = playerAppearing(VERONIKA, [appearanceOf(THRICE, Finish.First)], JUST_ABOVE_MOCKED);

  it("should award nothing when the ranking found nobody", () => {
    expect(theLatecomer(eveningFor([LATE]))).toBeNull();
  });

  it("should report the game they arrived at, counted from one", () => {
    bestBySpy.mockReturnValue(LATE);
    firstRoundOfSpy.mockReturnValue(THRICE);
    const award = theLatecomer(eveningFor([LATE]));

    expect(award?.name === AwardName.TheLatecomer ? award.joinedAt : NOTHING).toBe(THRICE + ONCE);
  });

  it("should name the player who arrived late", () => {
    bestBySpy.mockReturnValue(LATE);
    firstRoundOfSpy.mockReturnValue(THRICE);

    expect(theLatecomer(eveningFor([LATE]))?.winners).toEqual([VERONIKA]);
  });

  it("should report the share they reached as a percentage", () => {
    bestBySpy.mockReturnValue(LATE);
    firstRoundOfSpy.mockReturnValue(THRICE);
    const award = theLatecomer(eveningFor([LATE]));

    expect(award?.name === AwardName.TheLatecomer ? award.percent : NOTHING).toBe(
      Math.round(JUST_ABOVE_MOCKED * PERCENT_POINTS)
    );
  });

  describe("who is eligible", () => {
    beforeEach(() => {
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES);
      firstRoundOfSpy.mockReturnValue(THRICE);
    });

    it("should rank a late arrival by the share they reached", () => {
      theLatecomer(eveningFor([LATE]));

      expect(meritGiven()(LATE)).toBe(JUST_ABOVE_MOCKED);
    });

    it("should measure mid-table against the scoring's own neutral, not its own number", () => {
      const BELOW = playerAppearing(VERONIKA, LATE.appearances, JUST_BELOW_MOCKED);
      theLatecomer(eveningFor([BELOW]));

      expect(meritGiven()(BELOW)).toBeNull();
    });

    it("should accept a late arrival sitting exactly on mid-table", () => {
      const EXACTLY_LEVEL = playerAppearing(VERONIKA, LATE.appearances, MOCKED_MIDDLE);
      theLatecomer(eveningFor([EXACTLY_LEVEL]));

      expect(meritGiven()(EXACTLY_LEVEL)).toBe(MOCKED_MIDDLE);
    });

    it("should refuse a player one game short of enough games", () => {
      theLatecomer(eveningFor([LATE]));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES - ONCE);

      expect(meritGiven()(LATE)).toBeNull();
    });

    it("should refuse somebody who was there from the third game", () => {
      theLatecomer(eveningFor([LATE]));
      firstRoundOfSpy.mockReturnValue(THRICE - ONCE);

      expect(meritGiven()(LATE)).toBeNull();
    });

    it("should refuse somebody who never played", () => {
      theLatecomer(eveningFor([LATE]));
      firstRoundOfSpy.mockReturnValue(null);

      expect(meritGiven()(LATE)).toBeNull();
    });
  });
});

describe("theCameo()", () => {
  it("should not even look for a winner in a short evening", () => {
    theCameo(eveningFor([SOMEBODY], LONG_ENOUGH - ONCE));

    expect(soleBySpy).not.toHaveBeenCalled();
  });

  it("should report the evening the one game was lost in", () => {
    soleBySpy.mockReturnValue(SOMEBODY);
    const award = theCameo(eveningFor([SOMEBODY], NINETEEN));

    expect(award?.name === AwardName.TheCameo ? award.games : NOTHING).toBe(NINETEEN);
  });

  it("should name the player who only looked in", () => {
    soleBySpy.mockReturnValue(SOMEBODY);

    expect(theCameo(eveningFor([SOMEBODY], NINETEEN))?.winners).toEqual([DIMA]);
  });

  it("should look for a winner in an evening of exactly the long-enough length", () => {
    theCameo(eveningFor([SOMEBODY], LONG_ENOUGH));

    expect(soleBySpy).toHaveBeenCalled();
  });

  describe("who qualifies", () => {
    it("should accept a player who sat exactly one game", () => {
      theCameo(eveningFor([SOMEBODY], NINETEEN));
      playedGamesSpy.mockReturnValue(ONCE);

      expect(qualifierGiven()(SOMEBODY)).toBe(true);
    });

    it("should refuse a player who stayed for two", () => {
      theCameo(eveningFor([SOMEBODY], NINETEEN));
      playedGamesSpy.mockReturnValue(TWICE);

      expect(qualifierGiven()(SOMEBODY)).toBe(false);
    });
  });
});

describe("firstBlood()", () => {
  it("should award nothing when the first game was drawn", () => {
    foolByRoundSpy.mockReturnValue([null, DIMA]);

    expect(firstBlood(eveningFor([SOMEBODY]))).toBeNull();
  });

  it("should name the fool of the very first game, not of a later one", () => {
    foolByRoundSpy.mockReturnValue([VERONIKA, DIMA]);
    const award = firstBlood(eveningFor([SOMEBODY]));

    expect(award?.name === AwardName.FirstBlood ? [award.winners, award.games] : []).toEqual([
      [VERONIKA],
      NINETEEN,
    ]);
  });
});
