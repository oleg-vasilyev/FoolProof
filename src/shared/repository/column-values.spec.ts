import { describe, expect, it } from "vitest";
import {
  nullableNum,
  nullableText,
  num,
  numberOr,
  text,
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

describe("num()", () => {
  it("should pass a number straight through", () => {
    expect(num(COUNT)).toBe(COUNT);
  });

  it("should narrow a bigint", () => {
    expect(num(BigInt(COUNT))).toBe(COUNT);
  });

  it("should read a missing column as zero", () => {
    expect(num(undefined)).toBe(ZERO);
  });

  it("should read a null column as zero", () => {
    expect(num(null)).toBe(ZERO);
  });

  it("should read a string as zero rather than parsing it", () => {
    expect(num("42")).toBe(ZERO);
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

  it("should fall back to zero for a present value of the wrong type", () => {
    expect(nullableNum("42")).toBe(ZERO);
  });
});

describe("text()", () => {
  it("should pass a string straight through", () => {
    expect(text("Oleg")).toBe("Oleg");
  });

  it("should keep an empty string", () => {
    expect(text("")).toBe("");
  });

  it("should read a missing column as an empty string", () => {
    expect(text(undefined)).toBe("");
  });

  it("should read a NULL column as an empty string", () => {
    expect(text(null)).toBe("");
  });

  it("should read a number as an empty string rather than stringifying it", () => {
    expect(text(COUNT)).toBe("");
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

  it("should report a number as null rather than stringifying it", () => {
    expect(nullableText(COUNT)).toBeNull();
  });
});
