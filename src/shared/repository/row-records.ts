import { nullableNum, nullableText, num, text } from "#shared/repository/column-values.ts";
import type {
  ChronologyGame,
  ExitRecord,
  GameRecord,
  PlayerColumn,
  PlayerRecord,
  SeatRecord,
} from "#shared/repository/repository-contract.ts";


export type Row = Record<string, unknown>;

const LAST = -1;

export const toPlayer = (row: Row): PlayerRecord => ({
  id: num(row.id),
  chat_id: num(row.chat_id),
  display_name: text(row.display_name),
});

export const toGame = (row: Row): GameRecord => ({
  id: num(row.id),
  chat_id: num(row.chat_id),
  message_id: num(row.message_id),
  state: text(row.state),
  state_version: num(row.state_version),
  starter_player_id: nullableNum(row.starter_player_id),
  started_at: text(row.started_at),
  confirmed_at: nullableText(row.confirmed_at),
});

export const toSeat = (row: Row): SeatRecord => ({
  player_id: num(row.player_id),
  seat_index: num(row.seat_index),
  display_name: text(row.display_name),
});

export const toExit = (row: Row): ExitRecord => ({
  player_id: num(row.player_id),
  position: num(row.position),
});

export const toPlayerColumn = (row: Row): PlayerColumn => ({
  playerId: num(row.player_id),
  displayName: text(row.display_name),
});

export const groupByGame = (rows: readonly Row[]): readonly ChronologyGame[] =>
  rows.reduce<readonly ChronologyGame[]>((games, row) => {
    const gameId = num(row.game_id);
    const placement = { playerId: num(row.player_id), position: num(row.position) };
    const open = games.at(LAST);

    if (open?.gameId !== gameId) {
      return [...games, { gameId, placements: [placement] }];
    }

    return [...games.slice(0, LAST), { gameId, placements: [...open.placements, placement] }];
  }, []);
