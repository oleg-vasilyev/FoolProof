import { beforeEach, describe, expect, it, vi } from "vitest";
import { ColumnValuesStub } from "#shared/repository/column-values.stub.ts";


const values = new ColumnValuesStub();

vi.mock("#shared/repository/column-values.ts", () => values.module);

const {
  groupByGame,
  toChatLocaleChoice,
  toExit,
  toGame,
  toPlayer,
  toPlayerColumn,
  toPlayerTally,
  toChatSummary,
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

const CHATS = 14;

const CHATS_NEW_IN_WEEK = 3;

const CHATS_PLAYED_IN_WEEK = 9;

const GAMES_IN_DAY = 5;

const GAMES_IN_WEEK = 31;

const CHOSE_RUSSIAN = 6;

const CHOSE_ENGLISH = 2;

describe("row mappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    values.requireNumSpy.mockReturnValue(AS_NUMBER);
    values.nullableNumSpy.mockReturnValue(AS_NULLABLE_NUMBER);
    values.requireTextSpy.mockReturnValue(AS_TEXT);
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

      expect(values.requireNumSpy.mock.calls).toEqual([[ONE], [TWO]]);
    });

    it("should feed the text coercion the name", () => {
      toPlayer({ id: ONE, chat_id: TWO, display_name: "Oleg" });

      expect(values.requireTextSpy).toHaveBeenCalledWith("Oleg");
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
      expect(values.requireNumSpy).not.toHaveBeenCalledWith(STARTER_ID);
    });

    it("should read confirmed_at as nullable, since a live card has none", () => {
      toGame(row);

      expect(values.nullableTextSpy).toHaveBeenCalledWith(null);
    });

    it("should read started_at as plain text, since a game always has one", () => {
      toGame(row);

      expect(values.requireTextSpy).toHaveBeenCalledWith("2026-07-24 20:00:00");
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

      expect(values.requireNumSpy.mock.calls).toEqual([[ONE], [TWO]]);
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

      expect(values.requireNumSpy).toHaveBeenCalledWith(THREE);
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

  describe("toChatLocaleChoice()", () => {
    const row = { chat_id: ONE, locale: "ru" };

    it("should rename the columns to the camel case the contract promises", () => {
      expect(toChatLocaleChoice(row)).toEqual({
        chatId: AS_NUMBER,
        locale: AS_TEXT,
      });
    });

    it("should read the chat as a number and the locale as text", () => {
      toChatLocaleChoice(row);

      expect(values.requireNumSpy).toHaveBeenCalledWith(ONE);
      expect(values.requireTextSpy).toHaveBeenCalledWith("ru");
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

    it("should hand a missing row's columns to the coercion, which is what refuses them", () => {
      toStorageSummary(undefined, DB_FILE);

      expect(values.requireNumSpy).toHaveBeenCalledWith(undefined);
    });

    it("should still name the file when there is no row", () => {
      expect(toStorageSummary(undefined, DB_FILE).file).toBe(DB_FILE);
    });
  });

  describe("toChatSummary()", () => {
    const row = {
      chats: CHATS,
      chats_new_in_week: CHATS_NEW_IN_WEEK,
      chats_played_in_week: CHATS_PLAYED_IN_WEEK,
      games_in_day: GAMES_IN_DAY,
      games_in_week: GAMES_IN_WEEK,
      chose_russian: CHOSE_RUSSIAN,
      chose_english: CHOSE_ENGLISH,
    };

    beforeEach(() => {
      values.requireNumSpy.mockImplementation((value) => Number(value));
    });

    it("should land every count on the field the report reads it from", () => {
      expect(toChatSummary(row)).toEqual({
        chats: CHATS,
        chatsNewInWeek: CHATS_NEW_IN_WEEK,
        chatsPlayedInWeek: CHATS_PLAYED_IN_WEEK,
        gamesInDay: GAMES_IN_DAY,
        gamesInWeek: GAMES_IN_WEEK,
        choseRussian: CHOSE_RUSSIAN,
        choseEnglish: CHOSE_ENGLISH,
      });
    });

    it("should take every count through the numeric coercion", () => {
      values.requireNumSpy.mockReturnValue(AS_NUMBER);

      expect(toChatSummary(row).chats).toBe(AS_NUMBER);
    });

    it("should hand a missing row's columns to the coercion, which is what refuses them", () => {
      toChatSummary(undefined);

      expect(values.requireNumSpy).toHaveBeenCalledWith(undefined);
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

    values.requireNumSpy.mockImplementation((value) => Number(value));
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

    expect(values.requireNumSpy.mock.calls).toEqual([[ONE], [TWO], [THREE]]);
  });
});
