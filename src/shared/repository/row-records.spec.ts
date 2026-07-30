import { beforeEach, describe, expect, it, vi } from "vitest";


const numSpy = vi.fn();

const nullableNumSpy = vi.fn();

const textSpy = vi.fn();

const nullableTextSpy = vi.fn();

vi.mock("#shared/repository/column-values.ts", () => ({
  num: (value: unknown) => numSpy(value),
  nullableNum: (value: unknown) => nullableNumSpy(value),
  text: (value: unknown) => textSpy(value),
  nullableText: (value: unknown) => nullableTextSpy(value),
}));

const { groupByGame, toExit, toGame, toPlayer, toPlayerColumn, toSeat } = await import(
  "#shared/repository/row-records.ts"
);

const ONE = 1;

const TWO = 2;

const THREE = 3;

const STARTER_ID = 9;

const marked = (kind: string) => (value: unknown) => `${kind}(${String(value)})`;

describe("row mappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    numSpy.mockImplementation(marked("num"));
    nullableNumSpy.mockImplementation(marked("nullableNum"));
    textSpy.mockImplementation(marked("text"));
    nullableTextSpy.mockImplementation(marked("nullableText"));
  });

  describe("toPlayer()", () => {
    it("should take each column through the coercion its type needs", () => {
      expect(toPlayer({ id: ONE, chat_id: TWO, display_name: "Oleg" })).toEqual({
        id: "num(1)",
        chat_id: "num(2)",
        display_name: "text(Oleg)",
      });
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
        id: "num(1)",
        chat_id: "num(2)",
        message_id: "num(3)",
        state: "text(PICK_STARTER)",
        state_version: "num(2)",
        starter_player_id: "nullableNum(9)",
        started_at: "text(2026-07-24 20:00:00)",
        confirmed_at: "nullableText(null)",
      });
    });

    it("should read the starter as nullable, since nobody may have dealt yet", () => {
      toGame(row);

      expect(nullableNumSpy).toHaveBeenCalledWith(STARTER_ID);
      expect(numSpy).not.toHaveBeenCalledWith(STARTER_ID);
    });

    it("should read confirmed_at as nullable, since a live card has none", () => {
      toGame(row);

      expect(nullableTextSpy).toHaveBeenCalledWith(null);
    });

    it("should read started_at as plain text, since a game always has one", () => {
      toGame(row);

      expect(textSpy).toHaveBeenCalledWith("2026-07-24 20:00:00");
      expect(nullableTextSpy).not.toHaveBeenCalledWith("2026-07-24 20:00:00");
    });
  });

  describe("toSeat()", () => {
    it("should take each column through the coercion its type needs", () => {
      expect(toSeat({ player_id: ONE, seat_index: TWO, display_name: "Anya" })).toEqual({
        player_id: "num(1)",
        seat_index: "num(2)",
        display_name: "text(Anya)",
      });
    });
  });

  describe("toExit()", () => {
    it("should take each column through the coercion its type needs", () => {
      expect(toExit({ player_id: ONE, position: TWO })).toEqual({
        player_id: "num(1)",
        position: "num(2)",
      });
    });
  });

  describe("toPlayerColumn()", () => {
    it("should rename the columns to the camel case the contract promises", () => {
      expect(toPlayerColumn({ player_id: ONE, display_name: "Roma" })).toEqual({
        playerId: "num(1)",
        displayName: "text(Roma)",
      });
    });
  });
});

describe("groupByGame()", () => {
  const rowOf = (gameId: number, playerId: number, position: number) => ({
    game_id: gameId,
    player_id: playerId,
    position,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    numSpy.mockImplementation((value: unknown) => value);
  });

  it("should return nothing for no rows", () => {
    expect(groupByGame([])).toEqual([]);
  });

  it("should collect the placements of one game into one entry", () => {
    expect(groupByGame([rowOf(ONE, TWO, ONE), rowOf(ONE, THREE, TWO)])).toEqual([
      {
        gameId: ONE,
        placements: [
          { playerId: TWO, position: ONE },
          { playerId: THREE, position: TWO },
        ],
      },
    ]);
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

    expect(numSpy.mock.calls).toEqual([[ONE], [TWO], [THREE]]);
  });
});
