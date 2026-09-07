import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";


const DB_FILE = join(tmpdir(), `foolproof-old-schema-spec-${process.pid}.db`);

const GAMES_BEFORE_REOPENING = `
CREATE TABLE games (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id           INTEGER NOT NULL,
  message_id        INTEGER NOT NULL DEFAULT 0,
  state             TEXT NOT NULL,
  state_version     INTEGER NOT NULL DEFAULT 0,
  starter_player_id INTEGER,
  started_at        TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at      TEXT,
  last_touched_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO games (chat_id, state, confirmed_at) VALUES (-1, 'FROZEN', datetime('now'));
`;

const old = new DatabaseSync(DB_FILE);
old.exec(GAMES_BEFORE_REOPENING);
old.close();

process.env.DB_PATH = DB_FILE;

const { db } = await import("#shared/repository/sqlite-connection.ts");

afterAll(() => {
  db.close();

  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(DB_FILE + suffix, { force: true });
  }
});

describe("opening a file written before games could be reopened", () => {
  it("should add the reopened_by column rather than fail on the first read of it", () => {
    const columns = db.prepare("SELECT name FROM pragma_table_info('games')").all();

    expect(columns.map((column) => column.name)).toContain("reopened_by");
  });

  it("should leave the games already there unmarked", () => {
    expect(db.prepare("SELECT reopened_by FROM games").all()).toEqual([{ reopened_by: null }]);
  });
});
