import { describe, expect, it } from "vitest";
import { rarestOf, type Rare } from "#scoresheet/domain/career/facts/rarest-of.ts";


const COMMON = 0.5;

const UNCOMMON = 0.1;

const RARE = 0.001;

const RAREST = 0.0001;

const CERTAIN = 1;

const IMPOSSIBLE = 0;

const noted = (fact: string, tail: number): Rare<string> => ({ fact, tail });

const A_COMMON_ONE = noted("a common one", COMMON);

const AN_UNCOMMON_ONE = noted("an uncommon one", UNCOMMON);

const A_RARE_ONE = noted("a rare one", RARE);

const THE_RAREST_ONE = noted("the rarest one", RAREST);

describe("rarestOf()", () => {
  it("should report nothing when nothing was noted", () => {
    expect(rarestOf([])).toBeNull();
  });

  it("should report the only thing noted", () => {
    expect(rarestOf([A_COMMON_ONE])).toBe(A_COMMON_ONE);
  });

  it("should report the entry itself, tail and all, rather than the fact alone", () => {
    expect(rarestOf([A_COMMON_ONE, THE_RAREST_ONE])?.tail).toBe(RAREST);
  });

  it("should report the smallest tail when it came last", () => {
    expect(rarestOf([A_COMMON_ONE, AN_UNCOMMON_ONE, THE_RAREST_ONE])).toBe(THE_RAREST_ONE);
  });

  it("should report the smallest tail when it came first", () => {
    expect(rarestOf([THE_RAREST_ONE, AN_UNCOMMON_ONE, A_COMMON_ONE])).toBe(THE_RAREST_ONE);
  });

  it("should report the smallest tail when it sat in the middle", () => {
    expect(rarestOf([A_COMMON_ONE, THE_RAREST_ONE, A_RARE_ONE])).toBe(THE_RAREST_ONE);
  });

  it("should keep the one it already held when two tails tie", () => {
    const twin = noted("a twin of the rare one", RARE);

    expect(rarestOf([A_RARE_ONE, twin])).toBe(A_RARE_ONE);
  });

  it("should report a tail of nothing at all as the rarest", () => {
    const nothingAtAll = noted("never seen", IMPOSSIBLE);

    expect(rarestOf([THE_RAREST_ONE, nothingAtAll])).toBe(nothingAtAll);
  });

  it("should still report a field where every tail is a certainty", () => {
    const oneCertainty = noted("bound to happen", CERTAIN);
    const another = noted("also bound to happen", CERTAIN);

    expect(rarestOf([oneCertainty, another])).toBe(oneCertainty);
  });
});
