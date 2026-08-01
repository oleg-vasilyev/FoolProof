import type { Seat } from "#live-game/domain/card-state.ts";


const ONE_LOSER = 1;

const NOT_SEATED = -1;

const ONE_SEAT_BACK = 1;

export const starterAfterLoss = (
  seats: readonly Seat[],
  loserIds: readonly number[]
): number | null => {
  if (loserIds.length !== ONE_LOSER) {
    return null;
  }

  const loserSlot = seats.findIndex((seat) => seat.playerId === loserIds[0]);

  if (loserSlot === NOT_SEATED) {
    return null;
  }

  return (loserSlot - ONE_SEAT_BACK + seats.length) % seats.length;
};
