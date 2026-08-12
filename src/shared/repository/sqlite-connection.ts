import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { rootDir, loadEnv, optionalEnv } from "#shared/config/env.ts";


export const SERIES_GAP_SECONDS = 3 * 60 * 60;

const DEFAULT_DB_PATH = "data/foolproof.dev.db";

const BUSY_TIMEOUT_MS = 5000;

export const dbFile = resolve(rootDir, optionalEnv(loadEnv(), "DB_PATH") ?? DEFAULT_DB_PATH);
mkdirSync(dirname(dbFile), { recursive: true });

export const db = new DatabaseSync(dbFile);

db.exec("PRAGMA journal_mode = WAL");
db.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}`);
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS players (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id      INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_players_chat ON players(chat_id);

CREATE TABLE IF NOT EXISTS games (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id           INTEGER NOT NULL,
  message_id        INTEGER NOT NULL DEFAULT 0,
  state             TEXT NOT NULL,
  state_version     INTEGER NOT NULL DEFAULT 0,
  starter_player_id INTEGER REFERENCES players(id),
  started_at        TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at      TEXT,
  last_touched_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_games_chat_started ON games(chat_id, started_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_one_live ON games(chat_id) WHERE confirmed_at IS NULL;

CREATE TABLE IF NOT EXISTS game_players (
  game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id  INTEGER NOT NULL REFERENCES players(id),
  seat_index INTEGER NOT NULL,
  PRIMARY KEY (game_id, player_id)
);

CREATE TABLE IF NOT EXISTS game_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id   INTEGER NOT NULL REFERENCES players(id),
  position    INTEGER NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  actor_tg_id INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_game_events_game ON game_events(game_id);

CREATE TABLE IF NOT EXISTS chat_locales (
  chat_id INTEGER PRIMARY KEY,
  locale  TEXT NOT NULL,
  chosen_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

db.exec(`
CREATE VIEW IF NOT EXISTS game_series AS
SELECT *, SUM(new_series) OVER (PARTITION BY chat_id ORDER BY started_at) AS series_no
FROM (
  SELECT *,
    CASE
      WHEN LAG(started_at) OVER (PARTITION BY chat_id ORDER BY started_at) IS NULL
        OR unixepoch(started_at)
           - unixepoch(LAG(started_at) OVER (PARTITION BY chat_id ORDER BY started_at))
           > ${SERIES_GAP_SECONDS}
      THEN 1 ELSE 0
    END AS new_series
  FROM games WHERE confirmed_at IS NOT NULL
);
`);
