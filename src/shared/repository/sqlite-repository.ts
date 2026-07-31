import { db, dbFile, SERIES_GAP_SECONDS } from "#shared/repository/sqlite-connection.ts";
import { num, numberOr, text } from "#shared/repository/column-values.ts";
import {
  groupByGame,
  toExit,
  toGame,
  toPlayer,
  toPlayerColumn,
  toSeat,
  toStorageSummary,
  type Row,
} from "#shared/repository/row-records.ts";
import type {
  CardRecord,
  ExitRecord,
  Repository,
  SeatRecord,
} from "#shared/repository/repository-contract.ts";


const FIRST_GAME = 1;

const LATEST_SERIES = `SELECT id, started_at FROM game_series
   WHERE chat_id = ?
     AND series_no = (SELECT MAX(series_no) FROM game_series WHERE chat_id = ?)`;

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

const cardOf = (row: Row): CardRecord => {
  const game = toGame(row);

  return { game, seats: seatsOf(game.id), exits: exitsOf(game.id) };
};

const cardFrom = (row: Row | undefined): CardRecord | null =>
  row === undefined ? null : cardOf(row);

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
      db.prepare("SELECT * FROM games WHERE chat_id = ? AND confirmed_at IS NULL").get(chatId)
    );
  },

  storageSummary() {
    const row = db
      .prepare(
        `SELECT
           (SELECT page_count * page_size FROM pragma_page_count(), pragma_page_size())
             AS size_bytes,
           (SELECT COUNT(*) FROM players) AS players,
           (SELECT COUNT(*) FROM games) AS games,
           (SELECT COUNT(*) FROM games WHERE confirmed_at IS NULL) AS live_cards,
           (SELECT MAX(started_at) FROM games) AS last_game_at`
      )
      .get();

    return toStorageSummary(row, dbFile);
  },

  liveCards() {
    return db
      .prepare("SELECT * FROM games WHERE confirmed_at IS NULL ORDER BY id")
      .all()
      .map(cardOf);
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

    return numberOr(row?.game_no, FIRST_GAME);
  },

  seriesChronology(chatId) {
    const played = db
      .prepare(
        `SELECT g.id AS game_id,
                date(g.started_at) AS started_on,
                ge.player_id,
                ge.position
         FROM (${LATEST_SERIES}) g
         JOIN game_events ge ON ge.game_id = g.id
         ORDER BY g.started_at, g.id, ge.position, ge.player_id`
      )
      .all(chatId, chatId);

    const startedOn = played[0]?.started_on;
    if (startedOn === undefined) {
      return null;
    }

    const players = db
      .prepare(
        `SELECT player_id, display_name FROM (
           SELECT p.id AS player_id,
                  p.display_name,
                  g.started_at,
                  g.id AS game_id,
                  gp.seat_index,
                  ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY g.started_at, g.id) AS appearance
           FROM (${LATEST_SERIES}) g
           JOIN game_players gp ON gp.game_id = g.id
           JOIN players p ON p.id = gp.player_id
         )
         WHERE appearance = 1
         ORDER BY started_at, game_id, seat_index`
      )
      .all(chatId, chatId)
      .map(toPlayerColumn);

    return { startedOn: text(startedOn), players, games: groupByGame(played) };
  },
};
