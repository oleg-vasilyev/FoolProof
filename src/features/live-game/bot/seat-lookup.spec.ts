import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { playerIdOf, seatRecordsOf } from "#shared/repository/database-records.stub.ts";
import { CHAT_ID } from "#live-game/bot/grammy-context.stub.ts";


const normalizeNameSpy = vi.fn();

vi.mock("#live-game/domain/lineup-parsing.ts", () => ({
  normalizeName: (name: string) => normalizeNameSpy(name),
}));

const { resolveSeats, toSeats } = await import("#live-game/bot/seat-lookup.ts");

const NEVER = 0;

const ONCE = 1;

const THREE = ["Oleg", "Anya", "Roma"];

const NEW_PLAYER_ID = 1;

const KNOWN_PLAYER_ID = 7;

const SAME_KEY = "one-and-the-same";

describe("toSeats()", () => {
  it("should map repository seat records to seats, keeping order", () => {
    const records = seatRecordsOf(...THREE);

    expect(toSeats(records)).toEqual([
      { playerId: playerIdOf(0), displayName: "Oleg" },
      { playerId: playerIdOf(1), displayName: "Anya" },
      { playerId: playerIdOf(2), displayName: "Roma" },
    ]);
  });
});

describe("resolveSeats()", () => {
  let repo: RepositoryStub;

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    normalizeNameSpy.mockImplementation((name: string) => name);
  });

  it("should reuse a player already known to the chat instead of creating a duplicate", () => {
    repo.playersInChatSpy.mockReturnValue([
      { id: KNOWN_PLAYER_ID, chat_id: CHAT_ID, display_name: "Oleg" },
    ]);
    normalizeNameSpy.mockImplementation(() => SAME_KEY);

    const seats = resolveSeats(repo, CHAT_ID, ["Oleg"]);

    expect(seats).toEqual([{ playerId: KNOWN_PLAYER_ID, displayName: "Oleg" }]);
    expect(repo.createPlayerSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should create a player it has not seen before", () => {
    repo.playersInChatSpy.mockReturnValue([]);

    resolveSeats(repo, CHAT_ID, ["Dima"]);

    expect(repo.createPlayerSpy).toHaveBeenCalledWith(CHAT_ID, "Dima");
  });

  it("should seat a player it just created under the id and name it got back", () => {
    repo.playersInChatSpy.mockReturnValue([]);
    repo.createPlayerSpy.mockReturnValue({
      id: NEW_PLAYER_ID,
      chat_id: CHAT_ID,
      display_name: "Dima",
    });

    expect(resolveSeats(repo, CHAT_ID, ["Dima"])).toEqual([
      { playerId: NEW_PLAYER_ID, displayName: "Dima" },
    ]);
  });

  it("should look players up through normalizeName", () => {
    repo.playersInChatSpy.mockReturnValue([
      { id: KNOWN_PLAYER_ID, chat_id: CHAT_ID, display_name: "Oleg" },
    ]);

    resolveSeats(repo, CHAT_ID, ["OLEG"]);

    expect(normalizeNameSpy).toHaveBeenCalledWith("Oleg");
    expect(normalizeNameSpy).toHaveBeenCalledWith("OLEG");
  });

  it("should not create the same new name twice within one call", () => {
    repo.playersInChatSpy.mockReturnValue([]);
    repo.createPlayerSpy.mockReturnValue({
      id: NEW_PLAYER_ID,
      chat_id: CHAT_ID,
      display_name: "Dima",
    });
    normalizeNameSpy.mockImplementation(() => SAME_KEY);

    resolveSeats(repo, CHAT_ID, ["Dima", "dima"]);

    expect(repo.createPlayerSpy).toHaveBeenCalledTimes(ONCE);
  });
});
