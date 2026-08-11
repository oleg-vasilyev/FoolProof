import { playedGames, type PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";


export type Merit = (player: PlayerAppearances) => number | null;

const ALONE = 1;

const TOO_CLOSE_TO_CALL = 1e-9;

interface Ranked {
  readonly player: PlayerAppearances;
  readonly merit: number;
}

const outranks = (challenger: Ranked, holder: Ranked): boolean => {
  const sameMerit = challenger.merit === holder.merit;
  const theirs = playedGames(challenger.player);
  const held = playedGames(holder.player);

  return (
    challenger.merit > holder.merit ||
    (sameMerit && theirs > held) ||
    (sameMerit && theirs === held && challenger.player.playerId < holder.player.playerId)
  );
};

const qualifiedField = (players: readonly PlayerAppearances[], merit: Merit): readonly Ranked[] =>
  players.flatMap((player) => {
    const earned = merit(player);

    return earned === null ? [] : [{ player, merit: earned }];
  });

const topOf = (field: readonly Ranked[]): Ranked | null =>
  field.reduce<Ranked | null>(
    (holder, challenger) => (holder === null || outranks(challenger, holder) ? challenger : holder),
    null
  );

const sharesTheTop = (field: readonly Ranked[], leader: Ranked): boolean =>
  field.some(
    (ranked) =>
      ranked.player.playerId !== leader.player.playerId &&
      Math.abs(ranked.merit - leader.merit) < TOO_CLOSE_TO_CALL
  );

export const bestBy = (
  players: readonly PlayerAppearances[],
  merit: Merit
): PlayerAppearances | null => topOf(qualifiedField(players, merit))?.player ?? null;

export const standoutBy = (
  players: readonly PlayerAppearances[],
  merit: Merit
): PlayerAppearances | null => {
  const field = qualifiedField(players, merit);
  const leader = topOf(field);

  return leader !== null && !sharesTheTop(field, leader) ? leader.player : null;
};

export const soleBy = (
  players: readonly PlayerAppearances[],
  qualifies: (player: PlayerAppearances) => boolean
): PlayerAppearances | null => {
  const qualified = players.filter(qualifies);
  const [only] = qualified;

  return qualified.length === ALONE ? (only ?? null) : null;
};
