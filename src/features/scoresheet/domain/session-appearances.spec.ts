import { beforeEach, describe, expect, it, vi } from "vitest";
import { CellKind, Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { Cell, ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import { appearanceOf, playerAppearing } from "#scoresheet/domain/session-appearances.stub.ts";


const scoreSeriesSpy = vi.fn();

vi.mock("#scoresheet/domain/scoring.ts", () => ({
  scoreSeries: (players: unknown, rounds: unknown) => scoreSeriesSpy(players, rounds),
}));

const {
  sessionAppearances,
  finishIn,
  firstRoundOf,
  foolByRound,
  foolCount,
  inTopHalf,
  lastRoundOf,
  playedGames,
} = await import("#scoresheet/domain/session-appearances.ts");

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const THRICE = 3;

const FOUR = 4;

const OLEG = 1;

const ANYA = 2;

const scored = (
  playerId: number,
  cells: readonly Cell[],
  share = NOTHING,
  running: readonly number[] = []
): ScoredPlayer => ({
  playerId,
  displayName: `P${String(playerId)}`,
  cells,
  running,
  share,
  games: cells.length,
});

const chronologyOf = (starters: readonly (number | null)[], tableSize = ONCE) => ({
  startedOn: "2026-07-31",
  players: [{ playerId: OLEG, displayName: "Oleg" }],
  games: starters.map((starterId, index) => ({
    gameId: index,
    starterId,
    placements: Array.from({ length: tableSize }, (_, seat) => ({
      playerId: OLEG + seat,
      position: seat + ONCE,
    })),
  })),
});

const eveningWith = (...appearances: readonly PlayerAppearances["appearances"][number][]) =>
  playerAppearing(OLEG, appearances);

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

    expect(sessionAppearances(chronologyOf([])).players.map((player) => player.playerId)).toEqual([
      ANYA,
    ]);
  });

  it("should keep the table share the scoring computed rather than recomputing it", () => {
    const SHARE = 0.61;
    scoreSeriesSpy.mockReturnValue([scored(OLEG, [], SHARE)]);

    expect(sessionAppearances(chronologyOf([])).players[NOTHING]?.share).toBe(SHARE);
  });

  it("should carry the running share the scoring drew the chart from", () => {
    const CURVE = [0.5, 0.75];
    scoreSeriesSpy.mockReturnValue([scored(OLEG, [], NOTHING, CURVE)]);

    expect(sessionAppearances(chronologyOf([])).players[NOTHING]?.running).toBe(CURVE);
  });

  describe("appearances", () => {
    const appearancesFor = (...cells: readonly Cell[]) => {
      scoreSeriesSpy.mockReturnValue([scored(OLEG, cells)]);

      return sessionAppearances(chronologyOf([])).players[NOTHING]?.appearances ?? [];
    };

    const atTableOf = (tableSize: number, ...cells: readonly Cell[]) => {
      scoreSeriesSpy.mockReturnValue([scored(OLEG, cells)]);

      return (
        sessionAppearances(chronologyOf(cells.map(() => OLEG), tableSize)).players[NOTHING]
          ?.appearances ?? []
      );
    };

    it("should leave out the games the player sat out", () => {
      expect(
        appearancesFor({ kind: CellKind.Absent }, { kind: CellKind.Fool, position: TWICE })
      ).toHaveLength(ONCE);
    });

    it("should number a round by its place in the session, not by the appearance", () => {
      const appearances = appearancesFor(
        { kind: CellKind.Absent },
        { kind: CellKind.Placed, position: ONCE }
      );

      expect(appearances[NOTHING]?.round).toBe(ONCE);
    });

    it("should carry the place taken, not only how it is named", () => {
      expect(appearancesFor({ kind: CellKind.Placed, position: THRICE })[NOTHING]?.position).toBe(
        THRICE
      );
    });

    it("should carry how many sat at that game's table", () => {
      expect(atTableOf(FOUR, { kind: CellKind.Placed, position: ONCE })[NOTHING]?.tableSize).toBe(
        FOUR
      );
    });

    it("should report an empty table for a round the chronology does not have", () => {
      scoreSeriesSpy.mockReturnValue([scored(OLEG, [{ kind: CellKind.Placed, position: ONCE }])]);

      expect(
        sessionAppearances(chronologyOf([])).players[NOTHING]?.appearances[NOTHING]?.tableSize
      ).toBe(NOTHING);
    });

    it("should call going out first a first", () => {
      expect(appearancesFor({ kind: CellKind.Placed, position: ONCE })[NOTHING]?.finish).toBe(
        Finish.First
      );
    });

    it("should call any other place a middle", () => {
      expect(appearancesFor({ kind: CellKind.Placed, position: TWICE })[NOTHING]?.finish).toBe(
        Finish.Middle
      );
    });

    it("should call a shared last place a draw rather than a fool", () => {
      expect(appearancesFor({ kind: CellKind.Drawn, position: TWICE })[NOTHING]?.finish).toBe(
        Finish.Drawn
      );
    });

    it("should call being left alone at the back a fool", () => {
      expect(appearancesFor({ kind: CellKind.Fool, position: TWICE })[NOTHING]?.finish).toBe(
        Finish.Fool
      );
    });
  });
});

describe("playedGames()", () => {
  it("should count the games the player actually sat", () => {
    const player = eveningWith(
      appearanceOf(NOTHING, Finish.First),
      appearanceOf(TWICE, Finish.Fool)
    );

    expect(playedGames(player)).toBe(TWICE);
  });
});

describe("foolCount()", () => {
  it("should count only the games left the fool", () => {
    const player = eveningWith(
      appearanceOf(NOTHING, Finish.Fool),
      appearanceOf(ONCE, Finish.Drawn),
      appearanceOf(TWICE, Finish.Fool)
    );

    expect(foolCount(player)).toBe(TWICE);
  });

  it("should not count a draw as a fool", () => {
    expect(foolCount(eveningWith(appearanceOf(NOTHING, Finish.Drawn)))).toBe(NOTHING);
  });
});

describe("lastRoundOf()", () => {
  it("should report the round of the player's final appearance, not of the second", () => {
    const player = eveningWith(
      appearanceOf(NOTHING, Finish.First),
      appearanceOf(ONCE, Finish.Middle),
      appearanceOf(FOUR, Finish.Middle)
    );

    expect(lastRoundOf(player)).toBe(FOUR);
  });

  it("should report nothing for somebody who never played", () => {
    expect(lastRoundOf(eveningWith())).toBeNull();
  });
});

describe("firstRoundOf()", () => {
  it("should report the round the player first sat down", () => {
    const player = eveningWith(
      appearanceOf(TWICE, Finish.First),
      appearanceOf(THRICE, Finish.Middle)
    );

    expect(firstRoundOf(player)).toBe(TWICE);
  });

  it("should report nothing for somebody who never played", () => {
    expect(firstRoundOf(eveningWith())).toBeNull();
  });
});

describe("inTopHalf()", () => {
  it("should count going out first at a table of four as the top half", () => {
    expect(inTopHalf(appearanceOf(NOTHING, Finish.First, ONCE, FOUR))).toBe(true);
  });

  it("should count the exact middle seat of an even table as the top half", () => {
    expect(inTopHalf(appearanceOf(NOTHING, Finish.Middle, TWICE, FOUR))).toBe(true);
  });

  it("should count the place after the middle as the bottom half", () => {
    expect(inTopHalf(appearanceOf(NOTHING, Finish.Middle, THRICE, FOUR))).toBe(false);
  });

  it("should count the fool as the bottom half", () => {
    expect(inTopHalf(appearanceOf(NOTHING, Finish.Fool, FOUR, FOUR))).toBe(false);
  });
});

describe("finishIn()", () => {
  it("should report how the player finished that round", () => {
    expect(finishIn(eveningWith(appearanceOf(TWICE, Finish.Fool)), TWICE)).toBe(Finish.Fool);
  });

  it("should report nothing for a round the player sat out", () => {
    expect(finishIn(eveningWith(appearanceOf(TWICE, Finish.Fool)), ONCE)).toBeNull();
  });
});

describe("foolByRound()", () => {
  const eveningFor = (players: readonly PlayerAppearances[], rounds: number) => ({
    rounds,
    players,
    starters: [],
  });

  it("should name the fool of every round", () => {
    const oleg = playerAppearing(OLEG, [appearanceOf(NOTHING, Finish.Fool)]);
    const anya = playerAppearing(ANYA, [appearanceOf(ONCE, Finish.Fool)]);

    expect(foolByRound(eveningFor([oleg, anya], TWICE))).toEqual([OLEG, ANYA]);
  });

  it("should leave a drawn round without a fool", () => {
    const oleg = playerAppearing(OLEG, [appearanceOf(NOTHING, Finish.Drawn)]);

    expect(foolByRound(eveningFor([oleg], ONCE))).toEqual([null]);
  });
});
