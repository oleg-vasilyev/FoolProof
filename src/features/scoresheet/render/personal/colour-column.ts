import type { PlayerColumn, SeriesChronology } from "#shared/repository/repository-contract.ts";


const NOT_SEATED = -1;

const columnIn = (players: readonly PlayerColumn[], playerId: number): number =>
  players.findIndex((player) => player.playerId === playerId);

export const colourColumnOf = (
  evening: SeriesChronology | null,
  roster: readonly PlayerColumn[],
  playerId: number
): number => {
  const tonight = evening === null ? NOT_SEATED : columnIn(evening.players, playerId);

  return tonight === NOT_SEATED ? columnIn(roster, playerId) : tonight;
};
