import { describe, expect, it } from "vitest";
import { NameProblem } from "#shared/table/name-problems.ts";
import { LONGEST_NAME } from "#shared/table/table-limits.ts";
import { normalizeName, parseNameList, visibleName } from "#shared/table/name-list.ts";


const THREE_NAMES = ["Oleg", "Anya", "Roma"];

const OVER_THE_CAP = LONGEST_NAME + 1;

const OVERLONG = "L".repeat(OVER_THE_CAP);

const EMOJI_AT_THE_CAP = "🂡".repeat(LONGEST_NAME);

describe("visibleName()", () => {
  it("should trim the whitespace around a name", () => {
    expect(visibleName("  Anya ")).toBe("Anya");
  });

  it("should take the invisibles out of a name rather than keep them", () => {
    expect(visibleName("A​nya")).toBe("Anya");
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
    const decomposed = "й";

    expect(normalizeName(decomposed)).toBe("й");
  });

  it("should not assume latin", () => {
    expect(normalizeName("たなか")).toBe("たなか");
  });
});

describe("parseNameList()", () => {
  it("should accept a single name", () => {
    expect(parseNameList("Zhenya")).toEqual({ ok: true, names: ["Zhenya"] });
  });

  it("should split on commas", () => {
    expect(parseNameList("Oleg, Anya, Roma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should split on arrows and angle brackets", () => {
    expect(parseNameList("Oleg -> Anya → Roma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should split on a bare angle bracket", () => {
    expect(parseNameList("Oleg > Anya > Roma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should split on newlines", () => {
    expect(parseNameList("Oleg\nAnya\nRoma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should split on carriage returns", () => {
    expect(parseNameList("Oleg\r\nAnya\r\nRoma")).toEqual({ ok: true, names: THREE_NAMES });
  });

  it("should trim whitespace around every name", () => {
    expect(parseNameList("  Oleg  ,  Anya ")).toEqual({ ok: true, names: ["Oleg", "Anya"] });
  });

  it("should ignore empty segments from doubled separators", () => {
    expect(parseNameList("Oleg,,Anya")).toEqual({ ok: true, names: ["Oleg", "Anya"] });
  });

  it("should report an empty text as empty", () => {
    expect(parseNameList("")).toEqual({ ok: false, problem: NameProblem.Empty });
  });

  it("should report whitespace-only text as empty", () => {
    expect(parseNameList("   ")).toEqual({ ok: false, problem: NameProblem.Empty });
  });

  it("should report repeated names as duplicates carrying the repeated names", () => {
    expect(parseNameList("Oleg, Anya, Oleg")).toEqual({
      ok: false,
      problem: NameProblem.Duplicates,
      names: ["Oleg"],
    });
  });

  it("should catch duplicates that differ only by case", () => {
    expect(parseNameList("Oleg, ОЛЕГ, олег")).toMatchObject({ problem: NameProblem.Duplicates });
  });

  it("should catch duplicates that differ only by yo", () => {
    expect(parseNameList("Пётр, Анна, Петр")).toMatchObject({ problem: NameProblem.Duplicates });
  });

  it("should keep names exactly as typed when they are accepted", () => {
    expect(parseNameList("ОлЕг, аНя")).toEqual({ ok: true, names: ["ОлЕг", "аНя"] });
  });

  it("should refuse a name too long for a button, carrying only the ones at fault", () => {
    expect(parseNameList(`Anya, ${OVERLONG}`)).toEqual({
      ok: false,
      problem: NameProblem.TooLong,
      names: [OVERLONG],
    });
  });

  it("should count a name in characters, not in the bytes an emoji costs", () => {
    expect(parseNameList(EMOJI_AT_THE_CAP)).toEqual({ ok: true, names: [EMOJI_AT_THE_CAP] });
  });

  it("should refuse a long name before blaming it for repeating", () => {
    expect(parseNameList(`${OVERLONG}, ${OVERLONG}`)).toMatchObject({
      problem: NameProblem.TooLong,
    });
  });
});

describe("parseNameList(), on characters nobody can see", () => {
  it("should drop a name made only of a zero-width space", () => {
    expect(parseNameList("Anya, ​, Kim")).toEqual({ ok: true, names: ["Anya", "Kim"] });
  });

  it("should report a list of nothing but invisibles as empty", () => {
    expect(parseNameList("​﻿")).toEqual({ ok: false, problem: NameProblem.Empty });
  });

  it("should take the invisibles out of a name rather than store them", () => {
    expect(parseNameList("A​nya")).toEqual({ ok: true, names: ["Anya"] });
  });

  it("should see two names that differ only by an invisible as one repeat", () => {
    expect(parseNameList("Anya, An﻿ya")).toEqual({
      ok: false,
      problem: NameProblem.Duplicates,
      names: ["Anya"],
    });
  });
});
