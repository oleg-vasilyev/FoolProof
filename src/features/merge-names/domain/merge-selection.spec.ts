import { describe, expect, it } from "vitest";
import { Outcome } from "#merge-names/domain/merge-states.ts";
import {
  apply,
  candidateOf,
  chosen,
  gamesAfterMerge,
  MOST_NAMES_AT_ONCE,
  roleOf,
  type Candidate,
  type Selection,
} from "#merge-names/domain/merge-selection.ts";


const ANYA = 1;

const ANNA = 2;

const OLEG = 3;

const ANYUTA = 4;

const STRANGER = 99;

const TWELVE_GAMES = 12;

const ONE_GAME = 1;

const NO_GAMES = 0;

const THIRTEEN_GAMES = 13;

const candidate = (playerId: number, displayName: string, games: number): Candidate => ({
  playerId,
  displayName,
  games,
});

const ROSTER: readonly Candidate[] = [
  candidate(ANYA, "Аня", TWELVE_GAMES),
  candidate(ANNA, "Анна", ONE_GAME),
  candidate(OLEG, "Oleg", TWELVE_GAMES),
  candidate(ANYUTA, "Анюта", NO_GAMES),
];

const selectionAfter = (selection: Selection, taps: readonly number[]): Selection =>
  taps.reduce((carried, playerId) => {
    const transition = apply(ROSTER, carried, { kind: "pick", playerId });

    return transition.outcome === Outcome.Updated ? transition.selection : carried;
  }, selection);

describe("candidateOf()", () => {
  it("should find a player of the roster", () => {
    expect(candidateOf(ROSTER, ANNA)?.displayName).toBe("Анна");
  });

  it("should find nobody for an id the roster does not hold", () => {
    expect(candidateOf(ROSTER, STRANGER)).toBeUndefined();
  });
});

describe("roleOf()", () => {
  it("should call the first pick the keeper", () => {
    expect(roleOf([ANYA, ANNA], ANYA)).toBe("keeper");
  });

  it("should call every later pick absorbed", () => {
    expect(roleOf([ANYA, ANNA], ANNA)).toBe("absorbed");
  });

  it("should leave an unpicked name free", () => {
    expect(roleOf([ANYA, ANNA], OLEG)).toBe("free");
  });

  it("should leave every name free while nothing is picked", () => {
    expect(roleOf([], ANYA)).toBe("free");
  });
});

describe("chosen()", () => {
  it("should keep the tap order, not the roster order", () => {
    expect(chosen(ROSTER, [OLEG, ANYA]).map((found) => found.playerId)).toEqual([OLEG, ANYA]);
  });

  it("should drop an id the roster no longer holds", () => {
    expect(chosen(ROSTER, [ANYA, STRANGER])).toHaveLength(ONE_GAME);
  });
});

describe("gamesAfterMerge()", () => {
  it("should add every absorbed history to the keeper's", () => {
    const keeper = candidate(ANYA, "Аня", TWELVE_GAMES);

    expect(gamesAfterMerge(keeper, [candidate(ANNA, "Анна", ONE_GAME)])).toBe(THIRTEEN_GAMES);
  });

  it("should leave the keeper's own count alone when nothing is absorbed", () => {
    expect(gamesAfterMerge(candidate(ANYA, "Аня", TWELVE_GAMES), [])).toBe(TWELVE_GAMES);
  });
});

describe("apply()", () => {
  describe("picking a name", () => {
    it("should make the first pick the whole selection", () => {
      const transition = apply(ROSTER, [], { kind: "pick", playerId: ANYA });

      expect(transition).toMatchObject({ outcome: "updated", selection: [ANYA] });
    });

    it("should say which name was touched, so the tap can be answered", () => {
      const transition = apply(ROSTER, [], { kind: "pick", playerId: ANYA });

      expect(transition).toMatchObject({ touched: { displayName: "Аня" } });
    });

    it("should append a second pick after the keeper", () => {
      expect(selectionAfter([], [ANYA, ANNA])).toEqual([ANYA, ANNA]);
    });

    it("should drop a name that was picked already", () => {
      expect(selectionAfter([], [ANYA, ANNA, ANNA])).toEqual([ANYA]);
    });

    it("should promote the next name when the keeper is dropped", () => {
      expect(selectionAfter([], [ANYA, ANNA, ANYA])).toEqual([ANNA]);
    });

    it("should refuse a name the roster does not hold", () => {
      const transition = apply(ROSTER, [], { kind: "pick", playerId: STRANGER });

      expect(transition).toEqual({ outcome: "rejected", because: "unknown_name" });
    });

    it("should refuse one name past what a merge can carry", () => {
      const full = Array.from({ length: MOST_NAMES_AT_ONCE }, (_, index) => index + ANYA);
      const roster = full.map((playerId) => candidate(playerId, `P${String(playerId)}`, NO_GAMES));

      const transition = apply([...roster, candidate(STRANGER, "One too many", NO_GAMES)], full, {
        kind: "pick",
        playerId: STRANGER,
      });

      expect(transition).toEqual({ outcome: "rejected", because: "too_many" });
    });

    it("should still let a full selection drop a name", () => {
      const full = Array.from({ length: MOST_NAMES_AT_ONCE }, (_, index) => index + ANYA);
      const roster = full.map((playerId) => candidate(playerId, `P${String(playerId)}`, NO_GAMES));

      const transition = apply(roster, full, { kind: "pick", playerId: ANYA });

      expect(transition).toMatchObject({ outcome: "updated" });
    });
  });

  describe("stepping back", () => {
    it("should undo the last pick only", () => {
      const transition = apply(ROSTER, [ANYA, ANNA, ANYUTA], { kind: "back" });

      expect(transition).toMatchObject({ outcome: "updated", selection: [ANYA, ANNA] });
    });

    it("should touch nobody, so the answer is not about a name", () => {
      const transition = apply(ROSTER, [ANYA], { kind: "back" });

      expect(transition).toMatchObject({ touched: null });
    });

    it("should refuse when there is nothing to undo", () => {
      expect(apply(ROSTER, [], { kind: "back" })).toEqual({
        outcome: "rejected",
        because: "nothing_yet",
      });
    });
  });

  describe("confirming", () => {
    it("should keep the first name and absorb the rest", () => {
      const transition = apply(ROSTER, [ANYA, ANNA, ANYUTA], { kind: "confirm" });

      expect(transition).toMatchObject({
        outcome: "confirmed",
        keeper: { playerId: ANYA },
        absorbed: [{ playerId: ANNA }, { playerId: ANYUTA }],
      });
    });

    it("should refuse a single name", () => {
      expect(apply(ROSTER, [ANYA], { kind: "confirm" })).toEqual({
        outcome: "rejected",
        because: "nothing_yet",
      });
    });

    it("should refuse an empty selection", () => {
      expect(apply(ROSTER, [], { kind: "confirm" })).toEqual({
        outcome: "rejected",
        because: "nothing_yet",
      });
    });

    it("should refuse when a picked name has left the roster since", () => {
      expect(apply(ROSTER, [ANYA, STRANGER], { kind: "confirm" })).toEqual({
        outcome: "rejected",
        because: "unknown_name",
      });
    });
  });

  describe("cancelling", () => {
    it("should cancel whatever was picked", () => {
      expect(apply(ROSTER, [ANYA, ANNA], { kind: "cancel" })).toEqual({ outcome: "cancelled" });
    });

    it("should cancel an untouched screen too", () => {
      expect(apply(ROSTER, [], { kind: "cancel" })).toEqual({ outcome: "cancelled" });
    });
  });
});
