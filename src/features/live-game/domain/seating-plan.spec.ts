import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
import { describe, expect, it } from "vitest";
import {
  applySeating,
  everyoneSeated,
  seatNumberOf,
  type SeatingPlan,
} from "#live-game/domain/seating-plan.ts";


const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const ROMA = { playerId: 12, displayName: "Roma" };

const KIM = { playerId: 41, displayName: "Kim" };

const AT_THE_TABLE = [OLEG, ANYA, ROMA, KIM];

const STRANGER_ID = 99;

const NOBODY_SEATED: readonly number[] = [];

const FIRST_SLOT = 0;

const SECOND_SLOT = 1;

const THIRD_SLOT = 2;

const LAST_SLOT = 3;

const FIRST_SEAT = 1;

const SECOND_SEAT = 2;

const THIRD_SEAT = 3;

const LAST_SEAT = 4;

const planOf = (roster: readonly (typeof OLEG)[], seated: readonly number[]): SeatingPlan => ({
  roster,
  seated,
});

describe("seating-plan", () => {
  describe("applySeating, picking a seat", () => {
    it("should leave every row where it was, so the next tap lands where the eye already is", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, NOBODY_SEATED), {
        kind: ActionKind.Pick,
        playerId: ANYA.playerId,
      });

      expect(transition).toEqual({
        outcome: Outcome.Updated,
        plan: { roster: AT_THE_TABLE, seated: [ANYA.playerId] },
        seated: ANYA,
        seat: FIRST_SEAT,
      });
    });

    it("should number seats by the order they were tapped, not the order they are drawn", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, [ANYA.playerId]), {
        kind: ActionKind.Pick,
        playerId: KIM.playerId,
      });

      expect(transition).toEqual({
        outcome: Outcome.Updated,
        plan: { roster: AT_THE_TABLE, seated: [ANYA.playerId, KIM.playerId] },
        seated: KIM,
        seat: SECOND_SEAT,
      });
    });

    it("should fill the last forced seat without opening a card, so the screen can be confirmed", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId]), {
        kind: ActionKind.Pick,
        playerId: OLEG.playerId,
      });

      expect(transition).toEqual({
        outcome: Outcome.Updated,
        plan: { roster: AT_THE_TABLE, seated: [ANYA.playerId, KIM.playerId, OLEG.playerId] },
        seated: OLEG,
        seat: THIRD_SEAT,
      });
    });

    it("should reject a pick once the last seat is forced, so the order cannot change under Play", () => {
      const transition = applySeating(
        planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId, OLEG.playerId]),
        { kind: ActionKind.Pick, playerId: ROMA.playerId }
      );

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });

    it("should reject a player who is already seated", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, [ANYA.playerId]), {
        kind: ActionKind.Pick,
        playerId: ANYA.playerId,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });

    it("should reject a player who is not in the roster", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, NOBODY_SEATED), {
        kind: ActionKind.Pick,
        playerId: STRANGER_ID,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });

    it("should not mutate the plan it was given", () => {
      const seated = [ANYA.playerId];

      applySeating(planOf(AT_THE_TABLE, seated), {
        kind: ActionKind.Pick,
        playerId: KIM.playerId,
      });

      expect(seated).toEqual([ANYA.playerId]);
    });
  });

  describe("applySeating, stepping back", () => {
    it("should unseat whoever was seated last, and move nobody", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId]), {
        kind: ActionKind.Back,
      });

      expect(transition).toEqual({
        outcome: Outcome.SteppedBack,
        plan: { roster: AT_THE_TABLE, seated: [ANYA.playerId] },
      });
    });

    it("should reject stepping back when nobody is seated yet", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, NOBODY_SEATED), {
        kind: ActionKind.Back,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });
  });

  describe("applySeating, confirming", () => {
    it("should hand over the ring in the order it was tapped, not the order it was drawn", () => {
      const transition = applySeating(
        planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId, OLEG.playerId]),
        { kind: ActionKind.Confirm }
      );

      expect(transition).toEqual({ outcome: Outcome.Seated, seats: [ANYA, KIM, OLEG, ROMA] });
    });

    it("should put the one player nobody tapped in the seat that is left", () => {
      const transition = applySeating(
        planOf(AT_THE_TABLE, [ROMA.playerId, OLEG.playerId, KIM.playerId]),
        { kind: ActionKind.Confirm }
      );

      expect(transition).toEqual({ outcome: Outcome.Seated, seats: [ROMA, OLEG, KIM, ANYA] });
    });

    it("should refuse to seat a table with a seat still to be chosen", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId]), {
        kind: ActionKind.Confirm,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });

    it("should refuse to seat a table nobody has been placed at", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, NOBODY_SEATED), {
        kind: ActionKind.Confirm,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected });
    });
  });

  describe("everyoneSeated", () => {
    it("should call the table seated one tap before the last, because that seat is forced", () => {
      const plan = planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId, OLEG.playerId]);

      expect(everyoneSeated(plan)).toBe(true);
    });

    it("should not call it seated while two players are still unplaced", () => {
      expect(everyoneSeated(planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId]))).toBe(false);
    });

    it("should not call an untouched screen seated", () => {
      expect(everyoneSeated(planOf(AT_THE_TABLE, NOBODY_SEATED))).toBe(false);
    });
  });

  describe("applySeating, cancelling", () => {
    it("should cancel however many seats are taken", () => {
      const transition = applySeating(planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId]), {
        kind: ActionKind.Cancel,
      });

      expect(transition).toEqual({ outcome: Outcome.Cancelled });
    });
  });

  describe("seatNumberOf", () => {
    it("should number a seated row by when it was tapped, wherever that row is drawn", () => {
      const plan = planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId]);

      expect(seatNumberOf(plan, SECOND_SLOT)).toBe(FIRST_SEAT);
      expect(seatNumberOf(plan, LAST_SLOT)).toBe(SECOND_SEAT);
    });

    it("should give an untapped row no number", () => {
      const plan = planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId]);

      expect(seatNumberOf(plan, FIRST_SLOT)).toBeNull();
      expect(seatNumberOf(plan, THIRD_SLOT)).toBeNull();
    });

    it("should number the forced last seat too, so Play is not offered over a blank row", () => {
      const plan = planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId, OLEG.playerId]);

      expect(seatNumberOf(plan, THIRD_SLOT)).toBe(LAST_SEAT);
    });

    it("should give a slot nobody sits in no number, even once the table is seated", () => {
      const plan = planOf(AT_THE_TABLE, [ANYA.playerId, KIM.playerId, OLEG.playerId]);

      expect(seatNumberOf(plan, AT_THE_TABLE.length)).toBeNull();
    });
  });
});
