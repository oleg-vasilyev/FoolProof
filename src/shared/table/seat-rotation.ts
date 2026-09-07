const FIRST_SEAT = 0;

export const rotateToLowestId = <T extends { readonly playerId: number }>(
  seats: readonly T[]
): readonly T[] => {
  const pivot = seats.reduce(
    (lowest, seat, index) =>
      seat.playerId < lowest.playerId ? { playerId: seat.playerId, index } : lowest,
    { playerId: Number.POSITIVE_INFINITY, index: FIRST_SEAT }
  );

  return [...seats.slice(pivot.index), ...seats.slice(FIRST_SEAT, pivot.index)];
};
