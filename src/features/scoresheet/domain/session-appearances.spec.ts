import { beforeEach, describe, expect, it, vi } from "vitest";
import { CellKind, Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { Cell, ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";


const scoreSeriesSpy = vi.fn();

vi.mock("#scoresheet/domain/scoring.ts", () => ({
  scoreSeries: (players: unknown, rounds: unknown) => scoreSeriesSpy(players, rounds),
}));

const { sessionAppearances, finishIn, foolByRound, foolCount, lastRoundOf, playedGames } = await import(
  "#scoresheet/domain/session-appearances.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const OLEG = 1;

const ANYA = 2;

const scored = (playerId: number, cells: readonly Cell[], share = NOTHING): ScoredPlayer => ({
  playerId,
  displayName: `P${String(playerId)}`,
  cells,
  running: [],
  share,
  games: cells.length,
});

const chronologyOf = (starters: readonly (number | null)[]) => ({
  startedOn: "2026-07-31",
  players: [{ playerId: OLEG, displayName: "Oleg" }],
  games: starters.map((starterId, index) => ({
    gameId: index,
    starterId,
    placements: [{ playerId: OLEG, position: ONCE }],
  })),
});

const eveningWith = (...appearances: readonly PlayerAppearances["appearances"][number][]) => ({
  playerId: OLEG,
  share: NOTHING,
  appearances,
});

describe("sessionAppearances()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    scoreSeriesSpy.mockReturnValue([]);
  });

  it("should score the chronology's own players over its own games", () => {
    const chronology = chronologyOf([OLEG]);

    sessionAppearances(chronology);

    expect(scoreSeriesSpy).toHaveBeenCalledWith(chronology.players, chronology.games);
  });

  it("should count one round per game played", () => {
    expect(sessionAppearances(chronologyOf([OLEG, ANYA])).rounds).toBe(TWICE);
  });

  it("should carry who dealt each game, in order", () => {
    expect(sessionAppearances(chronologyOf([ANYA, null])).starters).toEqual([ANYA, null]);
  });

  it("should keep the player ids the scoring gave", () => {
    scoreSeriesSpy.mockReturnValue([scored(ANYA, [])]);

    expect(sessionAppearances(chronologyOf([])).players.map((player) => player.playerId)).toEqual([ANYA]);
  });

  it("should keep the table share the scoring computed rather than recomputing it", () => {
    const SHARE = 0.61;
    scoreSeriesSpy.mockReturnValue([scored(OLEG, [], SHARE)]);

    expect(sessionAppearances(chronologyOf([])).players[NOTHING]?.share).toBe(SHARE);
  });

  describe("appearances", () => {
    const appearancesFor = (...cells: readonly Cell[]) => {
      scoreSeriesSpy.mockReturnValue([scored(OLEG, cells)]);

      return sessionAppearances(chronologyOf([])).players[NOTHING]?.appearances ?? [];
    };

    it("should leave out the games the player sat out", () => {
      expect(appearancesFor({ kind: CellKind.Absent }, { kind: CellKind.Fool, position: TWICE })).toHaveLength(
        ONCE
      );
    });

    it("should number a round by its place in the session, not by the appearance", () => {
      const appearances = appearancesFor({ kind: CellKind.Absent }, { kind: CellKind.Placed, position: ONCE });

      expect(appearances[NOTHING]?.round).toBe(ONCE);
    });

    it("should call going out first a first", () => {
      expect(appearancesFor({ kind: CellKind.Placed, position: ONCE })[NOTHING]?.finish).toBe("first");
    });

    it("should call any other place a middle", () => {
      expect(appearancesFor({ kind: CellKind.Placed, position: TWICE })[NOTHING]?.finish).toBe("middle");
    });

    it("should call a shared last place a draw rather than a fool", () => {
      expect(appearancesFor({ kind: CellKind.Drawn, position: TWICE })[NOTHING]?.finish).toBe("drawn");
    });

    it("should call being left alone at the back a fool", () => {
      expect(appearancesFor({ kind: CellKind.Fool, position: TWICE })[NOTHING]?.finish).toBe("fool");
    });
  });
});

describe("playedGames()", () => {
  it("should count the games the player actually sat", () => {
    const player = eveningWith(
      { round: NOTHING, finish: Finish.First },
      { round: TWICE, finish: Finish.Fool }
    );

    expect(playedGames(player)).toBe(TWICE);
  });
});

describe("foolCount()", () => {
  it("should count only the games left the fool", () => {
    const player = eveningWith(
      { round: NOTHING, finish: Finish.Fool },
      { round: ONCE, finish: Finish.Drawn },
      { round: TWICE, finish: Finish.Fool }
    );

    expect(foolCount(player)).toBe(TWICE);
  });

  it("should not count a draw as a fool", () => {
    expect(foolCount(eveningWith({ round: NOTHING, finish: Finish.Drawn }))).toBe(NOTHING);
  });
});

describe("lastRoundOf()", () => {
  it("should report the round of the player's final appearance", () => {
    const player = eveningWith(
      { round: NOTHING, finish: Finish.First },
      { round: TWICE, finish: Finish.Middle }
    );

    expect(lastRoundOf(player)).toBe(TWICE);
  });

  it("should report nothing for somebody who never played", () => {
    expect(lastRoundOf(eveningWith())).toBeNull();
  });
});

describe("finishIn()", () => {
  it("should report how the player finished that round", () => {
    expect(finishIn(eveningWith({ round: TWICE, finish: Finish.Fool }), TWICE)).toBe("fool");
  });

  it("should report nothing for a round the player sat out", () => {
    expect(finishIn(eveningWith({ round: TWICE, finish: Finish.Fool }), ONCE)).toBeNull();
  });
});

describe("foolByRound()", () => {
  const eveningFor = (players: readonly PlayerAppearances[], rounds: number) => ({
    rounds,
    players,
    starters: [],
  });

  it("should name the fool of every round", () => {
    const oleg = { playerId: OLEG, share: NOTHING, appearances: [{ round: NOTHING, finish: Finish.Fool }] };
    const anya = { playerId: ANYA, share: NOTHING, appearances: [{ round: ONCE, finish: Finish.Fool }] };

    expect(foolByRound(eveningFor([oleg, anya], TWICE))).toEqual([OLEG, ANYA]);
  });

  it("should leave a drawn round without a fool", () => {
    const oleg = { playerId: OLEG, share: NOTHING, appearances: [{ round: NOTHING, finish: Finish.Drawn }] };

    expect(foolByRound(eveningFor([oleg], ONCE))).toEqual([null]);
  });
});
