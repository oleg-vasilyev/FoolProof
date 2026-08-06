import {
  nullableNum,
  nullableText,
  requireNum,
  requireText,
} from "#shared/repository/column-values.ts";
import type {
  ChatLocaleChoice,
  ChronologyGame,
  ExitRecord,
  GameRecord,
  PlayerColumn,
  PlayerRecord,
  PlayerTally,
  SeatRecord,
  StorageSummary,
} from "#shared/repository/repository-contract.ts";


export type Row = Record<string, unknown>;

const LAST = -1;

export const toPlayer = (row: Row): PlayerRecord => ({
  id: requireNum(row.id),
  chat_id: requireNum(row.chat_id),
  display_name: requireText(row.display_name),
});

export const toGame = (row: Row): GameRecord => ({
  id: requireNum(row.id),
  chat_id: requireNum(row.chat_id),
  message_id: requireNum(row.message_id),
  state: requireText(row.state),
  state_version: requireNum(row.state_version),
  starter_player_id: nullableNum(row.starter_player_id),
  started_at: requireText(row.started_at),
  confirmed_at: nullableText(row.confirmed_at),
});

export const toSeat = (row: Row): SeatRecord => ({
  player_id: requireNum(row.player_id),
  seat_index: requireNum(row.seat_index),
  display_name: requireText(row.display_name),
});

export const toExit = (row: Row): ExitRecord => ({
  player_id: requireNum(row.player_id),
  position: requireNum(row.position),
});

export const toPlayerTally = (row: Row): PlayerTally => ({
  playerId: requireNum(row.player_id),
  displayName: requireText(row.display_name),
  games: requireNum(row.games),
});

export const toPlayerColumn = (row: Row): PlayerColumn => ({
  playerId: requireNum(row.player_id),
  displayName: requireText(row.display_name),
});

export const toChatLocaleChoice = (row: Row): ChatLocaleChoice => ({
  chatId: requireNum(row.chat_id),
  locale: requireText(row.locale),
});

export const toStorageSummary = (row: Row | undefined, file: string): StorageSummary => ({
  file,
  sizeBytes: requireNum(row?.size_bytes),
  players: requireNum(row?.players),
  games: requireNum(row?.games),
  liveCards: requireNum(row?.live_cards),
  lastGameAt: nullableText(row?.last_game_at),
});

export const groupByGame = (rows: readonly Row[]): readonly ChronologyGame[] =>
  rows.reduce<readonly ChronologyGame[]>((games, row) => {
    const gameId = requireNum(row.game_id);
    const starterId = nullableNum(row.starter_id);
    const placement = { playerId: requireNum(row.player_id), position: requireNum(row.position) };
    const open = games.at(LAST);

    if (open?.gameId !== gameId) {
      return [...games, { gameId, starterId, placements: [placement] }];
    }

    return [
      ...games.slice(0, LAST),
      { gameId, starterId: open.starterId, placements: [...open.placements, placement] },
    ];
  }, []);
