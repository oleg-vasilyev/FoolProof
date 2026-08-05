import { playedGames, type PlayerEvening } from "#scoresheet/domain/evening.ts";


export type Merit = (player: PlayerEvening) => number | null;

const ALONE = 1;

interface Ranked {
  readonly player: PlayerEvening;
  readonly merit: number;
}

const outranks = (challenger: Ranked, holder: Ranked): boolean => {
  if (challenger.merit !== holder.merit) {
    return challenger.merit > holder.merit;
  }

  const theirs = playedGames(challenger.player);
  const held = playedGames(holder.player);

  return theirs === held ? challenger.player.playerId < holder.player.playerId : theirs > held;
};

export const bestBy = (players: readonly PlayerEvening[], merit: Merit): PlayerEvening | null =>
  players
    .flatMap((player) => {
      const earned = merit(player);

      return earned === null ? [] : [{ player, merit: earned }];
    })
    .reduce<Ranked | null>(
      (holder, challenger) =>
        holder === null || outranks(challenger, holder) ? challenger : holder,
      null
    )?.player ?? null;

export const soleBy = (
  players: readonly PlayerEvening[],
  qualifies: (player: PlayerEvening) => boolean
): PlayerEvening | null => {
  const qualified = players.filter(qualifies);
  const [only] = qualified;

  return qualified.length === ALONE ? (only ?? null) : null;
};
