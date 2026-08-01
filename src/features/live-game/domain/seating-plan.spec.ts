import { describe, expect, it } from "vitest";
import {
  applySeating,
  seatNumberOf,
  type SeatingPlan,
} from "#live-game/domain/seating-plan.ts";


const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const ROMA = { playerId: 12, displayName: "Roma" };

const KIM = { playerId: 41, displayName: "Kim" };

const STRANGER_ID = 99;

const NONE = 0;

const ONE = 1;

const TWO = 2;

const FOUR = 4;

const planOf = (roster: readonly typeof OLEG[], placed: number): SeatingPlan => ({ roster, placed });

describe("seating-plan", () => {
  describe("applySeating, picking a seat", () => {
    it("should move the picked player ahead of everyone unplaced", () => {
      const transition = applySeating(planOf([OLEG, ANYA, ROMA, KIM], NONE), {
        kind: "pick",
        playerId: ANYA.playerId,
      });

      expect(transition).toEqual({
        outcome: "updated",
        plan: { roster: [ANYA, OLEG, ROMA, KIM], placed: ONE },
        seated: ANYA,
      });
    });

    it("should leave the unplaced players in the order they already had", () => {
      const transition = applySeating(planOf([ANYA, OLEG, ROMA, KIM], ONE), {
        kind: "pick",
        playerId: KIM.playerId,
      });

      expect(transition).toEqual({
        outcome: "updated",
        plan: { roster: [ANYA, KIM, OLEG, ROMA], placed: TWO },
        seated: KIM,
      });
    });

    it("should seat everyone once only one player is left, because that seat is forced", () => {
      const transition = applySeating(planOf([ANYA, KIM, OLEG, ROMA], TWO), {
        kind: "pick",
        playerId: OLEG.playerId,
      });

      expect(transition).toEqual({ outcome: "seated", seats: [ANYA, KIM, OLEG, ROMA] });
    });

    it("should reject a player who is already seated", () => {
      const transition = applySeating(planOf([ANYA, OLEG, ROMA, KIM], ONE), {
        kind: "pick",
        playerId: ANYA.playerId,
      });

      expect(transition).toEqual({ outcome: "rejected" });
    });

    it("should reject a player who is not in the roster", () => {
      const transition = applySeating(planOf([OLEG, ANYA, ROMA, KIM], NONE), {
        kind: "pick",
        playerId: STRANGER_ID,
      });

      expect(transition).toEqual({ outcome: "rejected" });
    });

    it("should not mutate the plan it was given", () => {
      const roster = [OLEG, ANYA, ROMA, KIM];

      applySeating(planOf(roster, NONE), { kind: "pick", playerId: ANYA.playerId });

      expect(roster).toEqual([OLEG, ANYA, ROMA, KIM]);
    });
  });

  describe("applySeating, stepping back", () => {
    it("should unseat the player placed last", () => {
      const transition = applySeating(planOf([ANYA, KIM, OLEG, ROMA], TWO), { kind: "back" });

      expect(transition).toEqual({
        outcome: "stepped_back",
        plan: { roster: [ANYA, KIM, OLEG, ROMA], placed: ONE },
      });
    });

    it("should reject stepping back when nobody is seated yet", () => {
      const transition = applySeating(planOf([OLEG, ANYA, ROMA, KIM], NONE), { kind: "back" });

      expect(transition).toEqual({ outcome: "rejected" });
    });
  });

  describe("applySeating, cancelling", () => {
    it("should cancel however many seats are taken", () => {
      const transition = applySeating(planOf([ANYA, KIM, OLEG, ROMA], TWO), { kind: "cancel" });

      expect(transition).toEqual({ outcome: "cancelled" });
    });
  });

  describe("seatNumberOf", () => {
    it("should number a placed slot from one", () => {
      expect(seatNumberOf(planOf([ANYA, KIM, OLEG, ROMA], TWO), NONE)).toBe(ONE);
      expect(seatNumberOf(planOf([ANYA, KIM, OLEG, ROMA], TWO), ONE)).toBe(TWO);
    });

    it("should give an unplaced slot no number", () => {
      expect(seatNumberOf(planOf([ANYA, KIM, OLEG, ROMA], TWO), TWO)).toBeNull();
    });

    it("should number every slot once the whole roster is placed", () => {
      expect(seatNumberOf(planOf([ANYA, KIM, OLEG, ROMA], FOUR), TWO)).toBe(TWO + ONE);
    });
  });
});
