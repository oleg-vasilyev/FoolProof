import { describe, expect, it } from "vitest";
import { normalizeName, parseLineup, rotateToLowestId, stripCommand } from "#live-game/domain/lineup-parsing.ts";


const THREE_NAMES = ["Oleg", "Anya", "Roma"];

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
    expect(parseLineup("/game")).toEqual({ ok: false, problem: "empty" });
  });

  it("should report whitespace-only input as empty", () => {
    expect(parseLineup("/game    ")).toEqual({ ok: false, problem: "empty" });
  });

  it("should reject a single player", () => {
    expect(parseLineup("/game Oleg")).toEqual({ ok: false, problem: "too_few" });
  });

  it("should reject duplicates", () => {
    expect(parseLineup("/game Oleg, Anya, Oleg")).toEqual({
      ok: false,
      problem: "duplicates",
      names: ["Oleg"],
    });
  });

  it("should catch duplicates that differ only by case", () => {
    expect(parseLineup("/game Oleg, ОЛЕГ, олег")).toMatchObject({ problem: "duplicates" });
  });

  it("should catch duplicates that differ only by yo", () => {
    expect(parseLineup("/game Пётр, Анна, Петр")).toMatchObject({ problem: "duplicates" });
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
