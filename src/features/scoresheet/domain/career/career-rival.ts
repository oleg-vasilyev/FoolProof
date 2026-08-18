import type { CareerGame, CareerHistory, Finalist } from "#shared/repository/repository-contract.ts";


const NOTHING = 0;

const ONE_PLACE = 1;

const ALONE = 1;

export const ENOUGH_DUELS = 5;

export interface Rival {
  readonly playerId: number;
  readonly displayName: string;
  readonly duels: number;
  readonly lost: number;
}

interface Duel {
  readonly duels: number;
  readonly lost: number;
}

const NO_DUELS: Duel = { duels: NOTHING, lost: NOTHING };

const lastPlaceIn = (placements: readonly Finalist[]): number =>
  placements.reduce((furthest, placement) => Math.max(furthest, placement.position), NOTHING);

const placeOf = (placements: readonly Finalist[], playerId: number): number | null =>
  placements.find((placement) => placement.playerId === playerId)?.position ?? null;

const sharing = (placements: readonly Finalist[], position: number): number =>
  placements.filter((placement) => placement.position === position).length;

const duelIn = (game: CareerGame, playerId: number, rivalId: number): Duel => {
  const mine = placeOf(game.placements, playerId);
  const theirs = placeOf(game.placements, rivalId);
  const last = lastPlaceIn(game.placements);

  if (mine === null || theirs === null) {
    return NO_DUELS;
  }

  if (mine < last - ONE_PLACE || theirs < last - ONE_PLACE) {
    return NO_DUELS;
  }

  const burned = mine === last && sharing(game.placements, last) === ALONE;

  return { duels: ONE_PLACE, lost: burned ? ONE_PLACE : NOTHING };
};

const duelsWith = (history: CareerHistory, playerId: number, rivalId: number): Duel =>
  history.games.reduce<Duel>((tally, game) => {
    const round = duelIn(game, playerId, rivalId);

    return { duels: tally.duels + round.duels, lost: tally.lost + round.lost };
  }, NO_DUELS);

const outranks = (challenger: Rival, holder: Rival): boolean =>
  challenger.lost > holder.lost ||
  (challenger.lost === holder.lost && challenger.duels > holder.duels) ||
  (challenger.lost === holder.lost &&
    challenger.duels === holder.duels &&
    challenger.playerId < holder.playerId);

export const chiefRival = (history: CareerHistory, playerId: number): Rival | null =>
  history.players
    .filter((player) => player.playerId !== playerId)
    .flatMap((player) => {
      const tally = duelsWith(history, playerId, player.playerId);

      return tally.duels < ENOUGH_DUELS || tally.lost === NOTHING
        ? []
        : [{ playerId: player.playerId, displayName: player.displayName, ...tally }];
    })
    .reduce<Rival | null>(
      (holder, challenger) =>
        holder === null || outranks(challenger, holder) ? challenger : holder,
      null
    );
