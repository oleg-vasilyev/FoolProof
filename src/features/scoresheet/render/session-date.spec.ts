import { describe, expect, it } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";
import { copy as russian } from "#scoresheet/copy.ru.ts";
import { sessionDate } from "#scoresheet/render/session-date.ts";


const MONTHS_IN_YEAR = 12;

const ONE = 1;

const TWO = 2;

const everyMonth = (table: typeof copy): readonly string[] =>
  Array.from({ length: MONTHS_IN_YEAR }, (_unused, index) =>
    sessionDate(table, `2026-${String(index + ONE).padStart(TWO, "0")}-15`)
  );

describe("sessionDate()", () => {
  it("should print the day, the month's name and the year", () => {
    expect(sessionDate(copy, "2026-07-24")).toBe("24 Jul 2026");
  });

  it("should drop the leading zero from a single-digit day", () => {
    expect(sessionDate(copy, "2026-07-04")).toBe("4 Jul 2026");
  });

  it("should name the first month", () => {
    expect(sessionDate(copy, "2026-01-15")).toBe("15 Jan 2026");
  });

  it("should name the last month", () => {
    expect(sessionDate(copy, "2026-12-15")).toBe("15 Dec 2026");
  });

  it("should give every month a name of its own", () => {
    expect(new Set(everyMonth(copy)).size).toBe(MONTHS_IN_YEAR);
  });

  it("should take the month names from the copy it was given", () => {
    expect(sessionDate(russian, "2026-07-24")).toContain(russian.months[6] ?? "");
  });

  it("should not fall back to the copy it imported", () => {
    expect(sessionDate(russian, "2026-07-24")).not.toContain("Jul");
  });

  it("should fall back to what it was given when the month is out of range", () => {
    expect(sessionDate(copy, "2026-13-15")).toBe("2026-13-15");
  });

  it("should fall back to what it was given when the date is not a date", () => {
    expect(sessionDate(copy, "tonight")).toBe("tonight");
  });

  it("should fall back rather than print a partial date", () => {
    expect(sessionDate(copy, "2026-07")).toBe("2026-07");
  });
});
