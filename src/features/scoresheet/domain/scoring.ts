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
  readonly share: number;
  readonly games: number;
}

interface Tally {
  readonly shareSum: number;
  readonly played: number;
  readonly running: readonly number[];
}

const NOTHING = 0;

const ALONE = 1;

const LAST = -1;

const ONE_SEAT = 1;

const ONE_ROUND = 1;

const FEWEST_RIVALS = 1;

export const NEUTRAL = 0.5;

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

const shareOf = (cell: Cell, tableSize: number): number | null => {
  switch (cell.kind) {
    case "absent":
      return null;

    case "placed":
    case "drawn":
    case "fool":
      return (tableSize - cell.position) / Math.max(FEWEST_RIVALS, tableSize - ONE_SEAT);
  }
};

const meanOf = (shareSum: number, played: number): number =>
  played === NOTHING ? NEUTRAL : shareSum / played;

const runningShares = (shares: readonly (number | null)[]): readonly number[] =>
  shares.reduce<Tally>(
    (tally, share) => {
      const shareSum = share === null ? tally.shareSum : tally.shareSum + share;
      const played = share === null ? tally.played : tally.played + ONE_ROUND;

      return { shareSum, played, running: [...tally.running, meanOf(shareSum, played)] };
    },
    { shareSum: NOTHING, played: NOTHING, running: [] }
  ).running;

const scorePlayer = (player: Contender, rounds: readonly Round[]): ScoredPlayer => {
  const cells = rounds.map((round) => cellFor(round, player.playerId));
  const shares = cells.map((cell, index) =>
    shareOf(cell, rounds[index]?.placements.length ?? NOTHING)
  );
  const running = runningShares(shares);

  return {
    playerId: player.playerId,
    displayName: player.displayName,
    cells,
    running,
    share: running.at(LAST) ?? NEUTRAL,
    games: shares.filter((share) => share !== null).length,
  };
};

export const scoreSeries = (
  players: readonly Contender[],
  rounds: readonly Round[]
): readonly ScoredPlayer[] => players.map((player) => scorePlayer(player, rounds));
