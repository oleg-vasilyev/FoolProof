import { describe, expect, it } from "vitest";
import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { NEUTRAL, scoreSeries, type Round } from "#scoresheet/domain/scoring.ts";


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

const shareOf = (rounds: readonly Round[], player = OLEG) =>
  scoreSeries([player], rounds)[0]?.share ?? NOTHING;

const gamesOf = (rounds: readonly Round[], player = OLEG) =>
  scoreSeries([player], rounds)[0]?.games ?? NOTHING;

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

    it("should give every player one running share per round", () => {
      const rounds = [roundOf([OLEG.playerId, 1]), roundOf([ANYA.playerId, 1])];

      expect(runningOf(rounds)).toHaveLength(rounds.length);
    });

    it("should give a player who never played a neutral share", () => {
      expect(shareOf([])).toBe(NEUTRAL);
    });

    it("should give a player who never played no games", () => {
      expect(gamesOf([])).toBe(NOTHING);
    });
  });

  describe("what each cell says", () => {
    it("should mark a player who did not sit down as absent", () => {
      expect(cellsOf([roundOf([ANYA.playerId, 1])])).toEqual([{ kind: CellKind.Absent }]);
    });

    it("should mark a position that is not last as placed", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);

      expect(cellsOf([round])).toEqual([{ kind: CellKind.Placed, position: 1 }]);
    });

    it("should mark the player alone in last place as the fool", () => {
      const round = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2], [OLEG.playerId, 3]);
      const LAST_OF_THREE = 3;

      expect(cellsOf([round])).toEqual([{ kind: CellKind.Fool, position: LAST_OF_THREE }]);
    });

    it("should mark a shared last place as a draw rather than a fool", () => {
      const round = roundOf([ROMA.playerId, 1], [OLEG.playerId, 2], [ANYA.playerId, 2]);

      expect(cellsOf([round])).toEqual([{ kind: CellKind.Drawn, position: 2 }]);
    });

    it("should call a two-player draw a draw for both", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 1]);
      const scored = scoreSeries([OLEG, ANYA], [round]);

      expect(scored.map((player) => player.cells[0]?.kind)).toEqual(["drawn", "drawn"]);
    });
  });

  describe("what a round is worth", () => {
    it("should give the front-runner the full share", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);
      const FULL_SHARE = 1;

      expect(shareOf([round])).toBe(FULL_SHARE);
    });

    it("should give the player alone in last place no share", () => {
      const round = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2], [OLEG.playerId, 3]);

      expect(shareOf([round])).toBe(NOTHING);
    });

    it("should give the fool's share as exactly zero, not NaN", () => {
      const round = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2], [OLEG.playerId, 3]);
      const ZERO_SHARE = 0;

      const scored = scoreSeries([OLEG], [round]);

      expect(scored[0]?.cells[0]?.kind).toBe("fool");
      expect(scored[0]?.share).toBe(ZERO_SHARE);
    });

    it("should keep the fool's share and running mean finite numbers", () => {
      const round = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2], [OLEG.playerId, 3]);
      const scored = scoreSeries([OLEG], [round]);

      expect(Number.isFinite(scored[0]?.share)).toBe(true);
      expect(scored[0]?.running.every((mean) => Number.isFinite(mean))).toBe(true);
    });

    it("should give a shared last place (a draw) a share rather than falling through to nothing", () => {
      const round = roundOf([ROMA.playerId, 1], [OLEG.playerId, 2], [ANYA.playerId, 2]);
      const HALF = 0.5;

      expect(shareOf([round])).toBe(HALF);
    });

    it("should split a middling finish by rivals beaten over rivals faced", () => {
      const round = roundOf([ANYA.playerId, 1], [OLEG.playerId, 2], [ROMA.playerId, 3]);
      const HALF = 0.5;

      expect(shareOf([round])).toBe(HALF);
    });

    it("should give the same relative finish the same share at a bigger table (first place)", () => {
      const threeUp = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);
      const fiveUp = roundOf(
        [OLEG.playerId, 1],
        [ANYA.playerId, 2],
        [ROMA.playerId, 3],
        [4, 4],
        [5, 5]
      );

      expect(shareOf([fiveUp])).toBe(shareOf([threeUp]));
    });

    it("should give the same relative finish the same share at a bigger table (mid-table)", () => {
      const threeMid = roundOf([ANYA.playerId, 1], [OLEG.playerId, 2], [ROMA.playerId, 3]);
      const fiveMid = roundOf(
        [ANYA.playerId, 1],
        [ROMA.playerId, 2],
        [OLEG.playerId, 3],
        [4, 4],
        [5, 5]
      );

      expect(shareOf([fiveMid])).toBe(shareOf([threeMid]));
    });

    it("should give a fraction not exact in binary rather than round it away", () => {
      const round = roundOf([ANYA.playerId, 1], [OLEG.playerId, 2], [ROMA.playerId, 3], [4, 4]);
      const TWO_THIRDS = 2 / 3;

      expect(shareOf([round])).toBeCloseTo(TWO_THIRDS);
    });

    it("should floor the divisor at one rival, so a single-placement round does not divide by zero", () => {
      const round = roundOf([OLEG.playerId, 1]);

      expect(() => shareOf([round])).not.toThrow();
      expect(shareOf([round])).toBe(NOTHING);
    });
  });

  describe("absence", () => {
    it("should not drag the mean down for a round the player missed", () => {
      const played = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);
      const missed = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2]);
      const FULL_SHARE = 1;

      expect(shareOf([played, missed])).toBe(FULL_SHARE);
    });

    it("should hold the running mean flat through a round that was sat out", () => {
      const played = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const missed = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2]);
      const FULL_SHARE = 1;

      expect(runningOf([played, missed])).toEqual([FULL_SHARE, FULL_SHARE]);
    });

    it("should not count an absent round as a game played", () => {
      const played = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const missed = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2]);

      expect(gamesOf([played, missed, played])).toBe(2);
    });

    it("should average only the played rounds when an absence sits between two of them", () => {
      const win = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const missed = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2]);
      const loss = roundOf([ANYA.playerId, 1], [OLEG.playerId, 2]);
      const MEAN_OF_PLAYED_ROUNDS_ONLY = 0.5;
      const MEAN_IF_THE_ABSENCE_HAD_COUNTED = 1 / 3;

      const mean = shareOf([win, missed, loss]);

      expect(mean).toBe(MEAN_OF_PLAYED_ROUNDS_ONLY);
      expect(mean).toBeGreaterThan(MEAN_IF_THE_ABSENCE_HAD_COUNTED);
    });

    it("should not let a round sat out between two wins inflate the count of rounds played", () => {
      const firstWin = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const missed = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2]);
      const secondWin = roundOf([OLEG.playerId, 1], [ROMA.playerId, 2]);
      const MEAN_OF_THE_TWO_WINS = 1;
      const MEAN_IF_THE_ABSENCE_HAD_COUNTED = 2 / 3;

      const mean = shareOf([firstWin, missed, secondWin]);

      expect(mean).toBe(MEAN_OF_THE_TWO_WINS);
      expect(mean).toBeGreaterThan(MEAN_IF_THE_ABSENCE_HAD_COUNTED);
    });
  });

  describe("the running mean", () => {
    it("should sit at NEUTRAL before any round is played", () => {
      const missed = roundOf([ANYA.playerId, 1], [ROMA.playerId, 2]);

      expect(runningOf([missed])).toEqual([NEUTRAL]);
    });

    it("should average the shares of the rounds played so far", () => {
      const first = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const second = roundOf([ANYA.playerId, 1], [OLEG.playerId, 2]);
      const FULL_SHARE = 1;
      const AVERAGE = 0.5;

      expect(runningOf([first, second])).toEqual([FULL_SHARE, AVERAGE]);
    });

    it("should end on the same value as the player's share", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2]);
      const scored = scoreSeries([OLEG], [round, round, round]);

      expect(scored[0]?.share).toBe(scored[0]?.running.at(-ONCE));
    });

    it("should start from the first round rather than from zero", () => {
      const round = roundOf([OLEG.playerId, 1], [ANYA.playerId, 2], [ROMA.playerId, 3]);
      const FULL_SHARE = 1;

      expect(runningOf([round])[0]).toBe(FULL_SHARE);
    });
  });
});
