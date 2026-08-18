import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { Rare } from "#scoresheet/domain/career/facts/rarest-of.ts";


const rarestOfSpy = vi.fn();

const notableSpy = vi.fn();

vi.mock("#scoresheet/domain/career/facts/rarest-of.ts", () => ({
  rarestOf: (field: unknown) => rarestOfSpy(field),
}));

vi.mock("#scoresheet/domain/career/facts/noise-floor.ts", () => ({
  notable: (tail: number, candidates: number) => notableSpy(tail, candidates),
}));

const { notablePick } = await import("#scoresheet/domain/career/facts/notable-pick.ts");

const ONCE = 1;

const SOME_GAMES = 6;

const MORE_GAMES = 11;

const A_TAIL = 0.004;

const ANOTHER_TAIL = 0.3;

const A_FACT = { games: SOME_GAMES } as unknown as CareerFact;

const ANOTHER_FACT = { games: MORE_GAMES } as unknown as CareerFact;

const THE_RAREST: Rare<CareerFact> = { fact: A_FACT, tail: A_TAIL };

const A_COMMONER_ONE: Rare<CareerFact> = { fact: ANOTHER_FACT, tail: ANOTHER_TAIL };

const A_FIELD = [A_COMMONER_ONE, THE_RAREST];

describe("notablePick()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rarestOfSpy.mockReturnValue(THE_RAREST);
    notableSpy.mockReturnValue(true);
  });

  it("should hand the whole field to the ranking it picks the rarest with", () => {
    notablePick(A_FIELD);

    expect(rarestOfSpy).toHaveBeenCalledWith(A_FIELD);
    expect(rarestOfSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should report no fact when the ranking found nothing to rank", () => {
    rarestOfSpy.mockReturnValue(null);

    expect(notablePick([])).toBeNull();
    expect(rarestOfSpy).toHaveBeenCalledTimes(ONCE);
    expect(notableSpy).not.toHaveBeenCalled();
  });

  it("should judge the rarest tail against how many candidates it was picked from", () => {
    notablePick(A_FIELD);

    expect(notableSpy).toHaveBeenCalledWith(A_TAIL, A_FIELD.length);
    expect(notableSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should report the rarest fact once it clears the noise floor", () => {
    expect(notablePick(A_FIELD)).toBe(A_FACT);
  });

  it("should report no fact when the rarest one does not clear the noise floor", () => {
    notableSpy.mockReturnValue(false);

    expect(notablePick(A_FIELD)).toBeNull();
    expect(notableSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should report the fact the ranking chose rather than the first of the field", () => {
    rarestOfSpy.mockReturnValue(A_COMMONER_ONE);

    expect(notablePick(A_FIELD)).toBe(ANOTHER_FACT);
    expect(notableSpy).toHaveBeenCalledWith(ANOTHER_TAIL, A_FIELD.length);
  });
});
