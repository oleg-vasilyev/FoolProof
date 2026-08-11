import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Appearance, PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
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

const inTopHalfSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  inTopHalf: (appearance: unknown) => inTopHalfSpy(appearance),
}));

const longestRunSpy = vi.fn();

const longestChainSpy = vi.fn();

vi.mock("#scoresheet/domain/awards/appearance-runs.ts", () => ({
  longestRun: (player: unknown, holds: unknown) => longestRunSpy(player, holds),
  longestChain: (player: unknown, links: unknown) => longestChainSpy(player, links),
}));

const { groundhogDay, hatTrick, thePendulum, theLadder, theSlide } = await import(
  "#scoresheet/domain/awards/run-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const THRICE = 3;

const WINNING_RUN = 4;

const MOVING_RUN = 4;

const SWINGING_RUN = 6;

const SAME_SPOT_RUN = 5;

const ROMANI = 6;

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

const holdsGiven = (): ((appearance: Appearance) => boolean) =>
  longestRunSpy.mock.calls[NOTHING]?.[ONCE] as (appearance: Appearance) => boolean;

const linksGiven = (): ((earlier: Appearance, later: Appearance) => boolean) =>
  longestChainSpy.mock.calls[NOTHING]?.[ONCE] as (
    earlier: Appearance,
    later: Appearance
  ) => boolean;

const A_PLAYER = appearingAs(ROMANI, Finish.First, Finish.Middle, Finish.Fool);

const eveningFor = (player: PlayerAppearances) => eveningOf(THRICE, [player]);

const HIGH = appearanceOf(NOTHING, Finish.Middle, TWICE);

const LOW = appearanceOf(ONCE, Finish.Middle, THRICE);

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  inTopHalfSpy.mockReturnValue(false);
  longestRunSpy.mockReturnValue(WINNING_RUN);
  longestChainSpy.mockReturnValue(MOVING_RUN);
});

describe("hatTrick()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(hatTrick(eveningFor(A_PLAYER))).toBeNull();
  });

  it("should report the run the finder measured", () => {
    bestBySpy.mockReturnValue(A_PLAYER);
    const award = hatTrick(eveningFor(A_PLAYER));

    expect(award?.name === AwardName.HatTrick ? award.run : NOTHING).toBe(WINNING_RUN);
  });

  it("should name the player who kept winning", () => {
    bestBySpy.mockReturnValue(A_PLAYER);

    expect(hatTrick(eveningFor(A_PLAYER))?.winners).toEqual([ROMANI]);
  });

  describe("what it measures", () => {
    it("should count going out first as holding the run", () => {
      hatTrick(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(holdsGiven()(appearanceOf(NOTHING, Finish.First))).toBe(true);
    });

    it("should count finishing anywhere else as breaking it", () => {
      hatTrick(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(holdsGiven()(appearanceOf(NOTHING, Finish.Middle))).toBe(false);
    });
  });

  it("should refuse a run one game short", () => {
    hatTrick(eveningFor(A_PLAYER));
    longestRunSpy.mockReturnValue(WINNING_RUN - ONCE);

    expect(meritGiven()(A_PLAYER)).toBeNull();
  });
});

describe("theLadder()", () => {
  it("should report the climb the finder measured", () => {
    bestBySpy.mockReturnValue(A_PLAYER);
    const award = theLadder(eveningFor(A_PLAYER));

    expect(award?.name === AwardName.TheLadder ? award.run : NOTHING).toBe(MOVING_RUN);
  });

  it("should award nothing when the ranking found nobody", () => {
    expect(theLadder(eveningFor(A_PLAYER))).toBeNull();
  });

  it("should name the player who climbed", () => {
    bestBySpy.mockReturnValue(A_PLAYER);

    expect(theLadder(eveningFor(A_PLAYER))?.winners).toEqual([ROMANI]);
  });

  describe("what it measures", () => {
    it("should link a game finished in a better place than the one before", () => {
      theLadder(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(linksGiven()(LOW, HIGH)).toBe(true);
    });

    it("should not link a game finished worse", () => {
      theLadder(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(linksGiven()(HIGH, LOW)).toBe(false);
    });

    it("should not let a drawn game count as a step", () => {
      theLadder(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(linksGiven()(LOW, appearanceOf(ONCE, Finish.Drawn, ONCE))).toBe(false);
    });
  });

  it("should refuse a climb one game short", () => {
    theLadder(eveningFor(A_PLAYER));
    longestChainSpy.mockReturnValue(MOVING_RUN - ONCE);

    expect(meritGiven()(A_PLAYER)).toBeNull();
  });
});

describe("theSlide()", () => {
  it("should report the slide the finder measured", () => {
    bestBySpy.mockReturnValue(A_PLAYER);
    const award = theSlide(eveningFor(A_PLAYER));

    expect(award?.name === AwardName.TheSlide ? award.run : NOTHING).toBe(MOVING_RUN);
  });

  it("should award nothing when the ranking found nobody", () => {
    expect(theSlide(eveningFor(A_PLAYER))).toBeNull();
  });

  it("should name the player who kept sinking", () => {
    bestBySpy.mockReturnValue(A_PLAYER);

    expect(theSlide(eveningFor(A_PLAYER))?.winners).toEqual([ROMANI]);
  });

  it("should refuse a slide one game short", () => {
    theSlide(eveningFor(A_PLAYER));
    longestChainSpy.mockReturnValue(MOVING_RUN - ONCE);

    expect(meritGiven()(A_PLAYER)).toBeNull();
  });

  describe("what it measures", () => {
    it("should link a game finished in a worse place than the one before", () => {
      theSlide(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(linksGiven()(HIGH, LOW)).toBe(true);
    });

    it("should not link a game finished better", () => {
      theSlide(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(linksGiven()(LOW, HIGH)).toBe(false);
    });

    it("should not let a drawn game count as a step", () => {
      theSlide(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(linksGiven()(HIGH, appearanceOf(ONCE, Finish.Drawn, SAME_SPOT_RUN))).toBe(false);
    });
  });
});

describe("thePendulum()", () => {
  it("should report the swing the finder measured", () => {
    bestBySpy.mockReturnValue(A_PLAYER);
    longestChainSpy.mockReturnValue(SWINGING_RUN);
    const award = thePendulum(eveningFor(A_PLAYER));

    expect(award?.name === AwardName.ThePendulum ? award.run : NOTHING).toBe(SWINGING_RUN);
  });

  it("should award nothing when the ranking found nobody", () => {
    longestChainSpy.mockReturnValue(SWINGING_RUN);

    expect(thePendulum(eveningFor(A_PLAYER))).toBeNull();
  });

  it("should name the player who kept swinging", () => {
    bestBySpy.mockReturnValue(A_PLAYER);
    longestChainSpy.mockReturnValue(SWINGING_RUN);

    expect(thePendulum(eveningFor(A_PLAYER))?.winners).toEqual([ROMANI]);
  });

  describe("what it measures", () => {
    it("should link two games that fell on opposite halves of the table", () => {
      thePendulum(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);
      inTopHalfSpy.mockReturnValueOnce(true).mockReturnValueOnce(false);

      expect(linksGiven()(HIGH, LOW)).toBe(true);
    });

    it("should not link two games that fell on the same half", () => {
      thePendulum(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);
      inTopHalfSpy.mockReturnValue(true);

      expect(linksGiven()(HIGH, LOW)).toBe(false);
    });
  });

  it("should refuse a swing one game short", () => {
    thePendulum(eveningFor(A_PLAYER));
    longestChainSpy.mockReturnValue(SWINGING_RUN - ONCE);

    expect(meritGiven()(A_PLAYER)).toBeNull();
  });
});

describe("groundhogDay()", () => {
  const STUCK = playerAppearing(
    ROMANI,
    Array.from({ length: SAME_SPOT_RUN }, (_unused, round) =>
      appearanceOf(round, Finish.Middle, THRICE)
    )
  );

  const MOVED_ONCE = playerAppearing(ROMANI, [
    ...STUCK.appearances.slice(ONCE),
    appearanceOf(SAME_SPOT_RUN, Finish.Middle, TWICE),
  ]);

  it("should award nothing when the ranking found nobody", () => {
    expect(groundhogDay(eveningFor(STUCK))).toBeNull();
  });

  it("should report the place taken and how long it was taken for", () => {
    bestBySpy.mockReturnValue(STUCK);
    const award = groundhogDay(eveningFor(STUCK));

    expect(award?.name === AwardName.GroundhogDay ? [award.place, award.run] : []).toEqual([
      THRICE,
      SAME_SPOT_RUN,
    ]);
  });

  it("should name the player who never moved", () => {
    bestBySpy.mockReturnValue(STUCK);

    expect(groundhogDay(eveningFor(STUCK))?.winners).toEqual([ROMANI]);
  });

  describe("who is eligible", () => {
    it("should rank a player by the length of their rut", () => {
      groundhogDay(eveningFor(STUCK));

      expect(meritGiven()(STUCK)).toBe(SAME_SPOT_RUN);
    });

    it("should refuse a rut one game short", () => {
      groundhogDay(eveningFor(MOVED_ONCE));

      expect(meritGiven()(MOVED_ONCE)).toBeNull();
    });

    it("should measure the longest rut rather than the last one", () => {
      const BROKEN_THEN_STUCK = playerAppearing(ROMANI, [
        appearanceOf(NOTHING, Finish.Middle, TWICE),
        ...STUCK.appearances.map((appearance, round) =>
          appearanceOf(round + ONCE, Finish.Middle, THRICE)
        ),
      ]);

      groundhogDay(eveningFor(BROKEN_THEN_STUCK));

      expect(meritGiven()(BROKEN_THEN_STUCK)).toBe(SAME_SPOT_RUN);
    });
  });
});
