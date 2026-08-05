import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import { scoreSeries, type Cell } from "#scoresheet/domain/scoring.ts";
import { CellKind, Finish } from "#scoresheet/domain/game-outcomes.ts";


const FIRST_OUT = 1;

const LAST = -1;

export interface Appearance {
  readonly round: number;
  readonly finish: Finish;
}

export interface PlayerAppearances {
  readonly playerId: number;
  readonly share: number;
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

const appearancesOf = (cells: readonly Cell[]): readonly Appearance[] =>
  cells.flatMap((cell, round) =>
    cell.kind === CellKind.Absent ? [] : [{ round, finish: finishOf(cell) }]
  );

export const sessionAppearances = (chronology: SeriesChronology): SessionAppearances => ({
  rounds: chronology.games.length,
  players: scoreSeries(chronology.players, chronology.games).map((player) => ({
    playerId: player.playerId,
    share: player.share,
    appearances: appearancesOf(player.cells),
  })),
  starters: chronology.games.map((game) => game.starterId),
});

export const playedGames = (player: PlayerAppearances): number => player.appearances.length;

export const foolCount = (player: PlayerAppearances): number =>
  player.appearances.filter((appearance) => appearance.finish === Finish.Fool).length;

export const lastRoundOf = (player: PlayerAppearances): number | null =>
  player.appearances.at(LAST)?.round ?? null;

export const finishIn = (player: PlayerAppearances, round: number): Finish | null =>
  player.appearances.find((appearance) => appearance.round === round)?.finish ?? null;

export const foolByRound = (evening: SessionAppearances): readonly (number | null)[] =>
  Array.from(
    { length: evening.rounds },
    (_, round) =>
      evening.players.find((player) => finishIn(player, round) === Finish.Fool)?.playerId ?? null
  );
