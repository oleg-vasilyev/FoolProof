import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";


const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const { bestBy, soleBy, standoutBy } = await import("#scoresheet/domain/awards/pick-winner.ts");

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const FEW = 3;

const MANY = 9;

const LOW_ID = 1;

const MIDDLE_ID = 4;

const HIGH_ID = 7;

const playerOf = (playerId: number, share = NOTHING): PlayerAppearances => ({
  playerId,
  share,
  running: [],
  appearances: [],
});

const LOW = playerOf(LOW_ID);

const MIDDLE = playerOf(MIDDLE_ID);

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

  it("should let the higher merit win over somebody who played more games", () => {
    playedGamesSpy.mockReturnValueOnce(MANY).mockReturnValueOnce(FEW);

    expect(bestBy([HIGH, LOW], (player) => (player === HIGH ? TWICE : ONCE))).toBe(HIGH);
  });

  it("should break a tie on merit by who played more games", () => {
    playedGamesSpy.mockReturnValueOnce(MANY).mockReturnValueOnce(FEW);

    expect(bestBy([LOW, HIGH], () => ONCE)).toBe(HIGH);
  });

  it("should ask for each side's game count exactly once when breaking a tie", () => {
    bestBy([LOW, HIGH], () => ONCE);

    expect(playedGamesSpy).toHaveBeenCalledTimes(TWICE);
  });

  it("should let more games win even when the other id sorts first", () => {
    playedGamesSpy.mockReturnValueOnce(FEW).mockReturnValueOnce(MANY);

    expect(bestBy([LOW, HIGH], () => ONCE)).toBe(LOW);
  });

  it("should let more games win even when the challenger's id sorts first", () => {
    playedGamesSpy.mockReturnValueOnce(FEW).mockReturnValueOnce(MANY);

    expect(bestBy([HIGH, LOW], () => ONCE)).toBe(HIGH);
  });

  it("should break a tie on games by the lower player id", () => {
    expect(bestBy([HIGH, LOW], () => ONCE)).toBe(LOW);
  });

  it("should leave the lower player id holding when it came first", () => {
    expect(bestBy([LOW, HIGH], () => ONCE)).toBe(LOW);
  });

  it("should hand each player to the merit it is ranking them by", () => {
    const merit = vi.fn().mockReturnValue(ONCE);

    bestBy([LOW, HIGH], merit);

    expect(merit).toHaveBeenCalledWith(LOW);
    expect(merit).toHaveBeenCalledWith(HIGH);
  });
});

describe("standoutBy()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    playedGamesSpy.mockReturnValue(FEW);
  });

  it("should report nobody when the table is empty", () => {
    expect(standoutBy([], () => ONCE)).toBeNull();
  });

  it("should report nobody when no player earned a merit", () => {
    expect(standoutBy([LOW, HIGH], () => null)).toBeNull();
  });

  it("should report nobody when every qualified player earned the same merit", () => {
    expect(standoutBy([LOW, HIGH], () => ONCE)).toBeNull();
  });

  it("should report nobody when a whole table of three finished level", () => {
    expect(standoutBy([LOW, MIDDLE, HIGH], () => ONCE)).toBeNull();
  });

  it("should crown the only player who qualified, since one alone is not a tie", () => {
    const winner = standoutBy([LOW, HIGH], (player) => (player === HIGH ? null : ONCE));

    expect(winner).toBe(LOW);
  });

  it("should crown the one player who rose above an otherwise level field", () => {
    const winner = standoutBy([LOW, MIDDLE, HIGH], (player) => (player === HIGH ? TWICE : ONCE));

    expect(winner).toBe(HIGH);
  });

  it("should crown nobody when two share the top, however far the rest have fallen behind", () => {
    const winner = standoutBy([HIGH, LOW, MIDDLE], (player) =>
      player === MIDDLE ? ONCE : TWICE
    );

    expect(winner).toBeNull();
  });

  it("should not read the last bit of a float as standing out", () => {
    const A_HAIR_HIGHER = 0.5833333333333334;

    const LEVEL = 0.5833333333333333;

    const winner = standoutBy([HIGH, LOW], (player) =>
      player === HIGH ? A_HAIR_HIGHER : LEVEL
    );

    expect(winner).toBeNull();
  });

  it("should crown a leader whose gap sits exactly at the tie tolerance", () => {
    const AT_THE_TOLERANCE = 1e-9;

    const winner = standoutBy([HIGH, LOW], (player) => (player === HIGH ? AT_THE_TOLERANCE : 0));

    expect(winner).toBe(HIGH);
  });

  it("should still call it a tie when the gap sits just inside the tolerance", () => {
    const JUST_INSIDE_THE_TOLERANCE = 9e-10;

    const winner = standoutBy([HIGH, LOW], (player) =>
      player === HIGH ? JUST_INSIDE_THE_TOLERANCE : 0
    );

    expect(winner).toBeNull();
  });

  it("should still crown a leader who is clear of the field by a real margin", () => {
    const winner = standoutBy([HIGH, LOW, MIDDLE], (player) => (player === HIGH ? TWICE : ONCE));

    expect(winner).toBe(HIGH);
  });

  it("should hand each player to the merit it is ranking them by", () => {
    const merit = vi.fn().mockReturnValue(ONCE);

    standoutBy([LOW, HIGH], merit);

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
