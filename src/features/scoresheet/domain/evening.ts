import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import { scoreSeries, type Cell } from "#scoresheet/domain/scoring.ts";


const FIRST_OUT = 1;

const LAST = -1;

export type Finish = "first" | "middle" | "drawn" | "fool";

export interface Appearance {
  readonly round: number;
  readonly finish: Finish;
}

export interface PlayerEvening {
  readonly playerId: number;
  readonly share: number;
  readonly appearances: readonly Appearance[];
}

export interface Evening {
  readonly rounds: number;
  readonly players: readonly PlayerEvening[];
  readonly starters: readonly (number | null)[];
}

const finishOf = (cell: Exclude<Cell, { kind: "absent" }>): Finish => {
  switch (cell.kind) {
    case "drawn":
      return "drawn";

    case "fool":
      return "fool";

    case "placed":
      return cell.position === FIRST_OUT ? "first" : "middle";
  }
};

const appearancesOf = (cells: readonly Cell[]): readonly Appearance[] =>
  cells.flatMap((cell, round) =>
    cell.kind === "absent" ? [] : [{ round, finish: finishOf(cell) }]
  );

export const eveningOf = (chronology: SeriesChronology): Evening => ({
  rounds: chronology.games.length,
  players: scoreSeries(chronology.players, chronology.games).map((player) => ({
    playerId: player.playerId,
    share: player.share,
    appearances: appearancesOf(player.cells),
  })),
  starters: chronology.games.map((game) => game.starterId),
});

export const playedGames = (player: PlayerEvening): number => player.appearances.length;

export const foolCount = (player: PlayerEvening): number =>
  player.appearances.filter((appearance) => appearance.finish === "fool").length;

export const lastRoundOf = (player: PlayerEvening): number | null =>
  player.appearances.at(LAST)?.round ?? null;

export const finishIn = (player: PlayerEvening, round: number): Finish | null =>
  player.appearances.find((appearance) => appearance.round === round)?.finish ?? null;

export const foolByRound = (evening: Evening): readonly (number | null)[] =>
  Array.from(
    { length: evening.rounds },
    (_, round) =>
      evening.players.find((player) => finishIn(player, round) === "fool")?.playerId ?? null
  );
