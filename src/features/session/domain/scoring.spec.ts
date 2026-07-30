import { describe, expect, it } from "vitest";
import { scoreSeries, type Round } from "./scoring.ts";


const OLEG = { playerId: 1, displayName: "Oleg" };

const ANYA = { playerId: 2, displayName: "Anya" };

const ROMA = { playerId: 3, displayName: "Roma" };

const THREE_PLAYERS = [OLEG, ANYA, ROMA];

const NOTHING = 0;

const ONCE = 1;

const roundOf = (...placements: readonly (readonly [number, number])[]): Round => ({
  placements: placements.map(([playerId, position]) => ({ playerId, position })),
});

const cellsOf = (rounds: readonly Round[], player = OLEG) =>
  scoreSeries([player], rounds)[0]?.cells ?? [];

const runningOf = (rounds: readonly Round[], player = OLEG) =>
  scoreSeries([player], rounds)[0]?.running ?? [];

const totalOf = (rounds: readonly Round[], player = OLEG) =>
  scoreSeries([player], rounds)[0]?.total ?? NOTHING;

describe("scoreSeries()", () => {
  describe("the shape of the result", () => {
    it("should return one row per player, in the order given", () => {
      const scored = scoreSeries(THREE_PLAYERS, [roundOf([OLEG.playerId, 1])]);

      expect(scored.map((player) => player.displayName)).toEqual(["Oleg", "Anya", "Roma"]);
    });

    it("should carry each player's id through", () => {
      const scored = scoreSeries([ANYA], []);

      expect(scored[0]?.playerId).toBe(ANYA.playerId);
    });

    it("should give every player one cell per round", () => {
      const rounds = [roundOf([OLEG.playerId, 1]), roundOf([ANYA.playerId, 1])];

      expect(cellsOf(rounds)).toHaveLength(rounds.length);
    });

    it("should give every player one running total per round", () => {
      const rounds = [roundOf([OLEG.playerId, 1]), roundOf([ANYA.playerId, 1])];

      expect(runningOf(rounds)).toHaveLength(rounds.length);
    });

    it("should score a player who has played nothing at zero", () => {
      expect(totalOf([])).toBe(NOTHING);
    });
  });

  describe("what each cell says", () => {
    it("should mark a player who did not sit down as absent", () => {
      expect(cellsOf([roundOf([ANYA.playerId, 1])])).toEqual([{ kind: "absent" }]);
    });

    it("should mark a position that is not last as placed", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);

      expect(cellsOf([round])).toEqual([{ kind: "placed", position: 1 }]);
    });

    it("should mark the player alone in last place as the fool", () => {
      const round = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2], [OLEG.playerId, 3]);
      const LAST_OF_THREE = 3;

      expect(cellsOf([round])).toEqual([{ kind: "fool", position: LAST_OF_THREE }]);
    });

    it("should mark a shared last place as a draw rather than a fool", () => {
      const round = roundOf([ROMA.playerId, 1], [OLEG.playerId, 2], [ANYA.playerId, 2]);

      expect(cellsOf([round])).toEqual([{ kind: "drawn", position: 2 }]);
    });

    it("should call a two-player draw a draw for both", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 1]);
      const scored = scoreSeries([OLEG, ANYA], [round]);

      expect(scored.map((player) => player.cells[0]?.kind)).toEqual(["drawn", "drawn"]);
    });
  });

  describe("what a place is worth", () => {
    it("should pay one point per player left behind", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);
      const BEATEN_TWO = 2;

      expect(totalOf([round])).toBe(BEATEN_TWO);
    });

    it("should pay the fool nothing", () => {
      const round = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2], [OLEG.playerId, 3]);

      expect(totalOf([round])).toBe(NOTHING);
    });

    it("should pay more for the same place at a bigger table", () => {
      const small = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const big = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);

      expect(totalOf([big])).toBeGreaterThan(totalOf([small]));
    });

    it("should pay both players of a draw the same", () => {
      const round = roundOf([ROMA.playerId, 1], [OLEG.playerId, 2], [ANYA.playerId, 2]);
      const scored = scoreSeries([OLEG, ANYA], [round]);

      expect(scored[0]?.total).toBe(scored[1]?.total);
    });

    it("should pay nothing for a game that was sat out", () => {
      expect(totalOf([roundOf([ANYA.playerId, 1], [ROMA.playerId, 2])])).toBe(NOTHING);
    });
  });

  describe("the running total", () => {
    it("should accumulate across games", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);

      expect(runningOf([round, round])).toEqual([2, 4]);
    });

    it("should hold flat through a game that was sat out", () => {
      const played = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const missed = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2]);

      expect(runningOf([played, missed, played])).toEqual([ONCE, ONCE, 2]);
    });

    it("should start from the first game rather than from zero", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);

      expect(runningOf([round])[0]).toBe(2);
    });

    it("should end on the same number as the total", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const scored = scoreSeries([OLEG], [round, round, round]);

      expect(scored[0]?.total).toBe(scored[0]?.running.at(-ONCE));
    });
  });
});
