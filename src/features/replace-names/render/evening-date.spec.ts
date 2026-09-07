import { describe, expect, it } from "vitest";
import { copy } from "#replace-names/copy.en.ts";
import { copy as russian } from "#replace-names/copy.ru.ts";
import { eveningDate } from "#replace-names/render/evening-date.ts";


const JULY = 6;

describe("eveningDate()", () => {
  it("should name the month and drop the year", () => {
    expect(eveningDate(copy, "2026-09-04")).toBe("4 September");
  });

  it("should drop the leading zero of the day", () => {
    expect(eveningDate(copy, "2026-07-04")).toBe("4 July");
  });

  it("should keep both digits of a two-digit day", () => {
    expect(eveningDate(copy, "2026-07-24")).toBe("24 July");
  });

  it("should name the first month", () => {
    expect(eveningDate(copy, "2026-01-15")).toBe("15 January");
  });

  it("should name the last month", () => {
    expect(eveningDate(copy, "2026-12-15")).toBe("15 December");
  });

  it("should take the month's name from the table it was given", () => {
    expect(eveningDate(russian, "2026-07-24")).toContain(russian.months[JULY] ?? "");
  });

  it("should fall back to the raw date when the month has no name", () => {
    expect(eveningDate(copy, "2026-13-15")).toBe("2026-13-15");
  });

  it("should fall back to the raw date when the day is missing", () => {
    expect(eveningDate(copy, "2026-07")).toBe("2026-07");
  });

  it("should fall back to the raw date on garbage", () => {
    expect(eveningDate(copy, "tonight")).toBe("tonight");
  });
});
