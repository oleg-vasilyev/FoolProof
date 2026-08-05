import { playedGames, type PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";


export type Merit = (player: PlayerAppearances) => number | null;

const ALONE = 1;

interface Ranked {
  readonly player: PlayerAppearances;
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

export const bestBy = (players: readonly PlayerAppearances[], merit: Merit): PlayerAppearances | null =>
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
  players: readonly PlayerAppearances[],
  qualifies: (player: PlayerAppearances) => boolean
): PlayerAppearances | null => {
  const qualified = players.filter(qualifies);
  const [only] = qualified;

  return qualified.length === ALONE ? (only ?? null) : null;
};
