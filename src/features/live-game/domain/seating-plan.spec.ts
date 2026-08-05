import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
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

const NOBODY_SEATED = 0;

const ONE_SEATED = 1;

const TWO_SEATED = 2;

const WHOLE_TABLE_SEATED = 4;

const FIRST_SLOT = 0;

const SECOND_SLOT = 1;

const THIRD_SLOT = 2;

const FIRST_SEAT = 1;

const SECOND_SEAT = 2;

const THIRD_SEAT = 3;

const planOf = (roster: readonly typeof OLEG[], placed: number): SeatingPlan => ({ roster, placed });

describe("seating-plan", () => {
  describe("applySeating, picking a seat", () => {
    it("should move the picked player ahead of everyone unplaced", () => {
      const transition = applySeating(planOf([OLEG, ANYA, ROMA, KIM], NOBODY_SEATED), {
        kind: ActionKind.Pick,
        playerId: ANYA.playerId,
      });

      expect(transition).toEqual({
        outcome: Outcome.Updated,
        plan: { roster: [ANYA, OLEG, ROMA, KIM], placed: ONE_SEATED },
        seated: ANYA,
        seat: FIRST_SEAT,
      });
    });

    it("should leave the unplaced players in the order they already had", () => {
      const transition = applySeating(planOf([ANYA, OLEG, ROMA, KIM], ONE_SEATED), {
        kind: ActionKind.Pick,
        playerId: KIM.playerId,
      });

      expect(transition).toEqual({
        outcome: Outcome.Updated,
        plan: { roster: [ANYA, KIM, OLEG, ROMA], placed: TWO_SEATED },
        seated: KIM,
        seat: SECOND_SEAT,
      });
    });

    it("should seat everyone once only one player is left, because that seat is forced", () => {
      const transition = applySeating(planOf([ANYA, KIM, OLEG, ROMA], TWO_SEATED), {
        kind: ActionKind.Pick,
        playerId: OLEG.playerId,
      });

      expect(transition).toEqual({ outcome: Outcome.Seated, seats: [ANYA, KIM, OLEG, ROMA] });
    });

    it("should reject a player who is already seated", () => {
      const transition = applySeating(planOf([ANYA, OLEG, ROMA, KIM], ONE_SEATED), {
        kind: ActionKind.Pick,
        playerId: ANYA.playerId,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });

    it("should reject a player who is not in the roster", () => {
      const transition = applySeating(planOf([OLEG, ANYA, ROMA, KIM], NOBODY_SEATED), {
        kind: ActionKind.Pick,
        playerId: STRANGER_ID,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });

    it("should not mutate the plan it was given", () => {
      const roster = [OLEG, ANYA, ROMA, KIM];

      applySeating(planOf(roster, NOBODY_SEATED), { kind: ActionKind.Pick, playerId: ANYA.playerId });

      expect(roster).toEqual([OLEG, ANYA, ROMA, KIM]);
    });
  });

  describe("applySeating, stepping back", () => {
    it("should unseat the player placed last", () => {
      const transition = applySeating(planOf([ANYA, KIM, OLEG, ROMA], TWO_SEATED), {
        kind: ActionKind.Back,
      });

      expect(transition).toEqual({
        outcome: Outcome.SteppedBack,
        plan: { roster: [ANYA, KIM, OLEG, ROMA], placed: ONE_SEATED },
      });
    });

    it("should reject stepping back when nobody is seated yet", () => {
      const transition = applySeating(planOf([OLEG, ANYA, ROMA, KIM], NOBODY_SEATED), {
        kind: ActionKind.Back,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });
  });

  describe("applySeating, cancelling", () => {
    it("should cancel however many seats are taken", () => {
      const transition = applySeating(planOf([ANYA, KIM, OLEG, ROMA], TWO_SEATED), {
        kind: ActionKind.Cancel,
      });

      expect(transition).toEqual({ outcome: Outcome.Cancelled });
    });
  });

  describe("seatNumberOf", () => {
    it("should number a placed slot from one", () => {
      const plan = planOf([ANYA, KIM, OLEG, ROMA], TWO_SEATED);

      expect(seatNumberOf(plan, FIRST_SLOT)).toBe(FIRST_SEAT);
      expect(seatNumberOf(plan, SECOND_SLOT)).toBe(SECOND_SEAT);
    });

    it("should give an unplaced slot no number", () => {
      expect(seatNumberOf(planOf([ANYA, KIM, OLEG, ROMA], TWO_SEATED), THIRD_SLOT)).toBeNull();
    });

    it("should number every slot once the whole roster is placed", () => {
      expect(seatNumberOf(planOf([ANYA, KIM, OLEG, ROMA], WHOLE_TABLE_SEATED), THIRD_SLOT)).toBe(
        THIRD_SEAT
      );
    });
  });
});
