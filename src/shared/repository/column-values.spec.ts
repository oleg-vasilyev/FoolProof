import { describe, expect, it } from "vitest";
import {
  nullableNum,
  nullableText,
  numberOr,
  requireNum,
  requireText,
} from "#shared/repository/column-values.ts";


const ZERO = 0;

const FALLBACK = 7;

const COUNT = 42;

describe("numberOr()", () => {
  it("should pass a number straight through", () => {
    expect(numberOr(COUNT, FALLBACK)).toBe(COUNT);
  });

  it("should keep zero rather than treating it as missing", () => {
    expect(numberOr(ZERO, FALLBACK)).toBe(ZERO);
  });

  it("should narrow a bigint, since SQLite returns rowids as one", () => {
    expect(numberOr(BigInt(COUNT), FALLBACK)).toBe(COUNT);
  });

  it("should return a number, not a bigint, so arithmetic downstream works", () => {
    expect(typeof numberOr(BigInt(COUNT), FALLBACK)).toBe("number");
  });

  it("should fall back on a missing column", () => {
    expect(numberOr(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it("should fall back on a null column", () => {
    expect(numberOr(null, FALLBACK)).toBe(FALLBACK);
  });

  it("should fall back rather than coerce a numeric string", () => {
    expect(numberOr("42", FALLBACK)).toBe(FALLBACK);
  });

  it("should fall back on a value of the wrong shape entirely", () => {
    expect(numberOr({ id: COUNT }, FALLBACK)).toBe(FALLBACK);
  });
});

describe("requireNum()", () => {
  it("should pass a number straight through", () => {
    expect(requireNum(COUNT)).toBe(COUNT);
  });

  it("should keep zero, which is a real value for a message sentinel", () => {
    expect(requireNum(ZERO)).toBe(ZERO);
  });

  it("should narrow a bigint, since SQLite returns rowids as one", () => {
    expect(requireNum(BigInt(COUNT))).toBe(COUNT);
  });

  it("should return a number, not a bigint, so arithmetic downstream works", () => {
    expect(typeof requireNum(BigInt(COUNT))).toBe("number");
  });

  it("should refuse a missing column instead of inventing a zero", () => {
    expect(() => requireNum(undefined)).toThrow(
      "expected a number from the database, found undefined"
    );
  });

  it("should refuse a NULL column and say it was null, without claiming a constraint", () => {
    expect(() => requireNum(null)).toThrow("expected a number from the database, found null");
  });

  it("should refuse a numeric string rather than parsing it", () => {
    expect(() => requireNum("42")).toThrow("expected a number from the database, found string");
  });
});

describe("nullableNum()", () => {
  it("should keep a number", () => {
    expect(nullableNum(COUNT)).toBe(COUNT);
  });

  it("should keep zero, which is a real value for a slot index", () => {
    expect(nullableNum(ZERO)).toBe(ZERO);
  });

  it("should narrow a bigint", () => {
    expect(nullableNum(BigInt(COUNT))).toBe(COUNT);
  });

  it("should report a NULL column as null, not as zero", () => {
    expect(nullableNum(null)).toBeNull();
  });

  it("should report a missing column as null, not as zero", () => {
    expect(nullableNum(undefined)).toBeNull();
  });

  it("should refuse a present value of the wrong type", () => {
    expect(() => nullableNum("42")).toThrow("expected a number from the database, found string");
  });
});

describe("requireText()", () => {
  it("should pass a string straight through", () => {
    expect(requireText("Oleg")).toBe("Oleg");
  });

  it("should keep an empty string", () => {
    expect(requireText("")).toBe("");
  });

  it("should refuse a missing column instead of inventing an empty string", () => {
    expect(() => requireText(undefined)).toThrow(
      "expected text from the database, found undefined"
    );
  });

  it("should refuse a NULL column and say it was null", () => {
    expect(() => requireText(null)).toThrow("expected text from the database, found null");
  });

  it("should refuse a number rather than stringifying it", () => {
    expect(() => requireText(COUNT)).toThrow("expected text from the database, found number");
  });
});

describe("nullableText()", () => {
  it("should pass a string straight through", () => {
    expect(nullableText("2026-07-24 20:00:00")).toBe("2026-07-24 20:00:00");
  });

  it("should keep an empty string, which is not the same as NULL", () => {
    expect(nullableText("")).toBe("");
  });

  it("should report a NULL column as null", () => {
    expect(nullableText(null)).toBeNull();
  });

  it("should report a missing column as null", () => {
    expect(nullableText(undefined)).toBeNull();
  });

  it("should refuse a number rather than stringifying it", () => {
    expect(() => nullableText(COUNT)).toThrow("expected text from the database, found number");
  });
});
