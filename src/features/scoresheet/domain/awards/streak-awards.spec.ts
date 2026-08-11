import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { LONG_ENOUGH } from "#scoresheet/domain/awards/award-catalogue.ts";
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

const foolCountSpy = vi.fn();

const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  foolCount: (player: unknown) => foolCountSpy(player),
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const longestRunSpy = vi.fn();

vi.mock("#scoresheet/domain/awards/appearance-runs.ts", () => ({
  longestRun: (player: unknown, holds: unknown) => longestRunSpy(player, holds),
}));

const { encore, secondWind, sweetRevenge, teflon } = await import(
  "#scoresheet/domain/awards/streak-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const THRICE = 3;

const CLEAN_RUN = 7;

const FOOL_RUN = 3;

const TEN = 10;

const DIMA = 2;

const holdsGiven = (): ((appearance: Appearance) => boolean) =>
  longestRunSpy.mock.calls[NOTHING]?.[ONCE] as (appearance: Appearance) => boolean;

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

const eveningFor = (player: PlayerAppearances) => eveningOf(TEN, [player]);

const A_PLAYER = appearingAs(DIMA, Finish.First, Finish.Middle, Finish.Fool);

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  foolCountSpy.mockReturnValue(ONCE);
  playedGamesSpy.mockReturnValue(TEN);
  longestRunSpy.mockReturnValue(CLEAN_RUN);
});

describe("teflon()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(teflon(eveningFor(A_PLAYER))).toBeNull();
  });

  it("should report the length of the clean run the run finder measured", () => {
    bestBySpy.mockReturnValue(A_PLAYER);
    const award = teflon(eveningFor(A_PLAYER));

    expect(award?.name === AwardName.Teflon ? award.streak : NOTHING).toBe(CLEAN_RUN);
  });

  it("should name the player who kept clean", () => {
    bestBySpy.mockReturnValue(A_PLAYER);

    expect(teflon(eveningFor(A_PLAYER))?.winners).toEqual([DIMA]);
  });

  describe("what it measures", () => {
    it("should count a game that was not the fool as holding the run", () => {
      teflon(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(holdsGiven()(appearanceOf(NOTHING, Finish.Middle))).toBe(true);
    });

    it("should count being the fool as breaking the run", () => {
      teflon(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(holdsGiven()(appearanceOf(NOTHING, Finish.Fool))).toBe(false);
    });
  });

  describe("who is eligible", () => {
    it("should rank a player by the run the finder measured", () => {
      teflon(eveningFor(A_PLAYER));

      expect(meritGiven()(A_PLAYER)).toBe(CLEAN_RUN);
    });

    it("should refuse a run one game short", () => {
      teflon(eveningFor(A_PLAYER));
      longestRunSpy.mockReturnValue(CLEAN_RUN - ONCE);

      expect(meritGiven()(A_PLAYER)).toBeNull();
    });

    it("should refuse a player who was never the fool at all", () => {
      teflon(eveningFor(A_PLAYER));
      foolCountSpy.mockReturnValue(NOTHING);

      expect(meritGiven()(A_PLAYER)).toBeNull();
    });
  });
});

describe("sweetRevenge()", () => {
  const AVENGER = appearingAs(DIMA, Finish.Fool, Finish.First, Finish.Middle, Finish.Fool, Finish.First);

  const SULKER = appearingAs(DIMA, Finish.Fool, Finish.Middle, Finish.Fool, Finish.Middle);

  it("should award nothing when the ranking found nobody", () => {
    expect(sweetRevenge(eveningFor(AVENGER))).toBeNull();
  });

  it("should report the fools behind the comebacks as well as the comebacks", () => {
    bestBySpy.mockReturnValue(AVENGER);
    foolCountSpy.mockReturnValue(TWICE);
    const award = sweetRevenge(eveningFor(AVENGER));

    expect(award?.name === AwardName.SweetRevenge ? [award.fools, award.comebacks] : []).toEqual([
      TWICE,
      TWICE,
    ]);
  });

  it("should name the player who came back", () => {
    bestBySpy.mockReturnValue(AVENGER);

    expect(sweetRevenge(eveningFor(AVENGER))?.winners).toEqual([DIMA]);
  });

  describe("who is eligible", () => {
    it("should count only a fool followed by going out first next time", () => {
      sweetRevenge(eveningFor(AVENGER));

      expect(meritGiven()(AVENGER)).toBe(TWICE);
    });

    it("should refuse a player who never came back first", () => {
      sweetRevenge(eveningFor(SULKER));

      expect(meritGiven()(SULKER)).toBeNull();
    });

    it("should refuse a single comeback", () => {
      const ONE_COMEBACK = appearingAs(DIMA, Finish.Fool, Finish.First, Finish.Middle);
      sweetRevenge(eveningFor(ONE_COMEBACK));

      expect(meritGiven()(ONE_COMEBACK)).toBeNull();
    });

    it("should not credit a fool in the last game, which has no next game", () => {
      const LATE_FOOL = appearingAs(
        DIMA,
        Finish.Fool,
        Finish.First,
        Finish.Fool,
        Finish.First,
        Finish.Fool
      );
      sweetRevenge(eveningFor(LATE_FOOL));

      expect(meritGiven()(LATE_FOOL)).toBe(TWICE);
    });
  });
});

describe("encore()", () => {
  beforeEach(() => {
    longestRunSpy.mockReturnValue(FOOL_RUN);
  });

  it("should award nothing when the ranking found nobody", () => {
    expect(encore(eveningFor(A_PLAYER))).toBeNull();
  });

  it("should report how long the run of fools was", () => {
    bestBySpy.mockReturnValue(A_PLAYER);
    const award = encore(eveningFor(A_PLAYER));

    expect(award?.name === AwardName.Encore ? award.run : NOTHING).toBe(FOOL_RUN);
  });

  it("should name the player who kept coming back for it", () => {
    bestBySpy.mockReturnValue(A_PLAYER);

    expect(encore(eveningFor(A_PLAYER))?.winners).toEqual([DIMA]);
  });

  describe("what it measures", () => {
    it("should count being the fool as holding the run", () => {
      encore(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(holdsGiven()(appearanceOf(NOTHING, Finish.Fool))).toBe(true);
    });

    it("should count any other finish as breaking it", () => {
      encore(eveningFor(A_PLAYER));
      meritGiven()(A_PLAYER);

      expect(holdsGiven()(appearanceOf(NOTHING, Finish.Drawn))).toBe(false);
    });
  });

  describe("who is eligible", () => {
    it("should rank a player by their longest run of fools", () => {
      encore(eveningFor(A_PLAYER));

      expect(meritGiven()(A_PLAYER)).toBe(FOOL_RUN);
    });

    it("should refuse two fools running, which is no longer an encore", () => {
      encore(eveningFor(A_PLAYER));
      longestRunSpy.mockReturnValue(TWICE);

      expect(meritGiven()(A_PLAYER)).toBeNull();
    });
  });
});

describe("secondWind()", () => {
  const BURNED_THEN_CLEAN = playerAppearing(DIMA, [
    appearanceOf(NOTHING, Finish.Fool),
    appearanceOf(ONCE, Finish.Middle),
    appearanceOf(TWICE, Finish.First),
    appearanceOf(THRICE, Finish.Middle),
    appearanceOf(LONG_ENOUGH, Finish.First),
  ]);

  const BURNED_LATE = playerAppearing(DIMA, [
    appearanceOf(NOTHING, Finish.Fool),
    appearanceOf(ONCE, Finish.Middle),
    appearanceOf(TWICE, Finish.First),
    appearanceOf(THRICE, Finish.Fool),
  ]);

  const NEVER_BURNED = appearingAs(DIMA, Finish.First, Finish.Middle, Finish.First, Finish.Middle);

  it("should award nothing when the ranking found nobody", () => {
    expect(secondWind(eveningFor(BURNED_THEN_CLEAN))).toBeNull();
  });

  it("should report the game they were last the fool in and the games since", () => {
    bestBySpy.mockReturnValue(BURNED_THEN_CLEAN);
    const award = secondWind(eveningFor(BURNED_THEN_CLEAN));

    expect(award?.name === AwardName.SecondWind ? [award.burnedBy, award.games] : []).toEqual([
      ONCE,
      TEN,
    ]);
  });

  it("should name the player who settled down", () => {
    bestBySpy.mockReturnValue(BURNED_THEN_CLEAN);

    expect(secondWind(eveningFor(BURNED_THEN_CLEAN))?.winners).toEqual([DIMA]);
  });

  it("should still rank a player with exactly a long evening behind them", () => {
    secondWind(eveningFor(BURNED_THEN_CLEAN));
    playedGamesSpy.mockReturnValue(LONG_ENOUGH);

    expect(meritGiven()(BURNED_THEN_CLEAN)).toBe(LONG_ENOUGH - ONCE);
  });

  describe("who is eligible", () => {
    it("should rank by how much of the evening came after the last burn", () => {
      secondWind(eveningFor(BURNED_THEN_CLEAN));

      expect(meritGiven()(BURNED_THEN_CLEAN)).toBe(TEN - ONCE);
    });

    it("should refuse a player who was the fool after the opening three", () => {
      secondWind(eveningFor(BURNED_LATE));

      expect(meritGiven()(BURNED_LATE)).toBeNull();
    });

    it("should refuse a player who was never the fool in the opening three", () => {
      secondWind(eveningFor(NEVER_BURNED));

      expect(meritGiven()(NEVER_BURNED)).toBeNull();
    });

    it("should refuse a player one game short of a long evening", () => {
      secondWind(eveningFor(BURNED_THEN_CLEAN));
      playedGamesSpy.mockReturnValue(LONG_ENOUGH - ONCE);

      expect(meritGiven()(BURNED_THEN_CLEAN)).toBeNull();
    });
  });
});
