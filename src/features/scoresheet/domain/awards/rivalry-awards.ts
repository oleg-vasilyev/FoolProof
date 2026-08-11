import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type {
  Appearance,
  PlayerAppearances,
  SessionAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { bestBy } from "#scoresheet/domain/awards/pick-winner.ts";


const SHARED_ENOUGH = 8;

const NONE = 0;

const facing = (player: PlayerAppearances, other: PlayerAppearances): readonly Appearance[] =>
  player.appearances.filter((appearance) =>
    other.appearances.some((theirs) => theirs.round === appearance.round)
  );

const heldDown = (player: PlayerAppearances, other: PlayerAppearances): number | null => {
  const shared = facing(player, other);
  const above = shared.every((appearance) => {
    const theirs = other.appearances.find((mine) => mine.round === appearance.round);

    return theirs !== undefined && appearance.position < theirs.position;
  });

  return shared.length >= SHARED_ENOUGH && above ? shared.length : null;
};

const longestReign = (
  evening: SessionAppearances,
  player: PlayerAppearances
): number | null => {
  const reigns = evening.players
    .filter((other) => other.playerId !== player.playerId)
    .flatMap((other) => heldDown(player, other) ?? []);

  return reigns.length === NONE ? null : Math.max(...reigns);
};

export const theNemesis = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => longestReign(evening, player));

  return winner === null
    ? null
    : {
        name: AwardName.TheNemesis,
        winners: [winner.playerId],
        over: longestReign(evening, winner) ?? NONE,
      };
};
