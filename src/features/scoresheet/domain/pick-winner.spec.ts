import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayerEvening } from "#scoresheet/domain/evening.ts";


const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/evening.ts", () => ({
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const { bestBy, soleBy } = await import("#scoresheet/domain/pick-winner.ts");

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const FEW = 3;

const MANY = 9;

const LOW_ID = 1;

const HIGH_ID = 7;

const playerOf = (playerId: number, share = NOTHING): PlayerEvening => ({
  playerId,
  share,
  appearances: [],
});

const LOW = playerOf(LOW_ID);

const HIGH = playerOf(HIGH_ID);

describe("bestBy()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    playedGamesSpy.mockReturnValue(FEW);
  });

  it("should report nobody when the table is empty", () => {
    expect(bestBy([], () => ONCE)).toBeNull();
  });

  it("should report nobody when no player earned a merit", () => {
    expect(bestBy([LOW, HIGH], () => null)).toBeNull();
  });

  it("should pick the highest merit", () => {
    const winner = bestBy([LOW, HIGH], (player) => (player === HIGH ? TWICE : ONCE));

    expect(winner).toBe(HIGH);
  });

  it("should pick the highest merit even when it came first", () => {
    const winner = bestBy([HIGH, LOW], (player) => (player === HIGH ? TWICE : ONCE));

    expect(winner).toBe(HIGH);
  });

  it("should ignore a player whose merit is absent, however strong the rest are", () => {
    const winner = bestBy([HIGH, LOW], (player) => (player === HIGH ? null : ONCE));

    expect(winner).toBe(LOW);
  });

  it("should break a tie on merit by who played more games", () => {
    playedGamesSpy.mockReturnValueOnce(MANY).mockReturnValueOnce(FEW);

    expect(bestBy([LOW, HIGH], () => ONCE)).toBe(HIGH);
  });

  it("should ask for each side's game count exactly once when breaking a tie", () => {
    bestBy([LOW, HIGH], () => ONCE);

    expect(playedGamesSpy).toHaveBeenCalledTimes(TWICE);
  });

  it("should break a tie on games by the lower player id", () => {
    expect(bestBy([HIGH, LOW], () => ONCE)).toBe(LOW);
  });

  it("should hand each player to the merit it is ranking them by", () => {
    const merit = vi.fn().mockReturnValue(ONCE);

    bestBy([LOW, HIGH], merit);

    expect(merit).toHaveBeenCalledWith(LOW);
    expect(merit).toHaveBeenCalledWith(HIGH);
  });
});

describe("soleBy()", () => {
  it("should report the one player who qualifies", () => {
    expect(soleBy([LOW, HIGH], (player) => player === HIGH)).toBe(HIGH);
  });

  it("should report nobody when two players qualify", () => {
    expect(soleBy([LOW, HIGH], () => true)).toBeNull();
  });

  it("should report nobody when none qualifies", () => {
    expect(soleBy([LOW, HIGH], () => false)).toBeNull();
  });
});
