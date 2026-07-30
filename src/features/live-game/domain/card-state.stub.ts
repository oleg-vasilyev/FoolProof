import { playerIdOf } from "#shared/repository/database-records.stub.ts";
import type { CardState, Seat } from "#live-game/domain/card-state.ts";


export const seatsOf = (...names: readonly string[]): readonly Seat[] =>
  names.map((displayName, index) => ({ playerId: playerIdOf(index), displayName }));

export const cardStateOf = (
  names: readonly string[],
  overrides: Partial<CardState> = {}
): CardState => ({
  seats: seatsOf(...names),
  starterSlot: null,
  exits: [],
  drawAccepted: false,
  ...overrides,
});
