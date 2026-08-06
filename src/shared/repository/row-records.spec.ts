import { beforeEach, describe, expect, it, vi } from "vitest";
import { ColumnValuesStub } from "#shared/repository/column-values.stub.ts";


const values = new ColumnValuesStub();

vi.mock("#shared/repository/column-values.ts", () => values.module);

const {
  groupByGame,
  toExit,
  toGame,
  toPlayer,
  toPlayerColumn,
  toPlayerTally,
  toSeat,
  toStorageSummary,
} = await import("#shared/repository/row-records.ts");

const DB_FILE = "/repo/data/foolproof.db";

const ONE = 1;

const TWO = 2;

const THREE = 3;

const STARTER_ID = 9;

const AS_NUMBER = 111;

const AS_NULLABLE_NUMBER = 222;

const AS_TEXT = "as-text";

const AS_NULLABLE_TEXT = "as-nullable-text";

describe("row mappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    values.numSpy.mockReturnValue(AS_NUMBER);
    values.nullableNumSpy.mockReturnValue(AS_NULLABLE_NUMBER);
    values.textSpy.mockReturnValue(AS_TEXT);
    values.nullableTextSpy.mockReturnValue(AS_NULLABLE_TEXT);
  });

  describe("toPlayer()", () => {
    it("should take each column through the coercion its type needs", () => {
      expect(toPlayer({ id: ONE, chat_id: TWO, display_name: "Oleg" })).toEqual({
        id: AS_NUMBER,
        chat_id: AS_NUMBER,
        display_name: AS_TEXT,
      });
    });

    it("should feed the numeric coercion the id and the chat, in that order", () => {
      toPlayer({ id: ONE, chat_id: TWO, display_name: "Oleg" });

      expect(values.numSpy.mock.calls).toEqual([[ONE], [TWO]]);
    });

    it("should feed the text coercion the name", () => {
      toPlayer({ id: ONE, chat_id: TWO, display_name: "Oleg" });

      expect(values.textSpy).toHaveBeenCalledWith("Oleg");
    });

    it("should ignore columns the record does not promise", () => {
      expect(Object.keys(toPlayer({ id: ONE, secret: "leak" }))).toEqual([
        "id",
        "chat_id",
        "display_name",
      ]);
    });
  });

  describe("toGame()", () => {
    const row = {
      id: ONE,
      chat_id: TWO,
      message_id: THREE,
      state: "PICK_STARTER",
      state_version: TWO,
      starter_player_id: STARTER_ID,
      started_at: "2026-07-24 20:00:00",
      confirmed_at: null,
    };

    it("should take each column through the coercion its type needs", () => {
      expect(toGame(row)).toEqual({
        id: AS_NUMBER,
        chat_id: AS_NUMBER,
        message_id: AS_NUMBER,
        state: AS_TEXT,
        state_version: AS_NUMBER,
        starter_player_id: AS_NULLABLE_NUMBER,
        started_at: AS_TEXT,
        confirmed_at: AS_NULLABLE_TEXT,
      });
    });

    it("should read the starter as nullable, since nobody may have dealt yet", () => {
      toGame(row);

      expect(values.nullableNumSpy).toHaveBeenCalledWith(STARTER_ID);
      expect(values.numSpy).not.toHaveBeenCalledWith(STARTER_ID);
    });

    it("should read confirmed_at as nullable, since a live card has none", () => {
      toGame(row);

      expect(values.nullableTextSpy).toHaveBeenCalledWith(null);
    });

    it("should read started_at as plain text, since a game always has one", () => {
      toGame(row);

      expect(values.textSpy).toHaveBeenCalledWith("2026-07-24 20:00:00");
      expect(values.nullableTextSpy).not.toHaveBeenCalledWith("2026-07-24 20:00:00");
    });
  });

  describe("toSeat()", () => {
    it("should take each column through the coercion its type needs", () => {
      expect(toSeat({ player_id: ONE, seat_index: TWO, display_name: "Anya" })).toEqual({
        player_id: AS_NUMBER,
        seat_index: AS_NUMBER,
        display_name: AS_TEXT,
      });
    });

    it("should feed the numeric coercion the player and the seat, in that order", () => {
      toSeat({ player_id: ONE, seat_index: TWO, display_name: "Anya" });

      expect(values.numSpy.mock.calls).toEqual([[ONE], [TWO]]);
    });
  });

  describe("toExit()", () => {
    it("should take each column through the coercion its type needs", () => {
      expect(toExit({ player_id: ONE, position: TWO })).toEqual({
        player_id: AS_NUMBER,
        position: AS_NUMBER,
      });
    });
  });

  describe("toPlayerTally()", () => {
    const row = { player_id: ONE, display_name: "Anya", games: THREE };

    it("should rename the columns to the camel case the contract promises", () => {
      expect(toPlayerTally(row)).toEqual({
        playerId: AS_NUMBER,
        displayName: AS_TEXT,
        games: AS_NUMBER,
      });
    });

    it("should count games as a number, not as text", () => {
      toPlayerTally(row);

      expect(values.numSpy).toHaveBeenCalledWith(THREE);
    });
  });

  describe("toPlayerColumn()", () => {
    it("should rename the columns to the camel case the contract promises", () => {
      expect(toPlayerColumn({ player_id: ONE, display_name: "Roma" })).toEqual({
        playerId: AS_NUMBER,
        displayName: AS_TEXT,
      });
    });
  });

  describe("toStorageSummary()", () => {
    const row = { size_bytes: ONE, players: TWO, games: THREE, live_cards: ONE, last_game_at: "x" };

    it("should take each column through the coercion its type needs", () => {
      expect(toStorageSummary(row, DB_FILE)).toEqual({
        file: DB_FILE,
        sizeBytes: AS_NUMBER,
        players: AS_NUMBER,
        games: AS_NUMBER,
        liveCards: AS_NUMBER,
        lastGameAt: AS_NULLABLE_TEXT,
      });
    });

    it("should carry the file through untouched, since no column holds it", () => {
      expect(toStorageSummary(row, DB_FILE).file).toBe(DB_FILE);
    });

    it("should treat a missing row as a database with nothing in it", () => {
      toStorageSummary(undefined, DB_FILE);

      expect(values.numSpy).toHaveBeenCalledWith(undefined);
    });

    it("should still name the file when there is no row", () => {
      expect(toStorageSummary(undefined, DB_FILE).file).toBe(DB_FILE);
    });
  });
});

describe("groupByGame()", () => {
  const rowOf = (gameId: number, playerId: number, position: number, starterId: unknown = null) => ({
    game_id: gameId,
    player_id: playerId,
    position,
    starter_id: starterId,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    values.numSpy.mockImplementation((value) => Number(value));
    values.nullableNumSpy.mockImplementation((value) =>
      value === null || value === undefined ? null : Number(value)
    );
  });

  it("should return nothing for no rows", () => {
    expect(groupByGame([])).toEqual([]);
  });

  it("should collect the placements of one game into one entry", () => {
    expect(groupByGame([rowOf(ONE, TWO, ONE), rowOf(ONE, THREE, TWO)])).toEqual([
      {
        gameId: ONE,
        starterId: null,
        placements: [
          { playerId: TWO, position: ONE },
          { playerId: THREE, position: TWO },
        ],
      },
    ]);
  });

  it("should carry who dealt the game", () => {
    expect(groupByGame([rowOf(ONE, TWO, ONE, THREE)])[0]?.starterId).toBe(THREE);
  });

  it("should report nobody opening when the column is empty", () => {
    expect(groupByGame([rowOf(ONE, TWO, ONE)])[0]?.starterId).toBeNull();
  });

  it("should take the opener from the row that opened the game, not from a later one", () => {
    const rows = [rowOf(ONE, TWO, ONE, THREE), rowOf(ONE, THREE, TWO, null)];

    expect(groupByGame(rows)[0]?.starterId).toBe(THREE);
  });

  it("should open a new entry when the game changes", () => {
    const games = groupByGame([rowOf(ONE, TWO, ONE), rowOf(TWO, THREE, ONE)]);

    expect(games.map((game) => game.gameId)).toEqual([ONE, TWO]);
  });

  it("should keep the placements with the game they belong to", () => {
    const games = groupByGame([rowOf(ONE, TWO, ONE), rowOf(TWO, THREE, ONE)]);

    expect(games.map((game) => game.placements.length)).toEqual([ONE, ONE]);
  });

  it("should keep the rows in the order the query returned them", () => {
    const games = groupByGame([rowOf(ONE, THREE, TWO), rowOf(ONE, TWO, ONE)]);

    expect(games[0]?.placements.map((placement) => placement.playerId)).toEqual([THREE, TWO]);
  });

  it("should open a second entry when the same game id returns after another", () => {
    const games = groupByGame([rowOf(ONE, TWO, ONE), rowOf(TWO, TWO, ONE), rowOf(ONE, THREE, TWO)]);

    expect(games.map((game) => game.gameId)).toEqual([ONE, TWO, ONE]);
  });

  it("should take every column through the numeric coercion", () => {
    groupByGame([rowOf(ONE, TWO, THREE)]);

    expect(values.numSpy.mock.calls).toEqual([[ONE], [TWO], [THREE]]);
  });
});
