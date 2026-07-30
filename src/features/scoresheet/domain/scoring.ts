export interface Contender {
  readonly playerId: number;
  readonly displayName: string;
}

export interface Exit {
  readonly playerId: number;
  readonly position: number;
}

export interface Round {
  readonly placements: readonly Exit[];
}

export type Cell =
  | { readonly kind: "absent" }
  | { readonly kind: "placed"; readonly position: number }
  | { readonly kind: "drawn"; readonly position: number }
  | { readonly kind: "fool"; readonly position: number };

export interface ScoredPlayer {
  readonly playerId: number;
  readonly displayName: string;
  readonly cells: readonly Cell[];
  readonly running: readonly number[];
  readonly total: number;
}

const NOTHING = 0;

const ALONE = 1;

const LAST = -1;

const lastPositionOf = (round: Round): number =>
  round.placements.reduce((furthest, exit) => Math.max(furthest, exit.position), NOTHING);

const sharingCount = (round: Round, position: number): number =>
  round.placements.filter((exit) => exit.position === position).length;

const cellFor = (round: Round, playerId: number): Cell => {
  const exit = round.placements.find((placement) => placement.playerId === playerId);

  if (exit === undefined) {
    return { kind: "absent" };
  }

  if (exit.position !== lastPositionOf(round)) {
    return { kind: "placed", position: exit.position };
  }

  return sharingCount(round, exit.position) === ALONE
    ? { kind: "fool", position: exit.position }
    : { kind: "drawn", position: exit.position };
};

const gainOf = (cell: Cell, tableSize: number): number => {
  switch (cell.kind) {
    case "absent":
      return NOTHING;

    case "placed":
    case "drawn":
    case "fool":
      return tableSize - cell.position;
  }
};

const runningTotals = (gains: readonly number[]): readonly number[] =>
  gains.reduce<readonly number[]>(
    (totals, gain) => [...totals, (totals.at(LAST) ?? NOTHING) + gain],
    []
  );

const scorePlayer = (player: Contender, rounds: readonly Round[]): ScoredPlayer => {
  const cells = rounds.map((round) => cellFor(round, player.playerId));
  const running = runningTotals(
    cells.map((cell, index) => gainOf(cell, rounds[index]?.placements.length ?? NOTHING))
  );

  return {
    playerId: player.playerId,
    displayName: player.displayName,
    cells,
    running,
    total: running.at(LAST) ?? NOTHING,
  };
};

export const scoreSeries = (
  players: readonly Contender[],
  rounds: readonly Round[]
): readonly ScoredPlayer[] => players.map((player) => scorePlayer(player, rounds));
