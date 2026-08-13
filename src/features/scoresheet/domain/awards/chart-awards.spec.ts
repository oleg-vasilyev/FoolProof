import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, LONG_ENOUGH } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";
import { appearanceOf, eveningOf, playerAppearing } from "#scoresheet/domain/session-appearances.stub.ts";


const bestBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
}));

const firstRoundOfSpy = vi.fn();

const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  firstRoundOf: (player: unknown) => firstRoundOfSpy(player),
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const MOCKED_MIDDLE = 0.4;

vi.mock("#scoresheet/domain/scoring.ts", () => ({ NEUTRAL: MOCKED_MIDDLE }));

const { falseDawn, theComeback, theFlatline, theRollercoaster, wireToWire } = await import(
  "#scoresheet/domain/awards/chart-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWELVE = 12;

const MIDPOINT = 6;

const LED_ALL_EVENING = 10;

const CHART_EVENING = 8;

const BIG_SWING = 0.6;

const FLAT_BAND = 0.06;

const OLEG = 3;

const ANYA = 4;

const HIGH_SHARE = 0.9;

const LOW_SHARE = 0.2;

const JUST_ABOVE_MOCKED = 0.45;

const JUST_BELOW_MOCKED = 0.35;

const SWING_IN_POINTS = 70;

const BAND_IN_POINTS = 2;

const PERCENT_POINTS = 100;

const SANK_IN_POINTS = 20;

const BACK_IN_POINTS = 45;

const A_FLAT_CURVE = 0.42;

const A_FLATTER_STEP = 0.41;

const A_STEP_PAST = 0.01;

const MID_SHARE = 0.5;

const HIGHER_STILL = 0.95;

const EVEN_LOWER_SHARE = 0.1;

const VERONIKA = 5;

const DIMA = 2;

const curveOf = (value: number): readonly number[] => Array.from({ length: TWELVE }, () => value);

const leader = playerAppearing(OLEG, [appearanceOf(NOTHING, Finish.First)], HIGH_SHARE, [
  LOW_SHARE,
  ...curveOf(HIGH_SHARE).slice(ONCE),
]);

const trailer = playerAppearing(ANYA, [appearanceOf(NOTHING, Finish.Fool)], LOW_SHARE, [
  HIGH_SHARE,
  ...curveOf(LOW_SHARE).slice(ONCE),
]);

const eveningFor = (players: readonly PlayerAppearances[], rounds = TWELVE) =>
  eveningOf(rounds, players);

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  firstRoundOfSpy.mockReturnValue(NOTHING);
  playedGamesSpy.mockReturnValue(TWELVE);
});

describe("wireToWire()", () => {
  it("should not even look for a winner in an evening shorter than ten games", () => {
    wireToWire(eveningFor([leader], LED_ALL_EVENING - ONCE));

    expect(bestBySpy).not.toHaveBeenCalled();
  });

  it("should report the games spent in front", () => {
    bestBySpy.mockReturnValue(leader);
    const award = wireToWire(eveningFor([leader, trailer]));

    expect(award?.name === AwardName.WireToWire ? award.games : NOTHING).toBe(TWELVE);
  });

  it("should award nothing when the ranking found nobody", () => {
    expect(wireToWire(eveningFor([leader, trailer]))).toBeNull();
  });

  it("should look for a winner in an evening of exactly ten games", () => {
    wireToWire(eveningFor([leader, trailer], LED_ALL_EVENING));

    expect(bestBySpy).toHaveBeenCalled();
  });

  it("should still rank a player with exactly a long evening behind them", () => {
    wireToWire(eveningFor([leader, trailer]));
    playedGamesSpy.mockReturnValue(LONG_ENOUGH);

    expect(meritGiven()(leader)).toBe(LONG_ENOUGH);
  });

  it("should name the player who was never headed", () => {
    bestBySpy.mockReturnValue(leader);

    expect(wireToWire(eveningFor([leader, trailer]))?.winners).toEqual([OLEG]);
  });

  describe("who is eligible", () => {
    it("should rank a player who was never headed after the opening game", () => {
      wireToWire(eveningFor([leader, trailer]));

      expect(meritGiven()(leader)).toBe(TWELVE);
    });

    it("should forgive being behind in the opening game, where everyone starts level", () => {
      wireToWire(eveningFor([leader, trailer]));

      expect(meritGiven()(leader)).not.toBeNull();
    });

    it("should refuse a player who was headed at any later game", () => {
      wireToWire(eveningFor([leader, trailer]));

      expect(meritGiven()(trailer)).toBeNull();
    });

    it("should refuse a player one game short of a long evening", () => {
      wireToWire(eveningFor([leader, trailer]));
      playedGamesSpy.mockReturnValue(LONG_ENOUGH - ONCE);

      expect(meritGiven()(leader)).toBeNull();
    });

    it("should check the second game itself, not skip straight past it", () => {
      const rival = playerAppearing(DIMA, [], NOTHING, curveOf(MID_SHARE));
      const headedAtSecondGame = playerAppearing(OLEG, [], HIGH_SHARE, [
        HIGH_SHARE,
        LOW_SHARE,
        ...curveOf(HIGH_SHARE).slice(ONCE).slice(ONCE),
      ]);
      wireToWire(eveningFor([headedAtSecondGame, rival]));

      expect(meritGiven()(headedAtSecondGame)).toBeNull();
    });

    it("should still credit a tie for the lead", () => {
      const tiedAtSecondGame = playerAppearing(OLEG, [], HIGH_SHARE, [
        HIGH_SHARE,
        MID_SHARE,
        ...curveOf(HIGH_SHARE).slice(ONCE).slice(ONCE),
      ]);
      const rival = playerAppearing(DIMA, [], NOTHING, [
        LOW_SHARE,
        MID_SHARE,
        ...curveOf(LOW_SHARE).slice(ONCE).slice(ONCE),
      ]);
      wireToWire(eveningFor([tiedAtSecondGame, rival]));

      expect(meritGiven()(tiedAtSecondGame)).not.toBeNull();
    });
  });
});

describe("theRollercoaster()", () => {
  const swinging = playerAppearing(OLEG, [appearanceOf(NOTHING, Finish.First)], HIGH_SHARE, [
    LOW_SHARE,
    ...curveOf(HIGH_SHARE).slice(ONCE),
  ]);

  it("should not even look for a winner in a short evening", () => {
    theRollercoaster(eveningFor([swinging], CHART_EVENING - ONCE));

    expect(bestBySpy).not.toHaveBeenCalled();
  });

  it("should report the swing in points of table share", () => {
    bestBySpy.mockReturnValue(swinging);
    const award = theRollercoaster(eveningFor([swinging]));

    expect(award?.name === AwardName.TheRollercoaster ? award.swing : NOTHING).toBe(
      SWING_IN_POINTS
    );
  });

  it("should award nothing when the ranking found nobody", () => {
    expect(theRollercoaster(eveningFor([swinging]))).toBeNull();
  });

  it("should look for a winner in an evening of exactly eight games", () => {
    theRollercoaster(eveningFor([swinging], CHART_EVENING));

    expect(bestBySpy).toHaveBeenCalled();
  });

  it("should still rank a player with exactly five games", () => {
    theRollercoaster(eveningFor([swinging]));
    playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

    expect(meritGiven()(swinging)).not.toBeNull();
  });

  it("should name the player who was thrown around", () => {
    bestBySpy.mockReturnValue(swinging);

    expect(theRollercoaster(eveningFor([swinging]))?.winners).toEqual([OLEG]);
  });

  describe("who is eligible", () => {
    it("should rank a player by the width of their swing", () => {
      theRollercoaster(eveningFor([swinging]));

      expect(meritGiven()(swinging)).toBeCloseTo(HIGH_SHARE - LOW_SHARE);
    });

    it("should refuse a player whose line barely moved", () => {
      const steady = playerAppearing(OLEG, [], HIGH_SHARE, curveOf(HIGH_SHARE));
      theRollercoaster(eveningFor([steady]));

      expect(meritGiven()(steady)).toBeNull();
    });

    it("should measure only from the game the player arrived at", () => {
      firstRoundOfSpy.mockReturnValue(ONCE);
      theRollercoaster(eveningFor([swinging]));

      expect(meritGiven()(swinging)).toBeNull();
    });

    it("should refuse a player whose arrival could not be found, rather than reading their whole line", () => {
      firstRoundOfSpy.mockReturnValue(null);
      theRollercoaster(eveningFor([swinging]));

      expect(meritGiven()(swinging)).toBeNull();
    });

    it("should refuse a player one game short", () => {
      theRollercoaster(eveningFor([swinging]));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES - ONCE);

      expect(meritGiven()(swinging)).toBeNull();
    });

    it("should count a swing sitting exactly on the threshold", () => {
      const exactly = playerAppearing(OLEG, [], HIGH_SHARE, [
        HIGH_SHARE - BIG_SWING,
        ...curveOf(HIGH_SHARE).slice(ONCE),
      ]);
      theRollercoaster(eveningFor([exactly]));

      expect(meritGiven()(exactly)).toBeCloseTo(BIG_SWING);
    });
  });
});

describe("theComeback()", () => {
  const sank = playerAppearing(OLEG, [], JUST_ABOVE_MOCKED, curveOf(LOW_SHARE));

  const stayedUp = playerAppearing(ANYA, [], HIGH_SHARE, curveOf(HIGH_SHARE));

  it("should not even look for a winner in a short evening", () => {
    theComeback(eveningFor([sank], CHART_EVENING - ONCE));

    expect(bestBySpy).not.toHaveBeenCalled();
  });

  it("should report where they sank to and where they are now", () => {
    bestBySpy.mockReturnValue(sank);
    const award = theComeback(eveningFor([sank, stayedUp]));

    expect(award?.name === AwardName.TheComeback ? [award.sank, award.percent] : []).toEqual([
      SANK_IN_POINTS,
      BACK_IN_POINTS,
    ]);
  });

  it("should award nothing when the ranking found nobody", () => {
    expect(theComeback(eveningFor([sank, stayedUp]))).toBeNull();
  });

  it("should look for a winner in an evening of exactly eight games", () => {
    theComeback(eveningFor([sank, stayedUp], CHART_EVENING));

    expect(bestBySpy).toHaveBeenCalled();
  });

  it("should accept a player sitting exactly on mid-table", () => {
    const LEVEL = playerAppearing(OLEG, [], MOCKED_MIDDLE, curveOf(LOW_SHARE));
    theComeback(eveningFor([LEVEL, stayedUp]));

    expect(meritGiven()(LEVEL)).toBe(MOCKED_MIDDLE);
  });

  it("should still rank a player with exactly five games", () => {
    theComeback(eveningFor([sank, stayedUp]));
    playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

    expect(meritGiven()(sank)).not.toBeNull();
  });

  it("should refuse a player one game short", () => {
    theComeback(eveningFor([sank, stayedUp]));
    playedGamesSpy.mockReturnValue(ENOUGH_GAMES - ONCE);

    expect(meritGiven()(sank)).toBeNull();
  });

  it("should name the player who climbed back", () => {
    bestBySpy.mockReturnValue(sank);

    expect(theComeback(eveningFor([sank, stayedUp]))?.winners).toEqual([OLEG]);
  });

  describe("who is eligible", () => {
    it("should rank the player who was lowest at the halfway mark", () => {
      theComeback(eveningFor([sank, stayedUp]));

      expect(meritGiven()(sank)).toBe(JUST_ABOVE_MOCKED);
    });

    it("should refuse a player who was not the lowest at the halfway mark", () => {
      theComeback(eveningFor([sank, stayedUp]));

      expect(meritGiven()(stayedUp)).toBeNull();
    });

    it("should measure mid-table against the scoring's own neutral", () => {
      const barelyBack = playerAppearing(OLEG, [], JUST_BELOW_MOCKED, curveOf(LOW_SHARE));
      theComeback(eveningFor([barelyBack, stayedUp]));

      expect(meritGiven()(barelyBack)).toBeNull();
    });

    it("should refuse a player who had not sat down by the halfway mark", () => {
      firstRoundOfSpy.mockReturnValue(MIDPOINT + ONCE);
      theComeback(eveningFor([sank, stayedUp]));

      expect(meritGiven()(sank)).toBeNull();
    });

    it("should refuse a player who was never below mid-table, lowest or not", () => {
      const NEVER_FELL = playerAppearing(OLEG, [], HIGH_SHARE, curveOf(JUST_ABOVE_MOCKED));
      theComeback(eveningFor([NEVER_FELL, stayedUp]));

      expect(meritGiven()(NEVER_FELL)).toBeNull();
    });

    it("should refuse a lead that sank to mid-table exactly, which is no fall", () => {
      const LEVEL_AT_MIDPOINT = playerAppearing(OLEG, [], HIGH_SHARE, curveOf(MOCKED_MIDDLE));
      theComeback(eveningFor([LEVEL_AT_MIDPOINT, stayedUp]));

      expect(meritGiven()(LEVEL_AT_MIDPOINT)).toBeNull();
    });

    it("should refuse a player who never sat down at all", () => {
      firstRoundOfSpy.mockReturnValue(null);
      theComeback(eveningFor([sank, stayedUp]));

      expect(meritGiven()(sank)).toBeNull();
    });

    it("should accept a player who sat down exactly at the halfway mark", () => {
      firstRoundOfSpy.mockReturnValue(MIDPOINT);
      theComeback(eveningFor([sank, stayedUp]));

      expect(meritGiven()(sank)).not.toBeNull();
    });

    it("should refuse a player who sank lowest only compared to some, not all, of the table", () => {
      const evenLower = playerAppearing(DIMA, [], EVEN_LOWER_SHARE, curveOf(EVEN_LOWER_SHARE));
      theComeback(eveningFor([sank, stayedUp, evenLower]));

      expect(meritGiven()(sank)).toBeNull();
    });

    it("should not let an unseated rival with a low share count against them", () => {
      const notYetSeated = playerAppearing(VERONIKA, [], EVEN_LOWER_SHARE, curveOf(EVEN_LOWER_SHARE));
      firstRoundOfSpy.mockImplementation((player: PlayerAppearances) =>
        player.playerId === VERONIKA ? MIDPOINT + ONCE : NOTHING
      );
      theComeback(eveningFor([sank, stayedUp, notYetSeated]));

      expect(meritGiven()(sank)).not.toBeNull();
    });

    it("should accept a tie at the bottom, not just a player strictly lowest", () => {
      const tiedAtBottom = playerAppearing(VERONIKA, [], LOW_SHARE, curveOf(LOW_SHARE));
      theComeback(eveningFor([sank, tiedAtBottom]));

      expect(meritGiven()(sank)).not.toBeNull();
    });
  });
});

describe("falseDawn()", () => {
  const faded = playerAppearing(OLEG, [], JUST_BELOW_MOCKED, curveOf(HIGH_SHARE));

  const behind = playerAppearing(ANYA, [], LOW_SHARE, curveOf(LOW_SHARE));

  it("should report the game they were leading at, counted from one", () => {
    bestBySpy.mockReturnValue(faded);
    const award = falseDawn(eveningFor([faded, behind]));

    expect(award?.name === AwardName.FalseDawn ? award.ledAt : NOTHING).toBe(MIDPOINT + ONCE);
  });

  it("should award nothing when the ranking found nobody", () => {
    expect(falseDawn(eveningFor([faded, behind]))).toBeNull();
  });

  it("should not even look for a winner in a short evening", () => {
    falseDawn(eveningFor([faded, behind], CHART_EVENING - ONCE));

    expect(bestBySpy).not.toHaveBeenCalled();
  });

  it("should look for a winner in an evening of exactly eight games", () => {
    falseDawn(eveningFor([faded, behind], CHART_EVENING));

    expect(bestBySpy).toHaveBeenCalled();
  });

  it("should refuse a player sitting exactly on mid-table, which is not a fall", () => {
    const LEVEL = playerAppearing(OLEG, [], MOCKED_MIDDLE, curveOf(HIGH_SHARE));
    falseDawn(eveningFor([LEVEL, behind]));

    expect(meritGiven()(LEVEL)).toBeNull();
  });

  it("should still rank a player with exactly five games", () => {
    falseDawn(eveningFor([faded, behind]));
    playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

    expect(meritGiven()(faded)).not.toBeNull();
  });

  it("should name the player whose lead did not hold", () => {
    bestBySpy.mockReturnValue(faded);

    expect(falseDawn(eveningFor([faded, behind]))?.winners).toEqual([OLEG]);
  });

  it("should report where they stand now, not where they led from", () => {
    bestBySpy.mockReturnValue(faded);
    const award = falseDawn(eveningFor([faded, behind]));

    expect(award?.name === AwardName.FalseDawn ? award.percent : NOTHING).toBe(
      Math.round(JUST_BELOW_MOCKED * PERCENT_POINTS)
    );
  });

  describe("who is eligible", () => {
    it("should rank by how far they fell below mid-table", () => {
      falseDawn(eveningFor([faded, behind]));

      expect(meritGiven()(faded)).toBeCloseTo(MOCKED_MIDDLE - JUST_BELOW_MOCKED);
    });

    it("should refuse a player who is still above mid-table", () => {
      const held = playerAppearing(OLEG, [], JUST_ABOVE_MOCKED, curveOf(HIGH_SHARE));
      falseDawn(eveningFor([held, behind]));

      expect(meritGiven()(held)).toBeNull();
    });

    it("should refuse a player who was not leading at the halfway mark", () => {
      falseDawn(eveningFor([faded, behind]));

      expect(meritGiven()(behind)).toBeNull();
    });

    it("should refuse a lead that was never above mid-table, which is no dawn", () => {
      const LOW_LEAD = playerAppearing(OLEG, [], JUST_BELOW_MOCKED, curveOf(JUST_BELOW_MOCKED));
      falseDawn(eveningFor([LOW_LEAD, behind]));

      expect(meritGiven()(LOW_LEAD)).toBeNull();
    });

    it("should refuse a player one game short", () => {
      falseDawn(eveningFor([faded, behind]));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES - ONCE);

      expect(meritGiven()(faded)).toBeNull();
    });

    it("should refuse a lead that only reached mid-table exactly, not above it", () => {
      const LEVEL_AT_MIDPOINT = playerAppearing(OLEG, [], JUST_BELOW_MOCKED, curveOf(MOCKED_MIDDLE));
      falseDawn(eveningFor([LEVEL_AT_MIDPOINT, behind]));

      expect(meritGiven()(LEVEL_AT_MIDPOINT)).toBeNull();
    });

    it("should refuse a lead broken by just one rival who was higher at the midpoint", () => {
      const toppedAtMid = playerAppearing(DIMA, [], HIGH_SHARE, curveOf(HIGHER_STILL));
      falseDawn(eveningFor([faded, behind, toppedAtMid]));

      expect(meritGiven()(faded)).toBeNull();
    });

    it("should accept a rival tied with them at the midpoint, not just strictly behind", () => {
      const tiedAtMid = playerAppearing(DIMA, [], HIGH_SHARE, curveOf(HIGH_SHARE));
      falseDawn(eveningFor([faded, tiedAtMid]));

      expect(meritGiven()(faded)).not.toBeNull();
    });
  });
});

describe("theFlatline()", () => {
  const flat = playerAppearing(OLEG, [], A_FLAT_CURVE, [
    A_FLATTER_STEP,
    ...curveOf(A_FLAT_CURVE).slice(ONCE),
  ]);

  it("should award nothing when the ranking found nobody", () => {
    expect(theFlatline(eveningFor([flat]))).toBeNull();
  });

  it("should not even look for a winner in a short evening", () => {
    theFlatline(eveningFor([flat], CHART_EVENING - ONCE));

    expect(bestBySpy).not.toHaveBeenCalled();
  });

  it("should look for a winner in an evening of exactly eight games", () => {
    theFlatline(eveningFor([flat], CHART_EVENING));

    expect(bestBySpy).toHaveBeenCalled();
  });

  it("should accept a line sitting exactly on the edge of the band", () => {
    const ON_THE_EDGE = playerAppearing(OLEG, [], MOCKED_MIDDLE, curveOf(MOCKED_MIDDLE + FLAT_BAND));
    theFlatline(eveningFor([ON_THE_EDGE]));

    const merit = meritGiven()(ON_THE_EDGE);

    expect(merit).not.toBeNull();
    expect(merit).toBeCloseTo(NOTHING);
  });

  it("should still rank a player with exactly a long evening behind them", () => {
    theFlatline(eveningFor([flat]));
    playedGamesSpy.mockReturnValue(LONG_ENOUGH);

    expect(meritGiven()(flat)).not.toBeNull();
  });

  it("should name the player whose line never moved", () => {
    bestBySpy.mockReturnValue(flat);

    expect(theFlatline(eveningFor([flat]))?.winners).toEqual([OLEG]);
  });

  it("should report the widest step off mid-table, not the narrowest", () => {
    bestBySpy.mockReturnValue(flat);
    const award = theFlatline(eveningFor([flat]));

    expect(award?.name === AwardName.TheFlatline ? award.band : NOTHING).toBe(BAND_IN_POINTS);
  });

  describe("who is eligible", () => {
    it("should rank the flattest line highest", () => {
      theFlatline(eveningFor([flat]));

      expect(meritGiven()(flat)).toBeCloseTo(FLAT_BAND - (A_FLAT_CURVE - MOCKED_MIDDLE));
    });

    it("should measure the band against the scoring's own neutral", () => {
      const roundNumber = playerAppearing(OLEG, [], HIGH_SHARE, curveOf(HIGH_SHARE));
      theFlatline(eveningFor([roundNumber]));

      expect(meritGiven()(roundNumber)).toBeNull();
    });

    it("should refuse a player one game short of a long evening", () => {
      theFlatline(eveningFor([flat]));
      playedGamesSpy.mockReturnValue(LONG_ENOUGH - ONCE);

      expect(meritGiven()(flat)).toBeNull();
    });

    it("should refuse a line stepping just past the edge of the band", () => {
      const JUST_PAST_THE_EDGE = playerAppearing(
        OLEG,
        [],
        MOCKED_MIDDLE,
        curveOf(MOCKED_MIDDLE + FLAT_BAND + A_STEP_PAST)
      );
      theFlatline(eveningFor([JUST_PAST_THE_EDGE]));

      expect(meritGiven()(JUST_PAST_THE_EDGE)).toBeNull();
    });
  });
});
