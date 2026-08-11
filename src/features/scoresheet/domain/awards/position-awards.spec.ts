import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, LONG_ENOUGH } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";
import {
  appearanceOf,
  appearingAs,
  eveningOf,
  playerAppearing,
} from "#scoresheet/domain/session-appearances.stub.ts";


const bestBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
}));

const playedGamesSpy = vi.fn();

const foolCountSpy = vi.fn();

const inTopHalfSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  playedGames: (player: unknown) => playedGamesSpy(player),
  foolCount: (player: unknown) => foolCountSpy(player),
  inTopHalf: (appearance: unknown) => inTopHalfSpy(appearance),
}));

const { allOrNothing, theAnchor, theFavourite, theInvisible, theUnderstudy, untouchable } =
  await import("#scoresheet/domain/awards/position-awards.ts");

const NOTHING = 0;

const ONCE = 1;

const TEN = 10;

const AT_THE_EDGES = 8;

const IN_THE_MIDDLE = 8;

const EIGHT_IN_TEN = 0.8;

const HALF_OF_THEM = 0.5;

const FIVE_FIRSTS = 5;

const FOUR_SECONDS = 4;

const RUNNER_UP = 2;

const ANYA = 4;

const LOPSIDED = appearingAs(
  ANYA,
  Finish.First,
  Finish.Fool,
  Finish.First,
  Finish.Fool,
  Finish.First,
  Finish.Fool,
  Finish.First,
  Finish.Fool,
  Finish.Middle,
  Finish.Middle
);

const MIDDLING = appearingAs(
  ANYA,
  Finish.Middle,
  Finish.Middle,
  Finish.Middle,
  Finish.Middle,
  Finish.Middle,
  Finish.Middle,
  Finish.Middle,
  Finish.Middle,
  Finish.First,
  Finish.Fool
);

const RUNNER_UP_ALWAYS = playerAppearing(
  ANYA,
  Array.from({ length: FOUR_SECONDS }, (_, round) =>
    appearanceOf(round, Finish.Middle, RUNNER_UP)
  )
);

const eveningFor = (player: PlayerAppearances) => eveningOf(TEN, [player]);

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  playedGamesSpy.mockReturnValue(TEN);
  foolCountSpy.mockReturnValue(NOTHING);
  inTopHalfSpy.mockReturnValue(false);
});

describe("untouchable()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(untouchable(eveningFor(LOPSIDED))).toBeNull();
  });

  it("should report the games survived", () => {
    bestBySpy.mockReturnValue(LOPSIDED);
    const award = untouchable(eveningFor(LOPSIDED));

    expect(award?.name === AwardName.Untouchable ? award.games : NOTHING).toBe(TEN);
  });

  it("should name the player who survived", () => {
    bestBySpy.mockReturnValue(LOPSIDED);

    expect(untouchable(eveningFor(LOPSIDED))?.winners).toEqual([ANYA]);
  });

  describe("who is eligible", () => {
    it("should rank a player who was never the fool by the games they sat", () => {
      untouchable(eveningFor(LOPSIDED));

      expect(meritGiven()(LOPSIDED)).toBe(TEN);
    });

    it("should refuse a player who was the fool even once", () => {
      untouchable(eveningFor(LOPSIDED));
      foolCountSpy.mockReturnValue(ONCE);

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });

    it("should still rank a player sitting exactly on the long-evening floor", () => {
      untouchable(eveningFor(LOPSIDED));
      playedGamesSpy.mockReturnValue(LONG_ENOUGH);

      expect(meritGiven()(LOPSIDED)).toBe(LONG_ENOUGH);
    });

    it("should refuse a player one game short of a long evening", () => {
      untouchable(eveningFor(LOPSIDED));
      playedGamesSpy.mockReturnValue(LONG_ENOUGH - ONCE);

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });
  });
});

describe("theFavourite()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(theFavourite(eveningFor(LOPSIDED))).toBeNull();
  });

  it("should count the games gone out first", () => {
    bestBySpy.mockReturnValue(LOPSIDED);
    const award = theFavourite(eveningFor(LOPSIDED));

    expect(award?.name === AwardName.TheFavourite ? [award.firsts, award.games] : []).toEqual([
      FOUR_SECONDS,
      TEN,
    ]);
  });

  it("should name the player the table played behind", () => {
    bestBySpy.mockReturnValue(LOPSIDED);

    expect(theFavourite(eveningFor(LOPSIDED))?.winners).toEqual([ANYA]);
  });

  describe("who is eligible", () => {
    it("should rank by the rate of going out first, not by the count", () => {
      const HALF_FIRST = appearingAs(
        ANYA,
        ...Array.from({ length: FIVE_FIRSTS }, () => Finish.First),
        ...Array.from({ length: FIVE_FIRSTS }, () => Finish.Middle)
      );
      theFavourite(eveningFor(HALF_FIRST));

      expect(meritGiven()(HALF_FIRST)).toBeCloseTo(HALF_OF_THEM);
    });

    it("should refuse a player who went out first less than half the time", () => {
      theFavourite(eveningFor(LOPSIDED));

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });

    it("should refuse a player one game short of a long evening", () => {
      theFavourite(eveningFor(MIDDLING));
      playedGamesSpy.mockReturnValue(LONG_ENOUGH - ONCE);

      expect(meritGiven()(MIDDLING)).toBeNull();
    });
  });
});

describe("theUnderstudy()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(theUnderstudy(eveningFor(RUNNER_UP_ALWAYS))).toBeNull();
  });

  it("should count the second places", () => {
    bestBySpy.mockReturnValue(RUNNER_UP_ALWAYS);
    const award = theUnderstudy(eveningFor(RUNNER_UP_ALWAYS));

    expect(award?.name === AwardName.TheUnderstudy ? award.seconds : NOTHING).toBe(FOUR_SECONDS);
  });

  it("should name the perpetual runner-up", () => {
    bestBySpy.mockReturnValue(RUNNER_UP_ALWAYS);

    expect(theUnderstudy(eveningFor(RUNNER_UP_ALWAYS))?.winners).toEqual([ANYA]);
  });

  it("should count only the games finished exactly second", () => {
    const THIRD_PLACES = playerAppearing(
      ANYA,
      Array.from({ length: FOUR_SECONDS }, (_unused, round) =>
        appearanceOf(round, Finish.Middle, RUNNER_UP + ONCE)
      )
    );
    theUnderstudy(eveningFor(THIRD_PLACES));

    expect(meritGiven()(THIRD_PLACES)).toBeNull();
  });

  describe("who is eligible", () => {
    it("should rank a perpetual runner-up by the second places", () => {
      theUnderstudy(eveningFor(RUNNER_UP_ALWAYS));

      expect(meritGiven()(RUNNER_UP_ALWAYS)).toBe(FOUR_SECONDS);
    });

    it("should refuse a player who ever went out first", () => {
      const ONE_WIN = playerAppearing(ANYA, [
        ...RUNNER_UP_ALWAYS.appearances,
        appearanceOf(FOUR_SECONDS, Finish.First),
      ]);
      theUnderstudy(eveningFor(ONE_WIN));

      expect(meritGiven()(ONE_WIN)).toBeNull();
    });

    it("should refuse a player three seconds short", () => {
      const THREE_SECONDS = playerAppearing(ANYA, RUNNER_UP_ALWAYS.appearances.slice(ONCE));
      theUnderstudy(eveningFor(THREE_SECONDS));

      expect(meritGiven()(THREE_SECONDS)).toBeNull();
    });
  });
});

describe("theAnchor()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(theAnchor(eveningFor(MIDDLING))).toBeNull();
  });

  it("should report the games spent down there", () => {
    bestBySpy.mockReturnValue(MIDDLING);
    const award = theAnchor(eveningFor(MIDDLING));

    expect(award?.name === AwardName.TheAnchor ? award.games : NOTHING).toBe(TEN);
  });

  it("should name the player who lived down there", () => {
    bestBySpy.mockReturnValue(MIDDLING);

    expect(theAnchor(eveningFor(MIDDLING))?.winners).toEqual([ANYA]);
  });

  it("should still rank a player with exactly five games", () => {
    theAnchor(eveningFor(MIDDLING));
    playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

    expect(meritGiven()(MIDDLING)).toBe(ENOUGH_GAMES);
  });

  describe("who is eligible", () => {
    it("should rank a player who never reached the top half", () => {
      theAnchor(eveningFor(MIDDLING));

      expect(meritGiven()(MIDDLING)).toBe(TEN);
    });

    it("should refuse a player who reached the top half even once", () => {
      theAnchor(eveningFor(MIDDLING));
      inTopHalfSpy.mockReturnValueOnce(true);

      expect(meritGiven()(MIDDLING)).toBeNull();
    });

    it("should refuse a player who was the fool", () => {
      theAnchor(eveningFor(MIDDLING));
      foolCountSpy.mockReturnValue(ONCE);

      expect(meritGiven()(MIDDLING)).toBeNull();
    });
  });
});

describe("allOrNothing()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(allOrNothing(eveningFor(LOPSIDED))).toBeNull();
  });

  it("should count going out first and being the fool as the two edges", () => {
    bestBySpy.mockReturnValue(LOPSIDED);
    const award = allOrNothing(eveningFor(LOPSIDED));

    expect(award?.name === AwardName.AllOrNothing ? [award.edges, award.games] : []).toEqual([
      AT_THE_EDGES,
      TEN,
    ]);
  });

  it("should name the player who lived at the edges", () => {
    bestBySpy.mockReturnValue(LOPSIDED);

    expect(allOrNothing(eveningFor(LOPSIDED))?.winners).toEqual([ANYA]);
  });

  it("should still rank a player with exactly five games", () => {
    allOrNothing(eveningFor(LOPSIDED));
    playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

    expect(meritGiven()(LOPSIDED)).not.toBeNull();
  });

  describe("who is eligible", () => {
    it("should rank a lopsided player by the rate rather than the count", () => {
      allOrNothing(eveningFor(LOPSIDED));

      expect(meritGiven()(LOPSIDED)).toBeCloseTo(EIGHT_IN_TEN);
    });

    it("should refuse a player who mostly finished in the middle", () => {
      allOrNothing(eveningFor(MIDDLING));

      expect(meritGiven()(MIDDLING)).toBeNull();
    });

    it("should refuse a player one game short", () => {
      allOrNothing(eveningFor(LOPSIDED));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES - ONCE);

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });
  });
});

describe("theInvisible()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(theInvisible(eveningFor(MIDDLING))).toBeNull();
  });

  it("should count only the games finished in the middle", () => {
    bestBySpy.mockReturnValue(MIDDLING);
    const award = theInvisible(eveningFor(MIDDLING));

    expect(award?.name === AwardName.TheInvisible ? [award.middles, award.games] : []).toEqual([
      IN_THE_MIDDLE,
      TEN,
    ]);
  });

  it("should name the player nobody noticed", () => {
    bestBySpy.mockReturnValue(MIDDLING);

    expect(theInvisible(eveningFor(MIDDLING))?.winners).toEqual([ANYA]);
  });

  describe("who is eligible", () => {
    it("should rank a quiet player by the rate rather than the count", () => {
      theInvisible(eveningFor(MIDDLING));

      expect(meritGiven()(MIDDLING)).toBeCloseTo(EIGHT_IN_TEN);
    });

    it("should refuse a player who kept finishing at the edges", () => {
      theInvisible(eveningFor(LOPSIDED));

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });

    it("should refuse a player sitting just under three quarters", () => {
      const SEVEN_IN_TEN = appearingAs(
        ANYA,
        ...Array.from({ length: AT_THE_EDGES - ONCE }, () => Finish.Middle),
        Finish.First,
        Finish.Fool,
        Finish.First
      );
      theInvisible(eveningFor(SEVEN_IN_TEN));

      expect(meritGiven()(SEVEN_IN_TEN)).toBeNull();
    });
  });
});
