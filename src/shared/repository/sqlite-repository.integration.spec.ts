import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";


const DB_FILE = join(tmpdir(), `foolproof-sqlite-spec-${process.pid}.db`);

process.env.DB_PATH = DB_FILE;

const { sqliteRepository: repo } = await import("#shared/repository/sqlite-repository.ts");
const { db } = await import("#shared/repository/sqlite-connection.ts");

const CHAT_ID = -100777;

const OTHER_CHAT_ID = -100888;

const ACTOR_ID = 777;

const MESSAGE_ID = 500;

const IDLE_SECONDS = 10_800;

const NONE = 0;

const ONCE = 1;

const TWO = 2;

const THREE = 3;

const seedPlayers = (...names: readonly string[]): readonly number[] =>
  names.map((name) => repo.createPlayer(CHAT_ID, name).id);

const playFullGame = (
  playerIds: readonly number[],
  exitOrder: readonly number[],
  finalists: readonly number[]
): number => {
  const gameId = repo.openGame(CHAT_ID, playerIds);
  repo.attachMessage(gameId, MESSAGE_ID);

  exitOrder.forEach((playerId, index) => {
    repo.appendExit(gameId, playerId, index + 1, ACTOR_ID);
  });

  const lastPosition = exitOrder.length + 1;
  repo.confirmGame(
    gameId,
    finalists.map((playerId) => ({ playerId, position: lastPosition })),
    ACTOR_ID,
    exitOrder.length + 1
  );

  return gameId;
};

const ageAllGames = (interval: string): void => {
  db.prepare(`UPDATE games SET started_at = datetime('now', ?)`).run(interval);
};

beforeEach(() => {
  db.exec("DELETE FROM game_events");
  db.exec("DELETE FROM game_players");
  db.exec("DELETE FROM games");
  db.exec("DELETE FROM players");
  db.exec("DELETE FROM chat_locales");
});

afterAll(() => {
  db.close();

  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(DB_FILE + suffix, { force: true });
  }
});

describe("players", () => {
  it("should create a player and give it an id", () => {
    const player = repo.createPlayer(CHAT_ID, "Oleg");

    expect(player).toEqual({ id: expect.any(Number), chat_id: CHAT_ID, display_name: "Oleg" });
  });

  it("should list players of a chat", () => {
    seedPlayers("Oleg", "Anya");

    expect(repo.playersInChat(CHAT_ID).map((player) => player.display_name)).toEqual([
      "Oleg",
      "Anya",
    ]);
  });

  it("should keep chats apart", () => {
    seedPlayers("Oleg");
    repo.createPlayer(OTHER_CHAT_ID, "Stranger");

    expect(repo.playersInChat(CHAT_ID)).toHaveLength(ONCE);
  });

  it("should store a name exactly as typed", () => {
    const player = repo.createPlayer(CHAT_ID, "  Пётр  ");

    expect(player.display_name).toBe("  Пётр  ");
  });
});

describe("the roster of a chat", () => {
  const tally = (name: string) =>
    repo.rosterInChat(CHAT_ID).find((player) => player.displayName === name);

  it("should count the games a player has played", () => {
    const [oleg = NONE, anya = NONE] = seedPlayers("Oleg", "Anya");
    playFullGame([oleg, anya], [oleg], [anya]);
    playFullGame([oleg, anya], [anya], [oleg]);

    expect(tally("Oleg")?.games).toBe(TWO);
  });

  it("should list a player who has never played", () => {
    seedPlayers("Ghost");

    expect(tally("Ghost")?.games).toBe(NONE);
  });

  it("should not count a game that is still live", () => {
    const ids = seedPlayers("Oleg", "Anya");
    repo.openGame(CHAT_ID, ids);

    expect(tally("Oleg")?.games).toBe(NONE);
  });

  it("should order by name so a name typed twice sits beside the right one", () => {
    seedPlayers("Оля", "Аня", "Анна");

    expect(repo.rosterInChat(CHAT_ID).map((player) => player.displayName)).toEqual([
      "Анна",
      "Аня",
      "Оля",
    ]);
  });

  it("should keep chats apart", () => {
    seedPlayers("Oleg");
    repo.createPlayer(OTHER_CHAT_ID, "Stranger");

    expect(repo.rosterInChat(CHAT_ID)).toHaveLength(ONCE);
  });
});

describe("players who cannot be the same person", () => {
  it("should report two players who sat in one game", () => {
    const [oleg = NONE, anya = NONE] = seedPlayers("Oleg", "Anya");
    playFullGame([oleg, anya], [oleg], [anya]);

    expect(repo.playedTogether([oleg, anya])).toBe(true);
  });

  it("should report a pair that shares a game still being played", () => {
    const ids = seedPlayers("Oleg", "Anya");
    repo.openGame(CHAT_ID, ids);

    expect(repo.playedTogether(ids)).toBe(true);
  });

  it("should clear a pair that never met at the table", () => {
    const [oleg = NONE, anya = NONE, roma = NONE] = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame([oleg, anya], [oleg], [anya]);

    expect(repo.playedTogether([oleg, roma])).toBe(false);
  });

  it("should clear a single player however much they played", () => {
    const [oleg = NONE, anya = NONE] = seedPlayers("Oleg", "Anya");
    playFullGame([oleg, anya], [oleg], [anya]);
    playFullGame([oleg, anya], [anya], [oleg]);

    expect(repo.playedTogether([oleg])).toBe(false);
  });

  it("should clear an empty list rather than reach the database", () => {
    expect(repo.playedTogether([])).toBe(false);
  });
});

describe("merging one name into another", () => {
  const seedTypo = (): { keeper: number; typo: number; gameId: number } => {
    const [anya = NONE, oleg = NONE, anna = NONE] = seedPlayers("Аня", "Oleg", "Анна");
    playFullGame([anya, oleg], [anya], [oleg]);
    const gameId = playFullGame([anna, oleg], [oleg], [anna]);
    repo.updateCard(gameId, "FROZEN", TWO, anna);

    return { keeper: anya, typo: anna, gameId };
  };

  it("should seat the keeper where the absorbed name sat", () => {
    const { keeper, typo, gameId } = seedTypo();

    repo.mergePlayers(keeper, [typo]);

    expect(repo.cardById(gameId)?.seats.map((seat) => seat.player_id)).toContain(keeper);
  });

  it("should carry the absorbed name's results over", () => {
    const { keeper, typo, gameId } = seedTypo();

    repo.mergePlayers(keeper, [typo]);

    expect(repo.cardById(gameId)?.exits.map((exit) => exit.player_id)).toContain(keeper);
  });

  it("should hand over who dealt first", () => {
    const { keeper, typo, gameId } = seedTypo();

    repo.mergePlayers(keeper, [typo]);

    expect(repo.cardById(gameId)?.game.starter_player_id).toBe(keeper);
  });

  it("should leave the absorbed name out of the roster", () => {
    const { keeper, typo } = seedTypo();

    repo.mergePlayers(keeper, [typo]);

    expect(repo.rosterInChat(CHAT_ID).map((player) => player.displayName)).toEqual(["Oleg", "Аня"]);
  });

  it("should give the keeper both histories", () => {
    const { keeper, typo } = seedTypo();

    repo.mergePlayers(keeper, [typo]);

    expect(repo.rosterInChat(CHAT_ID).find((player) => player.playerId === keeper)?.games).toBe(TWO);
  });

  it("should fold several names in at once", () => {
    const [anya = NONE, oleg = NONE, anna = NONE, anyuta = NONE] = seedPlayers(
      "Аня",
      "Oleg",
      "Анна",
      "Анюта"
    );
    playFullGame([anna, oleg], [oleg], [anna]);
    playFullGame([anyuta, oleg], [oleg], [anyuta]);

    repo.mergePlayers(anya, [anna, anyuta]);

    expect(repo.rosterInChat(CHAT_ID)).toHaveLength(TWO);
  });

  it("should give the keeper every absorbed history at once", () => {
    const [anya = NONE, oleg = NONE, anna = NONE, anyuta = NONE] = seedPlayers(
      "Аня",
      "Oleg",
      "Анна",
      "Анюта"
    );
    playFullGame([anna, oleg], [oleg], [anna]);
    playFullGame([anyuta, oleg], [oleg], [anyuta]);

    repo.mergePlayers(anya, [anna, anyuta]);

    expect(repo.rosterInChat(CHAT_ID).find((player) => player.playerId === anya)?.games).toBe(TWO);
  });

  it("should do nothing when nothing was named", () => {
    const { keeper } = seedTypo();

    repo.mergePlayers(keeper, []);

    expect(repo.rosterInChat(CHAT_ID)).toHaveLength(THREE);
  });

  it("should refuse to seat one player twice in one game", () => {
    const [oleg = NONE, anya = NONE] = seedPlayers("Oleg", "Anya");
    playFullGame([oleg, anya], [oleg], [anya]);

    expect(() => repo.mergePlayers(oleg, [anya])).toThrow();
  });

  it("should leave both names in place when it refuses", () => {
    const [oleg = NONE, anya = NONE] = seedPlayers("Oleg", "Anya");
    playFullGame([oleg, anya], [oleg], [anya]);

    expect(() => repo.mergePlayers(oleg, [anya])).toThrow();

    expect(repo.rosterInChat(CHAT_ID)).toHaveLength(TWO);
  });
});

describe("opening a card", () => {
  it("should return the new game id", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(gameId).toBeGreaterThan(NONE);
  });

  it("should start in PICK_STARTER at version zero", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));
    const card = repo.cardById(gameId);

    expect(card?.game.state).toBe("PICK_STARTER");
    expect(card?.game.state_version).toBe(NONE);
  });

  it("should seat the players in the order given", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const gameId = repo.openGame(CHAT_ID, ids);

    expect(repo.cardById(gameId)?.seats.map((seat) => seat.player_id)).toEqual(ids);
  });

  it("should number the seats from zero", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya", "Roma"));

    expect(repo.cardById(gameId)?.seats.map((seat) => seat.seat_index)).toEqual([0, 1, 2]);
  });

  it("should refuse a second live card in the same chat", () => {
    const ids = seedPlayers("Oleg", "Anya");
    repo.openGame(CHAT_ID, ids);

    expect(() => repo.openGame(CHAT_ID, ids)).toThrow();
  });

  it("should allow a live card in a different chat", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));
    const other = repo.createPlayer(OTHER_CHAT_ID, "Stranger");

    expect(() => repo.openGame(OTHER_CHAT_ID, [other.id])).not.toThrow();
  });

  it("should roll back the seats when opening fails", () => {
    const ids = seedPlayers("Oleg", "Anya");
    repo.openGame(CHAT_ID, ids);

    expect(() => repo.openGame(CHAT_ID, ids)).toThrow();

    const seatRows = db.prepare("SELECT COUNT(*) AS c FROM game_players").get();

    expect(seatRows?.c).toBe(ids.length);
  });

  it("should attach a message id", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));
    repo.attachMessage(gameId, MESSAGE_ID);

    expect(repo.cardById(gameId)?.game.message_id).toBe(MESSAGE_ID);
  });
});

describe("liveCardInChat()", () => {
  it("should be null when nothing is open", () => {
    expect(repo.liveCardInChat(CHAT_ID)).toBeNull();
  });

  it("should find the open card", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(repo.liveCardInChat(CHAT_ID)?.game.id).toBe(gameId);
  });

  it("should stop finding it once confirmed", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);

    expect(repo.liveCardInChat(CHAT_ID)).toBeNull();
  });

  it("should not see another chat's card", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(repo.liveCardInChat(OTHER_CHAT_ID)).toBeNull();
  });
});

describe("storageSummary()", () => {
  it("should name the file it is actually writing to", () => {
    expect(repo.storageSummary().file).toContain("foolproof-sqlite-spec");
  });

  it("should report a real size, so an empty file is distinguishable", () => {
    expect(repo.storageSummary().sizeBytes).toBeGreaterThan(NONE);
  });

  it("should count the players", () => {
    seedPlayers("Oleg", "Anya");

    expect(repo.storageSummary().players).toBe(TWO);
  });

  it("should count every game, finished or not", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);
    repo.openGame(CHAT_ID, ids);

    expect(repo.storageSummary().games).toBe(TWO);
  });

  it("should count the live cards separately", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(repo.storageSummary().liveCards).toBe(ONCE);
  });

  it("should have nothing to report about a database with no games", () => {
    expect(repo.storageSummary().lastGameAt).toBeNull();
  });

  it("should date the newest game, which is how you tell tonight from last week", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);

    expect(repo.storageSummary().lastGameAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

describe("liveCards()", () => {
  it("should be empty when nothing is open anywhere", () => {
    expect(repo.liveCards()).toEqual([]);
  });

  it("should find an open card in every chat, since a restart has to redraw them all", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));
    repo.openGame(OTHER_CHAT_ID, seedPlayers("Roma", "Dima"));

    expect(repo.liveCards()).toHaveLength(TWO);
  });

  it("should carry the seats, so a card can be redrawn from what it returns", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(repo.liveCards()[0]?.seats).toHaveLength(TWO);
  });

  it("should carry the exits already recorded", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const gameId = repo.openGame(CHAT_ID, ids);

    repo.appendExit(gameId, ids[1] ?? NONE, ONCE, ACTOR_ID);

    expect(repo.liveCards()[0]?.exits).toHaveLength(ONCE);
  });

  it("should leave out a finished game", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);

    expect(repo.liveCards()).toEqual([]);
  });
});

describe("cardById()", () => {
  it("should be null for an unknown id", () => {
    const missingId = 9999;

    expect(repo.cardById(missingId)).toBeNull();
  });

  it("should order exits by position", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const gameId = repo.openGame(CHAT_ID, ids);

    repo.appendExit(gameId, ids[2] ?? NONE, 1, ACTOR_ID);
    repo.appendExit(gameId, ids[0] ?? NONE, 2, ACTOR_ID);

    expect(repo.cardById(gameId)?.exits).toEqual([
      { player_id: ids[2], position: 1 },
      { player_id: ids[0], position: 2 },
    ]);
  });
});

describe("updateCard()", () => {
  it("should store the phase, version and starter", () => {
    const ids = seedPlayers("Oleg", "Anya");
    const gameId = repo.openGame(CHAT_ID, ids);

    repo.updateCard(gameId, "RECORDING", 1, ids[0] ?? NONE);
    const card = repo.cardById(gameId);

    expect(card?.game.state).toBe("RECORDING");
    expect(card?.game.state_version).toBe(ONCE);
    expect(card?.game.starter_player_id).toBe(ids[0]);
  });

  it("should allow clearing the starter", () => {
    const ids = seedPlayers("Oleg", "Anya");
    const gameId = repo.openGame(CHAT_ID, ids);

    repo.updateCard(gameId, "RECORDING", 1, ids[0] ?? NONE);
    repo.updateCard(gameId, "PICK_STARTER", 2, null);

    expect(repo.cardById(gameId)?.game.starter_player_id).toBeNull();
  });
});

describe("exits", () => {
  it("should append an exit", () => {
    const ids = seedPlayers("Oleg", "Anya");
    const gameId = repo.openGame(CHAT_ID, ids);

    repo.appendExit(gameId, ids[0] ?? NONE, 1, ACTOR_ID);

    expect(repo.cardById(gameId)?.exits).toHaveLength(ONCE);
  });

  it("should record the actor on every event", () => {
    const ids = seedPlayers("Oleg", "Anya");
    const gameId = repo.openGame(CHAT_ID, ids);

    repo.appendExit(gameId, ids[0] ?? NONE, 1, ACTOR_ID);
    const row = db.prepare("SELECT actor_tg_id FROM game_events").get();

    expect(row?.actor_tg_id).toBe(ACTOR_ID);
  });

  it("should drop only the most recent exit", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const gameId = repo.openGame(CHAT_ID, ids);

    repo.appendExit(gameId, ids[0] ?? NONE, 1, ACTOR_ID);
    repo.appendExit(gameId, ids[1] ?? NONE, 2, ACTOR_ID);
    repo.dropLastExit(gameId);

    expect(repo.cardById(gameId)?.exits).toEqual([{ player_id: ids[0], position: 1 }]);
  });

  it("should tolerate dropping when there is nothing to drop", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(() => repo.dropLastExit(gameId)).not.toThrow();
  });
});

describe("confirmGame()", () => {
  it("should stamp confirmed_at and freeze the state", () => {
    const ids = seedPlayers("Oleg", "Anya");
    const gameId = playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);
    const card = repo.cardById(gameId);

    expect(card?.game.confirmed_at).not.toBeNull();
    expect(card?.game.state).toBe("FROZEN");
  });

  it("should write the finalists as events", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const gameId = playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);

    expect(repo.cardById(gameId)?.exits.map((exit) => exit.position)).toEqual([1, 2, 3]);
  });

  it("should let a draw share the last position", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const gameId = playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE, ids[2] ?? NONE]);

    expect(repo.cardById(gameId)?.exits.map((exit) => exit.position)).toEqual([1, 2, 2]);
  });
});

describe("forgetUnplayedPlayers()", () => {
  it("should forget a player created for a table that never became a game", () => {
    repo.createPlayer(CHAT_ID, "Kmi");

    repo.forgetUnplayedPlayers(CHAT_ID);

    expect(repo.playersInChat(CHAT_ID)).toHaveLength(NONE);
  });

  it("should keep a player seated at a card that is still open", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));
    repo.createPlayer(CHAT_ID, "Kmi");

    repo.forgetUnplayedPlayers(CHAT_ID);

    expect(repo.playersInChat(CHAT_ID).map((player) => player.display_name)).toEqual([
      "Oleg",
      "Anya",
    ]);
  });

  it("should leave another chat's players alone", () => {
    repo.createPlayer(OTHER_CHAT_ID, "Kmi");

    repo.forgetUnplayedPlayers(CHAT_ID);

    expect(repo.playersInChat(OTHER_CHAT_ID)).toHaveLength(ONCE);
  });
});

describe("discardGame()", () => {
  it("should remove the game", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    repo.discardGame(gameId);

    expect(repo.cardById(gameId)).toBeNull();
  });

  it("should cascade to the seats", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    repo.discardGame(gameId);
    const rows = db.prepare("SELECT COUNT(*) AS c FROM game_players").get();

    expect(rows?.c).toBe(NONE);
  });

  it("should cascade to the events", () => {
    const ids = seedPlayers("Oleg", "Anya");
    const gameId = repo.openGame(CHAT_ID, ids);
    repo.appendExit(gameId, ids[0] ?? NONE, 1, ACTOR_ID);

    repo.discardGame(gameId);
    const rows = db.prepare("SELECT COUNT(*) AS c FROM game_events").get();

    expect(rows?.c).toBe(NONE);
  });

  it("should forget a player created for the game and never seen anywhere else", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    repo.discardGame(gameId);

    expect(repo.playersInChat(CHAT_ID)).toHaveLength(NONE);
  });

  it("should keep a player who also appears in a confirmed game", () => {
    const [oleg = NONE, anya = NONE, roma = NONE] = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame([oleg, anya], [oleg], [anya]);
    const gameId = repo.openGame(CHAT_ID, [oleg, roma]);

    repo.discardGame(gameId);

    expect(repo.playersInChat(CHAT_ID).map((player) => player.display_name)).toContain("Oleg");
  });

  it("should keep a player seated in another game that still exists", () => {
    const oleg = repo.createPlayer(CHAT_ID, "Oleg");
    repo.openGame(OTHER_CHAT_ID, [oleg.id]);
    const anya = repo.createPlayer(CHAT_ID, "Anya");
    const gameId = repo.openGame(CHAT_ID, [anya.id]);

    repo.discardGame(gameId);

    expect(repo.playersInChat(CHAT_ID).map((player) => player.display_name)).toContain("Oleg");
  });

  it("should keep a player who is only some game's starter_player_id", () => {
    const oleg = repo.createPlayer(CHAT_ID, "Oleg");
    const starterGameId = repo.openGame(OTHER_CHAT_ID, [oleg.id]);
    repo.updateCard(starterGameId, "PICK_STARTER", ONCE, oleg.id);
    db.prepare("DELETE FROM game_players WHERE game_id = ? AND player_id = ?").run(
      starterGameId,
      oleg.id
    );
    const anya = repo.createPlayer(CHAT_ID, "Anya");
    const gameId = repo.openGame(CHAT_ID, [anya.id]);

    repo.discardGame(gameId);

    expect(repo.playersInChat(CHAT_ID).map((player) => player.display_name)).toContain("Oleg");
  });

  it("should do nothing when the game no longer exists", () => {
    const missingId = 9999;
    seedPlayers("Oleg");

    expect(() => repo.discardGame(missingId)).not.toThrow();
    expect(repo.playersInChat(CHAT_ID)).toHaveLength(ONCE);
  });

  it("should leave another chat's unreferenced players alone", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));
    repo.createPlayer(OTHER_CHAT_ID, "Stranger");

    repo.discardGame(gameId);

    expect(repo.playersInChat(OTHER_CHAT_ID)).toHaveLength(ONCE);
  });
});

describe("lastGame()", () => {
  it("should be null with no confirmed game", () => {
    expect(repo.lastGame(CHAT_ID)).toBeNull();
  });

  it("should ignore a card that is still live", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(repo.lastGame(CHAT_ID)).toBeNull();
  });

  it("should return the seating of the most recent confirmed game", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);

    expect(repo.lastGame(CHAT_ID)?.seats.map((seat) => seat.display_name)).toEqual([
      "Oleg",
      "Anya",
    ]);
  });

  it("should report the single player left at the end as the loser", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);

    expect(repo.lastGame(CHAT_ID)?.loserIds).toEqual([ids[1]]);
  });

  it("should report both players of a draw as losers, sorted by id", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE], [ids[2] ?? NONE, ids[1] ?? NONE]);

    expect(repo.lastGame(CHAT_ID)?.loserIds).toEqual([ids[1], ids[2]]);
  });

  it("should leave loserIds empty for a game confirmed with no events at all", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [], []);

    expect(repo.lastGame(CHAT_ID)?.loserIds).toEqual([]);
  });
});

describe("idleCards()", () => {
  it("should ignore a freshly touched card", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(repo.idleCards(IDLE_SECONDS)).toHaveLength(NONE);
  });

  it("should find a card untouched for longer than the threshold", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));
    db.prepare("UPDATE games SET last_touched_at = datetime('now','-4 hours') WHERE id = ?").run(
      gameId
    );

    expect(repo.idleCards(IDLE_SECONDS)).toHaveLength(ONCE);
  });

  it("should never sweep a confirmed game", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);
    db.prepare("UPDATE games SET last_touched_at = datetime('now','-4 hours')").run();

    expect(repo.idleCards(IDLE_SECONDS)).toHaveLength(NONE);
  });
});

describe("gameNumberInSeries()", () => {
  it("should start at one in an empty chat", () => {
    expect(repo.gameNumberInSeries(CHAT_ID)).toBe(ONCE);
  });

  it("should advance with each confirmed game", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);

    expect(repo.gameNumberInSeries(CHAT_ID)).toBe(2);
  });

  it("should restart after a long gap", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);
    ageAllGames("-2 days");

    expect(repo.gameNumberInSeries(CHAT_ID)).toBe(ONCE);
  });
});

describe("seriesChronology()", () => {
  const namesOf = (chatId: number): readonly string[] =>
    repo.seriesChronology(chatId)?.players.map((player) => player.displayName) ?? [];

  it("should report nothing for a chat that has never played", () => {
    expect(repo.seriesChronology(CHAT_ID)).toBeNull();
  });

  it("should return one entry per game of the current session", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    playFullGame(ids, [ids[1] ?? NONE, ids[0] ?? NONE], [ids[2] ?? NONE]);

    expect(repo.seriesChronology(CHAT_ID)?.games).toHaveLength(TWO);
  });

  it("should report who dealt each game", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const gameId = playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    repo.updateCard(gameId, "RECORDING", ONCE, ids[1] ?? NONE);

    expect(repo.seriesChronology(CHAT_ID)?.games[0]?.starterId).toBe(ids[1]);
  });

  it("should report no dealer for a game whose starter was never set", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);

    expect(repo.seriesChronology(CHAT_ID)?.games[0]?.starterId).toBeNull();
  });

  it("should keep each game's own dealer rather than the first game's", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const first = playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    const second = playFullGame(ids, [ids[1] ?? NONE, ids[0] ?? NONE], [ids[2] ?? NONE]);
    repo.updateCard(first, "RECORDING", ONCE, ids[0] ?? NONE);
    repo.updateCard(second, "RECORDING", ONCE, ids[2] ?? NONE);

    expect(repo.seriesChronology(CHAT_ID)?.games.map((game) => game.starterId)).toEqual([
      ids[0],
      ids[2],
    ]);
  });

  it("should keep the games in the order they were played", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    const first = playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    const second = playFullGame(ids, [ids[1] ?? NONE, ids[0] ?? NONE], [ids[2] ?? NONE]);

    expect(repo.seriesChronology(CHAT_ID)?.games.map((game) => game.gameId)).toEqual([
      first,
      second,
    ]);
  });

  it("should carry every player's finishing position", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);

    expect(repo.seriesChronology(CHAT_ID)?.games[0]?.placements).toEqual([
      { playerId: ids[0], position: 1 },
      { playerId: ids[1], position: TWO },
      { playerId: ids[2], position: THREE },
    ]);
  });

  it("should give both players of a draw the same position", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE, ids[2] ?? NONE]);
    const shared = repo.seriesChronology(CHAT_ID)?.games[0]?.placements.filter(
      (placement) => placement.position === TWO
    );

    expect(shared).toHaveLength(TWO);
  });

  it("should leave a player out of a game they sat out", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    playFullGame([ids[0] ?? NONE, ids[1] ?? NONE], [ids[0] ?? NONE], [ids[1] ?? NONE]);
    const second = repo.seriesChronology(CHAT_ID)?.games[1]?.placements ?? [];

    expect(second.some((placement) => placement.playerId === ids[2])).toBe(false);
  });

  it("should list every player who took part in the session", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame([ids[0] ?? NONE, ids[1] ?? NONE], [ids[0] ?? NONE], [ids[1] ?? NONE]);
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);

    expect(namesOf(CHAT_ID)).toEqual(["Oleg", "Anya", "Roma"]);
  });

  it("should order the columns by seat, so a latecomer lands on the right", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame([ids[2] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE], [ids[1] ?? NONE]);
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);

    expect(namesOf(CHAT_ID)).toEqual(["Roma", "Anya", "Oleg"]);
  });

  it("should date the session by its first game", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);
    const today = db.prepare("SELECT date('now') AS today").get()?.today;

    expect(repo.seriesChronology(CHAT_ID)?.startedOn).toBe(today);
  });

  it("should leave an older session out", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    ageAllGames("-2 days");
    playFullGame(ids, [ids[1] ?? NONE, ids[0] ?? NONE], [ids[2] ?? NONE]);

    expect(repo.seriesChronology(CHAT_ID)?.games).toHaveLength(ONCE);
  });

  it("should not mix another chat's session in", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);

    expect(repo.seriesChronology(OTHER_CHAT_ID)).toBeNull();
  });
});

describe("the language a chat chose", () => {
  it("should have none until the chat chooses", () => {
    expect(repo.chatLocale(CHAT_ID)).toBeNull();
  });

  it("should read back what was remembered", () => {
    repo.rememberChatLocale(CHAT_ID, "ru");

    expect(repo.chatLocale(CHAT_ID)).toBe("ru");
  });

  it("should replace an earlier choice rather than fail on the second one", () => {
    repo.rememberChatLocale(CHAT_ID, "ru");
    repo.rememberChatLocale(CHAT_ID, "en");

    expect(repo.chatLocale(CHAT_ID)).toBe("en");
  });

  it("should keep each chat's choice to itself", () => {
    repo.rememberChatLocale(CHAT_ID, "ru");

    expect(repo.chatLocale(OTHER_CHAT_ID)).toBeNull();
  });
});
