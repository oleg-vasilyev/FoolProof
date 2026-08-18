import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerHistory } from "#shared/repository/repository-contract.ts";
import type { Career, CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";
import type { CleanStreak } from "#scoresheet/domain/career/clean-streak.ts";
import type { Rival } from "#scoresheet/domain/career/career-rival.ts";


const careerOfSpy = vi.fn();

const careerTallySpy = vi.fn();

const eveningSharesSpy = vi.fn();

const bestEveningSpy = vi.fn();

const worstEveningSpy = vi.fn();

const longestCleanStreakSpy = vi.fn();

const chiefRivalSpy = vi.fn();

vi.mock("#scoresheet/domain/career/career-appearances.ts", () => ({
  careerOf: (history: unknown, playerId: number) => careerOfSpy(history, playerId),
}));

vi.mock("#scoresheet/domain/career/career-tally.ts", () => ({
  careerTally: (appearances: unknown) => careerTallySpy(appearances),
}));

vi.mock("#scoresheet/domain/career/career-evenings.ts", () => ({
  eveningShares: (appearances: unknown) => eveningSharesSpy(appearances),
  bestEvening: (nights: unknown) => bestEveningSpy(nights),
  worstEvening: (nights: unknown) => worstEveningSpy(nights),
}));

vi.mock("#scoresheet/domain/career/clean-streak.ts", () => ({
  longestCleanStreak: (appearances: unknown) => longestCleanStreakSpy(appearances),
}));

vi.mock("#scoresheet/domain/career/career-rival.ts", () => ({
  chiefRival: (history: unknown, playerId: number) => chiefRivalSpy(history, playerId),
}));

const { careerCard } = await import("#scoresheet/domain/career/career-card.ts");

const ONCE = 1;

const A_ROUND = 0;

const A_PLACE = 2;

const A_TABLE = 5;

const A_NIGHT = 7;

const ANOTHER_NIGHT = 8;

const SOME_GAMES = 6;

const NO_FOOLS = 0;

const A_SHARE = 0.8;

const OLEGS_SHARE = 0.61;

const OLEG = 1;

const ANYA = 2;

const OLEGS_NAME = "Oleg";

const ANYAS_NAME = "Anya";

const OPENING_DAY = "2026-05-01";

const NEXT_DAY = "2026-05-08";

const ONE_BURN = 1;

const SOME_DUELS = 9;

const HISTORY: CareerHistory = { players: [], games: [] };

const playedOn = (day: string): CareerAppearance => ({
  round: A_ROUND,
  finish: Finish.Middle,
  position: A_PLACE,
  tableSize: A_TABLE,
  seriesNo: A_NIGHT,
  playedOn: day,
  opened: false,
});

const APPEARANCES = [playedOn(OPENING_DAY), playedOn(NEXT_DAY)];

const CAREER: Career = {
  playerId: OLEG,
  displayName: OLEGS_NAME,
  share: OLEGS_SHARE,
  appearances: APPEARANCES,
};

const nightOf = (seriesNo: number): EveningShare => ({
  seriesNo,
  playedOn: OPENING_DAY,
  games: SOME_GAMES,
  fools: NO_FOOLS,
  share: A_SHARE,
});

const THE_BEST_NIGHT = nightOf(A_NIGHT);

const ANOTHER_GOOD_NIGHT = nightOf(ANOTHER_NIGHT);

const NIGHTS = [THE_BEST_NIGHT, ANOTHER_GOOD_NIGHT];

const A_TALLY = { games: SOME_GAMES } as unknown as CareerTally;

const A_STREAK: CleanStreak = { games: SOME_GAMES, from: OPENING_DAY, until: NEXT_DAY };

const A_RIVAL: Rival = {
  playerId: ANYA,
  displayName: ANYAS_NAME,
  duels: SOME_DUELS,
  lost: ONE_BURN,
};

describe("careerCard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    careerOfSpy.mockReturnValue(CAREER);
    careerTallySpy.mockReturnValue(A_TALLY);
    eveningSharesSpy.mockReturnValue(NIGHTS);
    bestEveningSpy.mockReturnValue(THE_BEST_NIGHT);
    worstEveningSpy.mockReturnValue(ANOTHER_GOOD_NIGHT);
    longestCleanStreakSpy.mockReturnValue(A_STREAK);
    chiefRivalSpy.mockReturnValue(A_RIVAL);
  });

  it("should read the career out of the history it was handed", () => {
    careerCard(HISTORY, OLEG);

    expect(careerOfSpy).toHaveBeenCalledWith(HISTORY, OLEG);
    expect(careerOfSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should report no card for a player with no career", () => {
    careerOfSpy.mockReturnValue(null);

    expect(careerCard(HISTORY, OLEG)).toBeNull();
    expect(careerOfSpy).toHaveBeenCalledTimes(ONCE);
    expect(eveningSharesSpy).not.toHaveBeenCalled();
  });

  it("should report no card for a career that holds no game", () => {
    careerOfSpy.mockReturnValue({ ...CAREER, appearances: [] });

    expect(careerCard(HISTORY, OLEG)).toBeNull();
  });

  it("should report the player asked for", () => {
    expect(careerCard(HISTORY, OLEG)?.playerId).toBe(OLEG);
  });

  it("should carry the name the career gave", () => {
    expect(careerCard(HISTORY, OLEG)?.displayName).toBe(OLEGS_NAME);
  });

  it("should date the career from the first game played", () => {
    expect(careerCard(HISTORY, OLEG)?.since).toBe(OPENING_DAY);
  });

  it("should carry the share the career gave", () => {
    expect(careerCard(HISTORY, OLEG)?.share).toBe(OLEGS_SHARE);
  });

  it("should tally the games the career held", () => {
    expect(careerCard(HISTORY, OLEG)?.tally).toBe(A_TALLY);
    expect(careerTallySpy).toHaveBeenCalledWith(APPEARANCES);
  });

  it("should group those same games into evenings", () => {
    expect(careerCard(HISTORY, OLEG)?.nights).toBe(NIGHTS);
    expect(eveningSharesSpy).toHaveBeenCalledWith(APPEARANCES);
  });

  it("should judge the best evening against the evenings it grouped", () => {
    expect(careerCard(HISTORY, OLEG)?.best).toBe(THE_BEST_NIGHT);
    expect(bestEveningSpy).toHaveBeenCalledWith(NIGHTS);
  });

  it("should judge the worst evening against those same evenings", () => {
    expect(careerCard(HISTORY, OLEG)?.worst).toBe(ANOTHER_GOOD_NIGHT);
    expect(worstEveningSpy).toHaveBeenCalledWith(NIGHTS);
  });

  it("should not print the same evening as both the best and the worst", () => {
    worstEveningSpy.mockReturnValue(THE_BEST_NIGHT);

    expect(careerCard(HISTORY, OLEG)?.worst).toBeNull();
    expect(worstEveningSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should keep the worst evening when no evening was good enough to be the best", () => {
    bestEveningSpy.mockReturnValue(null);

    expect(careerCard(HISTORY, OLEG)?.worst).toBe(ANOTHER_GOOD_NIGHT);
  });

  it("should report no worst evening when none was long enough to judge", () => {
    worstEveningSpy.mockReturnValue(null);

    expect(careerCard(HISTORY, OLEG)?.worst).toBeNull();
  });

  it("should carry the longest clean streak of those same games", () => {
    expect(careerCard(HISTORY, OLEG)?.streak).toBe(A_STREAK);
    expect(longestCleanStreakSpy).toHaveBeenCalledWith(APPEARANCES);
  });

  it("should name the chief rival out of the whole history", () => {
    expect(careerCard(HISTORY, OLEG)?.rival).toBe(A_RIVAL);
    expect(chiefRivalSpy).toHaveBeenCalledWith(HISTORY, OLEG);
  });
});
