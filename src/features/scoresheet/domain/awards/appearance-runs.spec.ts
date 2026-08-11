import { describe, expect, it } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { longestChain, longestRun } from "#scoresheet/domain/awards/appearance-runs.ts";
import { appearanceOf, appearingAs, playerAppearing } from "#scoresheet/domain/session-appearances.stub.ts";


const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const THRICE = 3;

const DIMA = 2;

const NOBODY = playerAppearing(DIMA, []);

const isFool = (finish: Finish): boolean => finish === Finish.Fool;

describe("longestRun()", () => {
  it("should count nothing for a player who never sat down", () => {
    expect(longestRun(NOBODY, () => true)).toBe(NOTHING);
  });

  it("should count nothing when the run never holds", () => {
    const player = appearingAs(DIMA, Finish.First, Finish.Middle);

    expect(longestRun(player, (appearance) => isFool(appearance.finish))).toBe(NOTHING);
  });

  it("should measure the longest stretch, not the last one", () => {
    const player = appearingAs(
      DIMA,
      Finish.Fool,
      Finish.Fool,
      Finish.Fool,
      Finish.First,
      Finish.Fool
    );

    expect(longestRun(player, (appearance) => isFool(appearance.finish))).toBe(THRICE);
  });

  it("should break the run on the game that does not hold", () => {
    const player = appearingAs(DIMA, Finish.Fool, Finish.First, Finish.Fool);

    expect(longestRun(player, (appearance) => isFool(appearance.finish))).toBe(ONCE);
  });

  it("should count every game when the run never breaks", () => {
    const player = appearingAs(DIMA, Finish.Fool, Finish.Fool);

    expect(longestRun(player, (appearance) => isFool(appearance.finish))).toBe(TWICE);
  });
});

describe("longestChain()", () => {
  const climbing = playerAppearing(DIMA, [
    appearanceOf(NOTHING, Finish.Middle, THRICE + ONCE),
    appearanceOf(ONCE, Finish.Middle, THRICE),
    appearanceOf(TWICE, Finish.Middle, TWICE),
    appearanceOf(THRICE, Finish.Middle, THRICE),
  ]);

  it("should count nothing for a player who never sat down", () => {
    expect(longestChain(NOBODY, () => true)).toBe(NOTHING);
  });

  it("should count a single appearance as a chain of one", () => {
    const alone = playerAppearing(DIMA, [appearanceOf(NOTHING, Finish.First)]);

    expect(longestChain(alone, () => true)).toBe(ONCE);
  });

  it("should count the games in the chain, not the links between them", () => {
    expect(longestChain(climbing, (earlier, later) => later.position < earlier.position)).toBe(
      THRICE
    );
  });

  it("should restart the chain at the game that broke it", () => {
    const broken = playerAppearing(DIMA, [
      appearanceOf(NOTHING, Finish.Middle, THRICE),
      appearanceOf(ONCE, Finish.Middle, TWICE),
      appearanceOf(TWICE, Finish.Middle, THRICE),
      appearanceOf(THRICE, Finish.Middle, TWICE),
    ]);

    expect(longestChain(broken, (earlier, later) => later.position < earlier.position)).toBe(TWICE);
  });

  it("should compare each game against the one before it rather than against the first", () => {
    const seen: [number, number][] = [];

    longestChain(climbing, (earlier, later) => {
      seen.push([earlier.round, later.round]);

      return true;
    });

    expect(seen).toEqual([
      [NOTHING, ONCE],
      [ONCE, TWICE],
      [TWICE, THRICE],
    ]);
  });
});
