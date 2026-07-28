import { db, SERIES_GAP_SECONDS } from "../db.ts";
import type {
  CardRecord,
  ExitRecord,
  Finalist,
  GameRecord,
  PlayerRecord,
  Repository,
  SeatRecord,
} from "./types.ts";


type Row = Record<string, unknown>;

const num = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return 0;
};

const nullableNum = (value: unknown): number | null =>
  value === null || value === undefined ? null : num(value);

const text = (value: unknown): string => (typeof value === "string" ? value : "");

const nullableText = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const transact = <T>(run: () => T): T => {
  db.exec("BEGIN");
  try {
    const result = run();
    db.exec("COMMIT");

    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

const toPlayer = (row: Row): PlayerRecord => ({
  id: num(row.id),
  chat_id: num(row.chat_id),
  display_name: text(row.display_name),
});

const toGame = (row: Row): GameRecord => ({
  id: num(row.id),
  chat_id: num(row.chat_id),
  message_id: num(row.message_id),
  state: text(row.state),
  state_version: num(row.state_version),
  starter_player_id: nullableNum(row.starter_player_id),
  started_at: text(row.started_at),
  confirmed_at: nullableText(row.confirmed_at),
});

const toSeat = (row: Row): SeatRecord => ({
  player_id: num(row.player_id),
  seat_index: num(row.seat_index),
  display_name: text(row.display_name),
});

const toExit = (row: Row): ExitRecord => ({
  player_id: num(row.player_id),
  position: num(row.position),
});

const seatsOf = (gameId: number): readonly SeatRecord[] =>
  db
    .prepare(
      `SELECT gp.player_id, gp.seat_index, p.display_name
       FROM game_players gp
       JOIN players p ON p.id = gp.player_id
       WHERE gp.game_id = ?
       ORDER BY gp.seat_index`
    )
    .all(gameId)
    .map(toSeat);

const exitsOf = (gameId: number): readonly ExitRecord[] =>
  db
    .prepare(
      `SELECT player_id, position FROM game_events
       WHERE game_id = ?
       ORDER BY position, id`
    )
    .all(gameId)
    .map(toExit);

const cardFrom = (row: Row | undefined): CardRecord | null => {
  if (row === undefined) {
    return null;
  }

  const game = toGame(row);

  return { game, seats: seatsOf(game.id), exits: exitsOf(game.id) };
};

export const sqliteRepository: Repository = {
  playersInChat(chatId) {
    return db
      .prepare("SELECT id, chat_id, display_name FROM players WHERE chat_id = ?")
      .all(chatId)
      .map(toPlayer);
  },

  createPlayer(chatId, displayName) {
    const result = db
      .prepare("INSERT INTO players (chat_id, display_name) VALUES (?, ?)")
      .run(chatId, displayName);

    return { id: num(result.lastInsertRowid), chat_id: chatId, display_name: displayName };
  },

  liveCardInChat(chatId) {
    return cardFrom(
      db
        .prepare("SELECT * FROM games WHERE chat_id = ? AND confirmed_at IS NULL")
        .get(chatId)
    );
  },

  cardById(gameId) {
    return cardFrom(db.prepare("SELECT * FROM games WHERE id = ?").get(gameId));
  },

  lastLineup(chatId) {
    const row = db
      .prepare(
        `SELECT id FROM games
         WHERE chat_id = ? AND confirmed_at IS NOT NULL
         ORDER BY started_at DESC, id DESC
         LIMIT 1`
      )
      .get(chatId);

    if (row === undefined) {
      return null;
    }

    return seatsOf(num(row.id));
  },

  openGame(chatId, playerIds) {
    return transact(() => {
      const inserted = db
        .prepare("INSERT INTO games (chat_id, state) VALUES (?, 'PICK_STARTER')")
        .run(chatId);

      const gameId = num(inserted.lastInsertRowid);
      const seat = db.prepare(
        "INSERT INTO game_players (game_id, player_id, seat_index) VALUES (?, ?, ?)"
      );

      playerIds.forEach((playerId, seatIndex) => {
        seat.run(gameId, playerId, seatIndex);
      });

      return gameId;
    });
  },

  attachMessage(gameId, messageId) {
    db.prepare("UPDATE games SET message_id = ? WHERE id = ?").run(messageId, gameId);
  },

  updateCard(gameId, phase, version, starterPlayerId) {
    db.prepare(
      `UPDATE games
       SET state = ?, state_version = ?, starter_player_id = ?, last_touched_at = datetime('now')
       WHERE id = ?`
    ).run(phase, version, starterPlayerId, gameId);
  },

  appendExit(gameId, playerId, position, actorTgId) {
    db.prepare(
      "INSERT INTO game_events (game_id, player_id, position, actor_tg_id) VALUES (?, ?, ?, ?)"
    ).run(gameId, playerId, position, actorTgId);
  },

  dropLastExit(gameId) {
    db.prepare(
      "DELETE FROM game_events WHERE id = (SELECT MAX(id) FROM game_events WHERE game_id = ?)"
    ).run(gameId);
  },

  confirmGame(gameId, finalists, actorTgId, version) {
    transact(() => {
      const event = db.prepare(
        "INSERT INTO game_events (game_id, player_id, position, actor_tg_id) VALUES (?, ?, ?, ?)"
      );

      finalists.forEach(({ playerId, position }) => {
        event.run(gameId, playerId, position, actorTgId);
      });

      db.prepare(
        `UPDATE games
         SET state = 'FROZEN',
             state_version = ?,
             confirmed_at = datetime('now'),
             last_touched_at = datetime('now')
         WHERE id = ?`
      ).run(version, gameId);
    });
  },

  deleteGame(gameId) {
    db.prepare("DELETE FROM games WHERE id = ?").run(gameId);
  },

  idleCards(idleSeconds) {
    return db
      .prepare(
        `SELECT * FROM games
         WHERE confirmed_at IS NULL
           AND unixepoch('now') - unixepoch(last_touched_at) >= ?`
      )
      .all(idleSeconds)
      .map(toGame);
  },

  gameNumberInSeries(chatId) {
    const row = db
      .prepare(
        `SELECT COALESCE((
           SELECT COUNT(*) FROM game_series
           WHERE chat_id = ?
             AND series_no = (SELECT MAX(series_no) FROM game_series WHERE chat_id = ?)
             AND (
               SELECT unixepoch('now') - unixepoch(MAX(started_at))
               FROM games WHERE chat_id = ? AND confirmed_at IS NOT NULL
             ) <= ?
         ), 0) + 1 AS game_no`
      )
      .get(chatId, chatId, chatId, SERIES_GAP_SECONDS);

    return row === undefined ? 1 : num(row.game_no);
  },

  seriesStats(chatId) {
    const counted = db
      .prepare(
        `SELECT COUNT(*) AS games FROM game_series
         WHERE chat_id = ?
           AND series_no = (SELECT MAX(series_no) FROM game_series WHERE chat_id = ?)`
      )
      .get(chatId, chatId);

    const games = counted === undefined ? 0 : num(counted.games);
    if (games === 0) {
      return { games: 0, players: [] };
    }

    const players = db
      .prepare(
        `WITH placed AS (
           SELECT ge.player_id,
                  ge.position,
                  COUNT(*) OVER (PARTITION BY ge.game_id, ge.position) AS sharing,
                  MAX(ge.position) OVER (PARTITION BY ge.game_id) AS last_position
           FROM game_events ge
           WHERE ge.game_id IN (
             SELECT id FROM game_series
             WHERE chat_id = ?
               AND series_no = (SELECT MAX(series_no) FROM game_series WHERE chat_id = ?)
           )
         )
         SELECT p.id AS player_id,
                p.display_name,
                COUNT(*) AS games,
                SUM(CASE WHEN placed.position = 1 AND placed.sharing = 1 THEN 1 ELSE 0 END) AS wins,
                SUM(CASE WHEN placed.position = placed.last_position AND placed.sharing = 1
                         THEN 1 ELSE 0 END) AS fools
         FROM placed
         JOIN players p ON p.id = placed.player_id
         GROUP BY p.id, p.display_name
         ORDER BY fools DESC, wins DESC, p.display_name`
      )
      .all(chatId, chatId)
      .map((row) => ({
        playerId: num(row.player_id),
        displayName: text(row.display_name),
        games: num(row.games),
        wins: num(row.wins),
        fools: num(row.fools),
      }));

    return { games, players };
  },
};

export type { Finalist };
