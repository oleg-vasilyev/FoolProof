import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";
import { appearanceOf, eveningOf, playerAppearing } from "#scoresheet/domain/session-appearances.stub.ts";


const bestBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
}));

const { theNemesis } = await import("#scoresheet/domain/awards/rivalry-awards.ts");

const NOTHING = 0;

const ONCE = 1;

const WENT_OUT_FIRST = 1;

const RUNNER_UP = 2;

const THIRD = 3;

const SHARED_ENOUGH = 8;

const A_LONGER_REIGN = 10;

const NINETEEN = 19;

const OLEG = 3;

const DIMA = 2;

const VERONIKA = 5;

const sittingAt = (playerId: number, place: number, rounds: number): PlayerAppearances =>
  playerAppearing(
    playerId,
    Array.from({ length: rounds }, (_unused, round) => appearanceOf(round, Finish.Middle, place))
  );

const DOMINATOR = sittingAt(OLEG, WENT_OUT_FIRST, A_LONGER_REIGN);

const WENT_HOME_EARLY = sittingAt(DIMA, RUNNER_UP, SHARED_ENOUGH);

const STAYED_ALL_NIGHT = sittingAt(VERONIKA, THIRD, A_LONGER_REIGN);

const eveningFor = (players: readonly PlayerAppearances[]) => eveningOf(NINETEEN, players);

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
});

describe("theNemesis()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(theNemesis(eveningFor([DOMINATOR, WENT_HOME_EARLY]))).toBeNull();
  });

  it("should name the player who did the holding down", () => {
    bestBySpy.mockReturnValue(DOMINATOR);

    expect(theNemesis(eveningFor([DOMINATOR, WENT_HOME_EARLY]))?.winners).toEqual([OLEG]);
  });

  it("should report the games the two of them shared", () => {
    bestBySpy.mockReturnValue(DOMINATOR);
    const award = theNemesis(eveningFor([DOMINATOR, WENT_HOME_EARLY]));

    expect(award?.name === AwardName.TheNemesis ? award.over : NOTHING).toBe(SHARED_ENOUGH);
  });

  describe("who is eligible", () => {
    it("should rank a player by the games they spent above the same rival", () => {
      theNemesis(eveningFor([DOMINATOR, WENT_HOME_EARLY]));

      expect(meritGiven()(DOMINATOR)).toBe(SHARED_ENOUGH);
    });

    it("should count only the games both of them actually played", () => {
      const BRIEF = sittingAt(DIMA, RUNNER_UP, SHARED_ENOUGH - ONCE);
      theNemesis(eveningFor([DOMINATOR, BRIEF]));

      expect(meritGiven()(DOMINATOR)).toBeNull();
    });

    it("should refuse the player who spent them underneath", () => {
      theNemesis(eveningFor([DOMINATOR, WENT_HOME_EARLY]));

      expect(meritGiven()(WENT_HOME_EARLY)).toBeNull();
    });

    it("should refuse a rivalry broken by a single game finished below", () => {
      const SLIPPED = playerAppearing(OLEG, [
        ...DOMINATOR.appearances.slice(ONCE),
        appearanceOf(A_LONGER_REIGN - ONCE, Finish.Middle, THIRD),
      ]);
      theNemesis(eveningFor([SLIPPED, WENT_HOME_EARLY]));

      expect(meritGiven()(SLIPPED)).toBeNull();
    });

    it("should take the widest rivalry when there is more than one victim", () => {
      theNemesis(eveningFor([DOMINATOR, WENT_HOME_EARLY, STAYED_ALL_NIGHT]));

      expect(meritGiven()(DOMINATOR)).toBe(A_LONGER_REIGN);
    });

    it("should not count a player as their own rival", () => {
      theNemesis(eveningFor([DOMINATOR]));

      expect(meritGiven()(DOMINATOR)).toBeNull();
    });

    it("should refuse somebody who never sat down", () => {
      const ABSENT = playerAppearing(DIMA, []);
      theNemesis(eveningFor([ABSENT, STAYED_ALL_NIGHT]));

      expect(meritGiven()(ABSENT)).toBeNull();
    });
  });
});
