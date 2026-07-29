import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";


const DB_FILE = join(tmpdir(), `foolproof-sqlite-spec-${process.pid}.db`);

process.env.DB_PATH = DB_FILE;

const { sqliteRepository: repo } = await import("./sqlite.ts");
const { db } = await import("../db.ts");

const CHAT_ID = -100777;

const OTHER_CHAT_ID = -100888;

const ACTOR_ID = 777;

const MESSAGE_ID = 500;

const IDLE_SECONDS = 10_800;

const NONE = 0;

const ONCE = 1;

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

describe("deleteGame()", () => {
  it("should remove the game", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    repo.deleteGame(gameId);

    expect(repo.cardById(gameId)).toBeNull();
  });

  it("should cascade to the seats", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    repo.deleteGame(gameId);
    const rows = db.prepare("SELECT COUNT(*) AS c FROM game_players").get();

    expect(rows?.c).toBe(NONE);
  });

  it("should cascade to the events", () => {
    const ids = seedPlayers("Oleg", "Anya");
    const gameId = repo.openGame(CHAT_ID, ids);
    repo.appendExit(gameId, ids[0] ?? NONE, 1, ACTOR_ID);

    repo.deleteGame(gameId);
    const rows = db.prepare("SELECT COUNT(*) AS c FROM game_events").get();

    expect(rows?.c).toBe(NONE);
  });

  it("should leave the players alone", () => {
    const gameId = repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    repo.deleteGame(gameId);

    expect(repo.playersInChat(CHAT_ID)).toHaveLength(2);
  });
});

describe("lastLineup()", () => {
  it("should be null with no confirmed game", () => {
    expect(repo.lastLineup(CHAT_ID)).toBeNull();
  });

  it("should ignore a card that is still live", () => {
    repo.openGame(CHAT_ID, seedPlayers("Oleg", "Anya"));

    expect(repo.lastLineup(CHAT_ID)).toBeNull();
  });

  it("should return the seating of the most recent confirmed game", () => {
    const ids = seedPlayers("Oleg", "Anya");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE]);

    expect(repo.lastLineup(CHAT_ID)?.map((seat) => seat.display_name)).toEqual(["Oleg", "Anya"]);
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

describe("seriesStats()", () => {
  it("should report nothing for an empty chat", () => {
    expect(repo.seriesStats(CHAT_ID)).toEqual({ games: NONE, players: [] });
  });

  it("should count the games of the current session", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    playFullGame(ids, [ids[1] ?? NONE, ids[0] ?? NONE], [ids[2] ?? NONE]);

    expect(repo.seriesStats(CHAT_ID).games).toBe(2);
  });

  it("should credit a win to whoever went out first", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    const oleg = repo.seriesStats(CHAT_ID).players.find((p) => p.displayName === "Oleg");

    expect(oleg?.wins).toBe(ONCE);
  });

  it("should credit the fool to whoever was left", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    const roma = repo.seriesStats(CHAT_ID).players.find((p) => p.displayName === "Roma");

    expect(roma?.fools).toBe(ONCE);
  });

  it("should count no fool when the last place was shared", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE, ids[2] ?? NONE]);
    const tallies = repo.seriesStats(CHAT_ID).players;

    expect(tallies.every((player) => player.fools === NONE)).toBe(true);
  });

  it("should still credit the winner of a drawn game", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE], [ids[1] ?? NONE, ids[2] ?? NONE]);
    const oleg = repo.seriesStats(CHAT_ID).players.find((p) => p.displayName === "Oleg");

    expect(oleg?.wins).toBe(ONCE);
  });

  it("should leave an older session out of the numbers", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    ageAllGames("-2 days");
    playFullGame(ids, [ids[1] ?? NONE, ids[0] ?? NONE], [ids[2] ?? NONE]);

    expect(repo.seriesStats(CHAT_ID).games).toBe(ONCE);
  });

  it("should count how many games each player took part in", () => {
    const ids = seedPlayers("Oleg", "Anya", "Roma");
    playFullGame(ids, [ids[0] ?? NONE, ids[1] ?? NONE], [ids[2] ?? NONE]);
    playFullGame(ids, [ids[1] ?? NONE, ids[0] ?? NONE], [ids[2] ?? NONE]);
    const anya = repo.seriesStats(CHAT_ID).players.find((p) => p.displayName === "Anya");

    expect(anya?.games).toBe(2);
  });
});
