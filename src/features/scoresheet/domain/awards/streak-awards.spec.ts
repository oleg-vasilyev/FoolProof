import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Appearance, SessionAppearances, PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";


const bestBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
}));

const foolCountSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  foolCount: (player: unknown) => foolCountSpy(player),
}));

const { encore, sweetRevenge, teflon } = await import("#scoresheet/domain/awards/streak-awards.ts");

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const FIVE = 5;

const SEVEN = 7;

const TEN = 10;

const DIMA = 2;

const appearing = (...finishes: readonly Appearance["finish"][]): PlayerAppearances => ({
  playerId: DIMA,
  share: NOTHING,
  appearances: finishes.map((finish, round) => ({ round, finish })),
});

const sessionAppearances = (player: PlayerAppearances): SessionAppearances => ({
  rounds: TEN,
  players: [player],
  starters: [],
});

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  foolCountSpy.mockReturnValue(NOTHING);
});

describe("teflon()", () => {
  const SEVEN_CLEAN = appearing(
    "fool",
    "first",
    "middle",
    "middle",
    "first",
    "middle",
    "middle",
    "first"
  );

  const BROKEN = appearing("first", "middle", "fool", "middle", "first", "fool", "middle");

  it("should award nothing when the ranking found nobody", () => {
    expect(teflon(sessionAppearances(SEVEN_CLEAN))).toBeNull();
  });

  it("should report the length of the clean run", () => {
    bestBySpy.mockReturnValue(SEVEN_CLEAN);
    const award = teflon(sessionAppearances(SEVEN_CLEAN));

    expect(award?.name === "teflon" ? award.streak : NOTHING).toBe(SEVEN);
  });

  it("should name the player who kept clean", () => {
    bestBySpy.mockReturnValue(SEVEN_CLEAN);

    expect(teflon(sessionAppearances(SEVEN_CLEAN))?.winners).toEqual([DIMA]);
  });

  describe("who is eligible", () => {
    it("should rank a player by their longest run without being the fool", () => {
      teflon(sessionAppearances(SEVEN_CLEAN));

      expect(meritGiven()(SEVEN_CLEAN)).toBe(SEVEN);
    });

    it("should count only the run, not the clean games either side of a fool", () => {
      teflon(sessionAppearances(BROKEN));

      expect(meritGiven()(BROKEN)).toBeNull();
    });

    it("should refuse a run one game short of five", () => {
      const FOUR_CLEAN = appearing("first", "middle", "first", "middle", "fool");
      teflon(sessionAppearances(FOUR_CLEAN));

      expect(meritGiven()(FOUR_CLEAN)).toBeNull();
    });

    it("should accept a run of exactly five", () => {
      const FIVE_CLEAN = appearing("first", "middle", "first", "middle", "first");
      teflon(sessionAppearances(FIVE_CLEAN));

      expect(meritGiven()(FIVE_CLEAN)).toBe(FIVE);
    });
  });
});

describe("sweetRevenge()", () => {
  const AVENGER = appearing("fool", "first", "middle", "fool", "first");

  const SULKER = appearing("fool", "middle", "fool", "middle");

  it("should award nothing when the ranking found nobody", () => {
    expect(sweetRevenge(sessionAppearances(AVENGER))).toBeNull();
  });

  it("should report the fools behind the comebacks as well as the comebacks", () => {
    bestBySpy.mockReturnValue(AVENGER);
    foolCountSpy.mockReturnValue(TWICE);
    const award = sweetRevenge(sessionAppearances(AVENGER));

    expect(award?.name === "sweetRevenge" ? [award.fools, award.comebacks] : []).toEqual([
      TWICE,
      TWICE,
    ]);
  });

  it("should name the player who came back", () => {
    bestBySpy.mockReturnValue(AVENGER);

    expect(sweetRevenge(sessionAppearances(AVENGER))?.winners).toEqual([DIMA]);
  });

  it("should not count a middling game as a comeback", () => {
    sweetRevenge(sessionAppearances(SULKER));

    expect(meritGiven()(SULKER)).toBeNull();
    expect(meritGiven()(AVENGER)).toBe(TWICE);
  });

  describe("who is eligible", () => {
    it("should count only a fool followed by going out first next time", () => {
      sweetRevenge(sessionAppearances(AVENGER));

      expect(meritGiven()(AVENGER)).toBe(TWICE);
    });

    it("should refuse a player who never came back first", () => {
      sweetRevenge(sessionAppearances(SULKER));

      expect(meritGiven()(SULKER)).toBeNull();
    });

    it("should refuse a single comeback", () => {
      const ONE_COMEBACK = appearing("fool", "first", "middle");
      sweetRevenge(sessionAppearances(ONE_COMEBACK));

      expect(meritGiven()(ONE_COMEBACK)).toBeNull();
    });

    it("should not credit a fool in the last game, which has no next game", () => {
      const LATE_FOOL = appearing("fool", "first", "fool", "first", "fool");
      sweetRevenge(sessionAppearances(LATE_FOOL));

      expect(meritGiven()(LATE_FOOL)).toBe(TWICE);
    });
  });
});

describe("encore()", () => {
  const REPEATER = appearing("first", "fool", "fool", "middle");

  const SPACED_OUT = appearing("fool", "middle", "fool", "first");

  it("should award nothing when the ranking found nobody", () => {
    expect(encore(sessionAppearances(REPEATER))).toBeNull();
  });

  it("should report how long the run of fools was", () => {
    bestBySpy.mockReturnValue(REPEATER);
    const award = encore(sessionAppearances(REPEATER));

    expect(award?.name === "encore" ? award.run : NOTHING).toBe(TWICE);
  });

  it("should name the player who repeated", () => {
    bestBySpy.mockReturnValue(REPEATER);

    expect(encore(sessionAppearances(REPEATER))?.winners).toEqual([DIMA]);
  });

  describe("who is eligible", () => {
    it("should rank a player by their longest run of fools", () => {
      encore(sessionAppearances(REPEATER));

      expect(meritGiven()(REPEATER)).toBe(TWICE);
    });

    it("should refuse two fools with a game between them", () => {
      encore(sessionAppearances(SPACED_OUT));

      expect(meritGiven()(SPACED_OUT)).toBeNull();
    });
  });
});
