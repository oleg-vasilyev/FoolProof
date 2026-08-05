import { Problem } from "#live-game/domain/refusals.ts";
import { describe, expect, it } from "vitest";
import { LONGEST_NAME, MOST_PLAYERS } from "#live-game/domain/card-state.ts";
import {
  normalizeName,
  parseLineup,
  parseNames,
  rotateToLowestId,
  stripCommand,
} from "#live-game/domain/lineup-parsing.ts";


const THREE_NAMES = ["Oleg", "Anya", "Roma"];

const OVER_THE_CAP = LONGEST_NAME + 1;

const OVERLONG = "L".repeat(OVER_THE_CAP);

const EMOJI_AT_THE_CAP = "🂡".repeat(LONGEST_NAME);

const OVER_THE_TABLE = MOST_PLAYERS + 1;

const A_FULL_TABLE = Array.from({ length: MOST_PLAYERS }, (_, at) => `P${String(at)}`);

const ONE_TOO_MANY = Array.from({ length: OVER_THE_TABLE }, (_, at) => `P${String(at)}`);

describe("stripCommand()", () => {
  it("should drop a bare command", () => {
    expect(stripCommand("/game Oleg, Anya")).toBe("Oleg, Anya");
  });

  it("should drop the @botname suffix Telegram adds in groups", () => {
    expect(stripCommand("/game@foolproof_bot Oleg, Anya")).toBe("Oleg, Anya");
  });

  it("should leave plain text alone", () => {
    expect(stripCommand("Oleg, Anya")).toBe("Oleg, Anya");
  });

  it("should only strip a leading command", () => {
    expect(stripCommand("Oleg /game Anya")).toBe("Oleg /game Anya");
  });
});

describe("normalizeName()", () => {
  it("should lower case", () => {
    expect(normalizeName("ОЛЕГ")).toBe("олег");
  });

  it("should fold yo onto ye", () => {
    expect(normalizeName("Пётр")).toBe("петр");
  });

  it("should normalise combining marks to NFC", () => {
    const decomposed = "й";

    expect(normalizeName(decomposed)).toBe("й");
  });

  it("should not assume latin", () => {
    expect(normalizeName("たなか")).toBe("たなか");
  });
});

describe("parseNames()", () => {
  it("should accept a single name", () => {
    expect(parseNames("/next_with Zhenya")).toEqual({ ok: true, names: ["Zhenya"] });
  });

  it("should strip the command prefix", () => {
    expect(parseNames("/next_with@foolproof_bot Zhenya")).toEqual({ ok: true, names: ["Zhenya"] });
  });

  it("should report an empty argument as empty", () => {
    expect(parseNames("/next_with")).toEqual({ ok: false, problem: Problem.Empty });
  });

  it("should report repeated names as duplicates carrying the repeated names", () => {
    expect(parseNames("/next_with Oleg, Anya, Oleg")).toEqual({
      ok: false,
      problem: Problem.Duplicates,
      names: ["Oleg"],
    });
  });

  it("should refuse a name too long for a button, carrying only the ones at fault", () => {
    expect(parseNames(`/next_with Anya, ${OVERLONG}`)).toEqual({
      ok: false,
      problem: Problem.TooLong,
      names: [OVERLONG],
    });
  });

  it("should count a name in characters, not in the bytes an emoji costs", () => {
    expect(parseNames(`/next_with ${EMOJI_AT_THE_CAP}`)).toEqual({
      ok: true,
      names: [EMOJI_AT_THE_CAP],
    });
  });

  it("should refuse a long name before blaming it for repeating", () => {
    expect(parseNames(`/next_with ${OVERLONG}, ${OVERLONG}`)).toMatchObject({
      problem: Problem.TooLong,
    });
  });
});

describe("parseNames(), on characters nobody can see", () => {
  it("should drop a name made only of a zero-width space", () => {
    expect(parseNames("/next_with Anya, ​, Kim")).toEqual({
      ok: true,
      names: ["Anya", "Kim"],
    });
  });

  it("should report a line-up of nothing but invisibles as empty", () => {
    expect(parseNames("/next_with ​﻿")).toEqual({ ok: false, problem: Problem.Empty });
  });

  it("should take the invisibles out of a name rather than store them", () => {
    expect(parseNames("/next_with A​nya")).toEqual({ ok: true, names: ["Anya"] });
  });

  it("should see two names that differ only by an invisible as one repeat", () => {
    expect(parseNames("/next_with Anya, An﻿ya")).toEqual({
      ok: false,
      problem: Problem.Duplicates,
      names: ["Anya"],
    });
  });
});

describe("parseLineup()", () => {
  it("should split on commas", () => {
    expect(parseLineup("/game Oleg, Anya, Roma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should split on arrows and angle brackets", () => {
    expect(parseLineup("/game Oleg -> Anya → Roma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should split on a bare angle bracket", () => {
    expect(parseLineup("/game Oleg > Anya > Roma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should split on newlines", () => {
    expect(parseLineup("/game Oleg\nAnya\nRoma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should split on carriage returns", () => {
    expect(parseLineup("/game Oleg\r\nAnya\r\nRoma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should trim whitespace around every name", () => {
    expect(parseLineup("/game   Oleg  ,  Anya ")).toEqual({ ok: true, names: ["Oleg", "Anya"] });
  });

  it("should ignore empty segments from doubled separators", () => {
    expect(parseLineup("/game Oleg,,Anya")).toEqual({ ok: true, names: ["Oleg", "Anya"] });
  });

  it("should report an empty lineup", () => {
    expect(parseLineup("/game")).toEqual({ ok: false, problem: Problem.Empty });
  });

  it("should seat a table right up to the cap", () => {
    expect(parseLineup(`/game ${A_FULL_TABLE.join(", ")}`)).toEqual({
      ok: true,
      names: A_FULL_TABLE,
    });
  });

  it("should refuse one player past the cap", () => {
    expect(parseLineup(`/game ${ONE_TOO_MANY.join(", ")}`)).toEqual({
      ok: false,
      problem: Problem.TooMany,
    });
  });

  it("should refuse a name for its length before counting the table", () => {
    expect(parseLineup(`/game ${OVERLONG}, ${ONE_TOO_MANY.join(", ")}`)).toMatchObject({
      problem: Problem.TooLong,
    });
  });

  it("should report whitespace-only input as empty", () => {
    expect(parseLineup("/game    ")).toEqual({ ok: false, problem: Problem.Empty });
  });

  it("should reject a single player", () => {
    expect(parseLineup("/game Oleg")).toEqual({ ok: false, problem: Problem.TooFew });
  });

  it("should reject duplicates", () => {
    expect(parseLineup("/game Oleg, Anya, Oleg")).toEqual({
      ok: false,
      problem: Problem.Duplicates,
      names: ["Oleg"],
    });
  });

  it("should catch duplicates that differ only by case", () => {
    expect(parseLineup("/game Oleg, ОЛЕГ, олег")).toMatchObject({ problem: Problem.Duplicates });
  });

  it("should catch duplicates that differ only by yo", () => {
    expect(parseLineup("/game Пётр, Анна, Петр")).toMatchObject({ problem: Problem.Duplicates });
  });

  it("should keep names exactly as typed when they are accepted", () => {
    expect(parseLineup("/game ОлЕг, аНя")).toEqual({ ok: true, names: ["ОлЕг", "аНя"] });
  });
});

describe("rotateToLowestId()", () => {
  it("should rotate the lowest id into seat zero", () => {
    const rotated = rotateToLowestId([{ playerId: 7 }, { playerId: 3 }, { playerId: 9 }]);

    expect(rotated).toEqual([{ playerId: 3 }, { playerId: 9 }, { playerId: 7 }]);
  });

  it("should give the same seating for the same table typed differently", () => {
    const typedOneWay = rotateToLowestId([{ playerId: 7 }, { playerId: 3 }, { playerId: 9 }]);
    const typedAnother = rotateToLowestId([{ playerId: 9 }, { playerId: 7 }, { playerId: 3 }]);

    expect(typedAnother).toEqual(typedOneWay);
  });

  it("should preserve the cyclic order", () => {
    const rotated = rotateToLowestId([{ playerId: 5 }, { playerId: 8 }, { playerId: 2 }]);

    expect(rotated).toEqual([{ playerId: 2 }, { playerId: 5 }, { playerId: 8 }]);
  });

  it("should leave an already rotated table alone", () => {
    const seats = [{ playerId: 1 }, { playerId: 4 }, { playerId: 6 }];

    expect(rotateToLowestId(seats)).toEqual(seats);
  });

  it("should handle an empty list", () => {
    expect(rotateToLowestId([])).toEqual([]);
  });
});
