import { scoreSeries, type Cell, type Contender, type Round } from "#scoresheet/domain/scoring.ts";
import { CellKind, Finish } from "#scoresheet/domain/game-outcomes.ts";


const FIRST_OUT = 1;

const LAST = -1;

const HALF = 2;

const EMPTY_TABLE = 0;

export interface Appearance {
  readonly round: number;
  readonly finish: Finish;
  readonly position: number;
  readonly tableSize: number;
}

export interface PlayerAppearances {
  readonly playerId: number;
  readonly share: number;
  readonly running: readonly number[];
  readonly appearances: readonly Appearance[];
}

export interface SessionAppearances {
  readonly rounds: number;
  readonly players: readonly PlayerAppearances[];
  readonly starters: readonly (number | null)[];
}

const finishOf = (cell: Exclude<Cell, { kind: typeof CellKind.Absent }>): Finish => {
  switch (cell.kind) {
    case CellKind.Drawn:
      return Finish.Drawn;

    case CellKind.Fool:
      return Finish.Fool;

    case CellKind.Placed:
      return cell.position === FIRST_OUT ? Finish.First : Finish.Middle;
  }
};

const appearancesOf = (
  cells: readonly Cell[],
  tableSizes: readonly number[]
): readonly Appearance[] =>
  cells.flatMap((cell, round) =>
    cell.kind === CellKind.Absent
      ? []
      : [
          {
            round,
            finish: finishOf(cell),
            position: cell.position,
            tableSize: tableSizes[round] ?? EMPTY_TABLE,
          },
        ]
  );

export interface RecordedGame extends Round {
  readonly starterId: number | null;
}

export interface RecordedSeries {
  readonly players: readonly Contender[];
  readonly games: readonly RecordedGame[];
}

export const sessionAppearances = (chronology: RecordedSeries): SessionAppearances => {
  const tableSizes = chronology.games.map((game) => game.placements.length);

  return {
    rounds: chronology.games.length,
    players: scoreSeries(chronology.players, chronology.games).map((player) => ({
      playerId: player.playerId,
      share: player.share,
      running: player.running,
      appearances: appearancesOf(player.cells, tableSizes),
    })),
    starters: chronology.games.map((game) => game.starterId),
  };
};

export const playedGames = (player: PlayerAppearances): number => player.appearances.length;

export const foolCount = (player: PlayerAppearances): number =>
  player.appearances.filter((appearance) => appearance.finish === Finish.Fool).length;

export const lastRoundOf = (player: PlayerAppearances): number | null =>
  player.appearances.at(LAST)?.round ?? null;

export const firstRoundOf = (player: PlayerAppearances): number | null =>
  player.appearances[EMPTY_TABLE]?.round ?? null;

export const inTopHalf = (appearance: Appearance): boolean =>
  appearance.position <= appearance.tableSize / HALF;

export const finishIn = (player: PlayerAppearances, round: number): Finish | null =>
  player.appearances.find((appearance) => appearance.round === round)?.finish ?? null;

export const foolByRound = (evening: SessionAppearances): readonly (number | null)[] =>
  Array.from(
    { length: evening.rounds },
    (_, round) =>
      evening.players.find((player) => finishIn(player, round) === Finish.Fool)?.playerId ?? null
  );

export const tableSizeIn = (evening: SessionAppearances, round: number): number =>
  evening.players
    .flatMap((player) => player.appearances)
    .find((appearance) => appearance.round === round)?.tableSize ?? EMPTY_TABLE;
