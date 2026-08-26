import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
import { Problem } from "#live-game/domain/refusals.ts";
import { describe, expect, it, vi } from "vitest";
import type { LeavingPlan } from "#live-game/domain/leaving-plan.ts";


const MOCKED_MIN_PLAYERS = 3;

const ONE_SHORT_OF_MINIMUM = MOCKED_MIN_PLAYERS - 1;

vi.mock("#live-game/domain/card-state.ts", () => ({
  MIN_PLAYERS: MOCKED_MIN_PLAYERS,
}));

const { applyLeaving, stayingIn } = await import("#live-game/domain/leaving-plan.ts");

const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const ROMA = { playerId: 12, displayName: "Roma" };

const KIM = { playerId: 41, displayName: "Kim" };

const DIMA = { playerId: 55, displayName: "Dima" };

const STRANGER_ID = 99;

const planOf = (roster: LeavingPlan["roster"], leaving: LeavingPlan["leaving"]): LeavingPlan => ({
  roster,
  leaving,
});

const planAfterPicking = (plan: LeavingPlan, playerId: number): LeavingPlan => {
  const transition = applyLeaving(plan, { kind: ActionKind.Pick, playerId });

  if (transition.outcome !== Outcome.Updated) {
    throw new Error(transition.outcome);
  }

  return transition.plan;
};

describe("leaving-plan", () => {
  describe("stayingIn()", () => {
    it("should keep the whole roster while nobody is marked", () => {
      expect(stayingIn(planOf([OLEG, ANYA, ROMA], []))).toEqual([OLEG, ANYA, ROMA]);
    });

    it("should drop the marked players and keep the rest in the roster's own order", () => {
      const plan = planOf([OLEG, ANYA, ROMA, KIM, DIMA], [KIM.playerId, ANYA.playerId]);

      expect(stayingIn(plan)).toEqual([OLEG, ROMA, DIMA]);
    });

    it("should keep nobody once every player is marked", () => {
      const plan = planOf([OLEG, ANYA], [ANYA.playerId, OLEG.playerId]);

      expect(stayingIn(plan)).toEqual([]);
    });
  });

  describe("applyLeaving(), picking a player", () => {
    it("should mark a player nobody has marked yet", () => {
      const transition = applyLeaving(planOf([OLEG, ANYA, ROMA, KIM], []), {
        kind: ActionKind.Pick,
        playerId: ANYA.playerId,
      });

      expect(transition).toEqual({
        outcome: Outcome.Updated,
        plan: { roster: [OLEG, ANYA, ROMA, KIM], leaving: [ANYA.playerId] },
        toggled: ANYA,
        sittingOut: true,
      });
    });

    it("should keep the players already marked when marking another", () => {
      const transition = applyLeaving(planOf([OLEG, ANYA, ROMA, KIM], [KIM.playerId]), {
        kind: ActionKind.Pick,
        playerId: ANYA.playerId,
      });

      expect(transition).toEqual({
        outcome: Outcome.Updated,
        plan: { roster: [OLEG, ANYA, ROMA, KIM], leaving: [KIM.playerId, ANYA.playerId] },
        toggled: ANYA,
        sittingOut: true,
      });
    });

    it("should unmark a player who is already marked, leaving the other marks alone", () => {
      const transition = applyLeaving(
        planOf([OLEG, ANYA, ROMA, KIM], [ANYA.playerId, KIM.playerId]),
        { kind: ActionKind.Pick, playerId: ANYA.playerId }
      );

      expect(transition).toEqual({
        outcome: Outcome.Updated,
        plan: { roster: [OLEG, ANYA, ROMA, KIM], leaving: [KIM.playerId] },
        toggled: ANYA,
        sittingOut: false,
      });
    });

    it("should put a player back at the table when the same tap comes twice", () => {
      const plan = planOf([OLEG, ANYA, ROMA, KIM], []);

      const afterOneTap = planAfterPicking(plan, ANYA.playerId);
      const afterTwoTaps = planAfterPicking(afterOneTap, ANYA.playerId);

      expect(afterOneTap.leaving).toEqual([ANYA.playerId]);
      expect(afterTwoTaps.leaving).toEqual([]);
    });

    it("should hand back a new plan and leave the one it was given untouched", () => {
      const plan = planOf([OLEG, ANYA, ROMA, KIM], [KIM.playerId]);

      const next = planAfterPicking(plan, ANYA.playerId);

      expect(next).not.toBe(plan);
      expect(next.leaving).not.toBe(plan.leaving);
      expect(plan).toEqual({ roster: [OLEG, ANYA, ROMA, KIM], leaving: [KIM.playerId] });
    });

    it("should refuse a player who is not in the roster, saying the name is unknown", () => {
      const transition = applyLeaving(planOf([OLEG, ANYA, ROMA, KIM], []), {
        kind: ActionKind.Pick,
        playerId: STRANGER_ID,
      });

      expect(transition).toEqual({ outcome: Outcome.Rejected, problem: Problem.UnknownNames });
    });
  });

  describe("applyLeaving(), stepping back", () => {
    it("should unmark the player marked most recently, not the first one picked", () => {
      const transition = applyLeaving(planOf([OLEG, ANYA, ROMA, KIM], [ANYA.playerId, KIM.playerId]), {
        kind: ActionKind.Back,
      });

      expect(transition).toEqual({
        outcome: Outcome.SteppedBack,
        plan: { roster: [OLEG, ANYA, ROMA, KIM], leaving: [ANYA.playerId] },
      });
    });

    it("should leave nobody marked after the only mark is taken back", () => {
      const transition = applyLeaving(planOf([OLEG, ANYA, ROMA], [ANYA.playerId]), {
        kind: ActionKind.Back,
      });

      expect(transition).toEqual({
        outcome: Outcome.SteppedBack,
        plan: { roster: [OLEG, ANYA, ROMA], leaving: [] },
      });
    });

    it("should refuse to step back with nothing marked, which only a forged tap can ask", () => {
      const transition = applyLeaving(planOf([OLEG, ANYA, ROMA], []), { kind: ActionKind.Back });

      expect(transition).toEqual({ outcome: Outcome.Rejected, problem: Problem.NothingYet });
    });

    it("should not mutate the marks it was given", () => {
      const leaving = [ANYA.playerId, KIM.playerId];

      applyLeaving(planOf([OLEG, ANYA, ROMA, KIM], leaving), { kind: ActionKind.Back });

      expect(leaving).toEqual([ANYA.playerId, KIM.playerId]);
    });
  });

  describe("applyLeaving(), confirming", () => {
    it("should seat exactly the players who were not marked, in the roster's own order", () => {
      const transition = applyLeaving(planOf([OLEG, ANYA, ROMA, KIM, DIMA], [ANYA.playerId]), {
        kind: ActionKind.Confirm,
      });

      expect(transition).toEqual({ outcome: Outcome.Seated, seats: [OLEG, ROMA, KIM, DIMA] });
    });

    it("should seat a table left with exactly the minimum the domain allows", () => {
      const plan = planOf([OLEG, ANYA, ROMA, KIM], [KIM.playerId]);

      expect(stayingIn(plan)).toHaveLength(MOCKED_MIN_PLAYERS);
      expect(applyLeaving(plan, { kind: ActionKind.Confirm })).toEqual({
        outcome: Outcome.Seated,
        seats: [OLEG, ANYA, ROMA],
      });
    });

    it("should refuse a table left one player short of that minimum", () => {
      const plan = planOf([OLEG, ANYA, ROMA, KIM], [ROMA.playerId, KIM.playerId]);

      expect(stayingIn(plan)).toHaveLength(ONE_SHORT_OF_MINIMUM);
      expect(applyLeaving(plan, { kind: ActionKind.Confirm })).toEqual({
        outcome: Outcome.Rejected,
        problem: Problem.TooFew,
      });
    });

    it("should refuse to empty the table when every player is marked", () => {
      const plan = planOf([OLEG, ANYA, ROMA], [OLEG.playerId, ANYA.playerId, ROMA.playerId]);

      expect(applyLeaving(plan, { kind: ActionKind.Confirm })).toEqual({
        outcome: Outcome.Rejected,
        problem: Problem.TooFew,
      });
    });
  });

  describe("applyLeaving(), cancelling", () => {
    it("should cancel however many players are marked", () => {
      const nobodyMarked = planOf([OLEG, ANYA, ROMA, KIM], []);
      const twoMarked = planOf([OLEG, ANYA, ROMA, KIM], [ANYA.playerId, KIM.playerId]);

      expect(applyLeaving(nobodyMarked, { kind: ActionKind.Cancel })).toEqual({
        outcome: Outcome.Cancelled,
      });
      expect(applyLeaving(twoMarked, { kind: ActionKind.Cancel })).toEqual({
        outcome: Outcome.Cancelled,
      });
    });
  });
});
