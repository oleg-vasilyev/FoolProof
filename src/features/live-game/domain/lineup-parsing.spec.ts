import { beforeEach, describe, expect, it, vi } from "vitest";
import { Problem } from "#live-game/domain/refusals.ts";
import { NameProblem } from "#shared/table/name-problems.ts";
import { MIN_PLAYERS, MOST_PLAYERS } from "#shared/table/table-limits.ts";


const parseNameListSpy = vi.fn();

vi.mock("#shared/table/name-list.ts", () => ({
  parseNameList: (text: string) => parseNameListSpy(text),
  normalizeName: vi.fn(),
  visibleName: vi.fn(),
}));

const { parseLineup, parseNames, stripCommand } = await import(
  "#live-game/domain/lineup-parsing.ts"
);

const A_FULL_TABLE = Array.from({ length: MOST_PLAYERS }, (_, at) => `P${String(at)}`);

const ONE_TOO_MANY = Array.from({ length: MOST_PLAYERS + 1 }, (_, at) => `P${String(at)}`);

const ONE_TOO_FEW = Array.from({ length: MIN_PLAYERS - 1 }, (_, at) => `P${String(at)}`);

const ONCE = 1;

const accepted = (names: readonly string[]) => ({ ok: true, names });

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

describe("parseNames()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parseNameListSpy.mockReturnValue(accepted(["Zhenya"]));
  });

  it("should hand the text after the command to the shared list parser", () => {
    parseNames("/next_with@foolproof_bot Zhenya");

    expect(parseNameListSpy).toHaveBeenCalledWith("Zhenya");
  });

  it("should hand back whatever the list parser decided", () => {
    const decided = { ok: false, problem: NameProblem.Empty };
    parseNameListSpy.mockReturnValue(decided);

    expect(parseNames("/next_with")).toBe(decided);
  });
});

describe("parseLineup()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parseNameListSpy.mockReturnValue(accepted(A_FULL_TABLE));
  });

  it("should parse the names once, after the command", () => {
    parseLineup("/game Oleg, Anya, Roma");

    expect(parseNameListSpy).toHaveBeenCalledTimes(ONCE);
    expect(parseNameListSpy).toHaveBeenCalledWith("Oleg, Anya, Roma");
  });

  it("should pass a list problem through untouched", () => {
    const problem = { ok: false, problem: NameProblem.Duplicates, names: ["Oleg"] };
    parseNameListSpy.mockReturnValue(problem);

    expect(parseLineup("/game Oleg, Oleg")).toBe(problem);
  });

  it("should seat a table right up to the cap", () => {
    expect(parseLineup("/game whatever")).toEqual(accepted(A_FULL_TABLE));
  });

  it("should refuse one player past the cap", () => {
    parseNameListSpy.mockReturnValue(accepted(ONE_TOO_MANY));

    expect(parseLineup("/game whatever")).toEqual({ ok: false, problem: Problem.TooMany });
  });

  it("should refuse one player short of a table", () => {
    parseNameListSpy.mockReturnValue(accepted(ONE_TOO_FEW));

    expect(parseLineup("/game whatever")).toEqual({ ok: false, problem: Problem.TooFew });
  });

  it("should seat exactly the minimum", () => {
    const smallest = A_FULL_TABLE.slice(0, MIN_PLAYERS);
    parseNameListSpy.mockReturnValue(accepted(smallest));

    expect(parseLineup("/game whatever")).toEqual(accepted(smallest));
  });
});
