import type { CardRepository, SeatRecord } from "#shared/repository/repository-contract.ts";
import { normalizeName } from "#live-game/domain/lineup-parsing.ts";
import type { Seat } from "#live-game/domain/card-state.ts";


export const toSeats = (records: readonly SeatRecord[]): readonly Seat[] =>
  records.map((record) => ({ playerId: record.player_id, displayName: record.display_name }));

export const resolveSeats = (
  repo: CardRepository,
  chatId: number,
  names: readonly string[]
): readonly Seat[] => {
  const known = new Map(
    repo.playersInChat(chatId).map((player) => [normalizeName(player.display_name), player])
  );

  return names.map((name) => {
    const key = normalizeName(name);
    const found = known.get(key);

    if (found !== undefined) {
      return { playerId: found.id, displayName: found.display_name };
    }

    const created = repo.createPlayer(chatId, name);
    known.set(key, created);

    return { playerId: created.id, displayName: created.display_name };
  });
};
