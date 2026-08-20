import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";


const shareAtSpy = vi.fn();

vi.mock("#scoresheet/domain/scoring.ts", () => ({
  shareAt: (position: number, tableSize: number) => shareAtSpy(position, tableSize),
}));

const {
  ENOUGH_NIGHTS_TO_CHART,
  ENOUGH_TO_JUDGE_A_NIGHT,
  bestEvening,
  eveningShares,
  eveningsShortOfChart,
  worstEvening,
} = await import("#scoresheet/domain/career/career-evenings.ts");

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const ONE_GAME = 1;

const A_ROUND = 0;

const A_PLACE = 2;

const ANOTHER_PLACE = 4;

const A_TABLE = 5;

const ANOTHER_TABLE = 6;

const FIRST_NIGHT = 7;

const SECOND_NIGHT = 8;

const EARLY_NIGHT = 2;

const LATE_NIGHT = 9;

const A_DAY = "2026-05-01";

const NEXT_DAY = "2026-05-08";

const A_SHARE = 0.8;

const HALF_A_SHARE = 0.5;

const A_QUARTER_SHARE = 0.25;

const MEAN_OF_THE_TWO = 0.375;

const BRILLIANT = 0.9;

const MIDDLING = 0.5;

const A_GOOD_NIGHT = 0.75;

const DISMAL = 0.1;

const NO_FOOLS = 0;

const NO_FIRSTS = 0;

const playedAs = (
  seriesNo: number,
  finish: Finish,
  playedOn: string = A_DAY,
  position: number = A_PLACE,
  tableSize: number = A_TABLE
): CareerAppearance => ({
  round: A_ROUND,
  finish,
  position,
  tableSize,
  seriesNo,
  playedOn,
  opened: false,
});

const nightOf = (
  seriesNo: number,
  games: number,
  share: number,
  playedOn: string = A_DAY
): EveningShare => ({
  seriesNo,
  playedOn,
  games,
  decided: games,
  fools: NO_FOOLS,
  firsts: NO_FIRSTS,
  share,
});

const ENOUGH_GAMES = ENOUGH_TO_JUDGE_A_NIGHT;

const ONE_GAME_SHORT = ENOUGH_TO_JUDGE_A_NIGHT - ONE_GAME;

const ONE_GAME_MORE = ENOUGH_TO_JUDGE_A_NIGHT + ONE_GAME;

describe("eveningShares()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    shareAtSpy.mockReturnValue(A_SHARE);
  });

  it("should report no evenings for a career with no games", () => {
    expect(eveningShares([])).toEqual([]);
  });

  it("should gather the games of one evening into a single night", () => {
    const career = [
      playedAs(FIRST_NIGHT, Finish.First),
      playedAs(FIRST_NIGHT, Finish.Middle),
      playedAs(SECOND_NIGHT, Finish.Middle),
    ];

    expect(eveningShares(career).map((night) => night.games)).toEqual([TWICE, ONCE]);
  });

  it("should keep the evenings in the order they were played", () => {
    const career = [
      playedAs(SECOND_NIGHT, Finish.First),
      playedAs(FIRST_NIGHT, Finish.Middle),
    ];

    expect(eveningShares(career).map((night) => night.seriesNo)).toEqual([
      SECOND_NIGHT,
      FIRST_NIGHT,
    ]);
  });

  it("should open a new night when an evening comes back after another one", () => {
    const career = [
      playedAs(FIRST_NIGHT, Finish.First),
      playedAs(SECOND_NIGHT, Finish.Middle),
      playedAs(FIRST_NIGHT, Finish.Middle),
    ];

    expect(eveningShares(career).map((night) => night.seriesNo)).toEqual([
      FIRST_NIGHT,
      SECOND_NIGHT,
      FIRST_NIGHT,
    ]);
  });

  it("should date a night by the game it opened with", () => {
    const career = [
      playedAs(FIRST_NIGHT, Finish.First, A_DAY),
      playedAs(FIRST_NIGHT, Finish.Middle, NEXT_DAY),
    ];

    expect(eveningShares(career)[NOTHING]?.playedOn).toBe(A_DAY);
  });

  it("should count the fools of that night and of no other", () => {
    const career = [
      playedAs(FIRST_NIGHT, Finish.Fool),
      playedAs(FIRST_NIGHT, Finish.Drawn),
      playedAs(SECOND_NIGHT, Finish.Fool),
    ];

    expect(eveningShares(career).map((night) => night.fools)).toEqual([ONCE, ONCE]);
  });

  it("should count a game of that night as decided unless it was drawn", () => {
    const career = [
      playedAs(FIRST_NIGHT, Finish.Drawn),
      playedAs(FIRST_NIGHT, Finish.Fool),
      playedAs(FIRST_NIGHT, Finish.First),
      playedAs(SECOND_NIGHT, Finish.Drawn),
    ];

    expect(eveningShares(career).map((night) => night.decided)).toEqual([TWICE, NOTHING]);
  });

  it("should count the games gone out first of that night and of no other", () => {
    const career = [
      playedAs(FIRST_NIGHT, Finish.First),
      playedAs(FIRST_NIGHT, Finish.First),
      playedAs(FIRST_NIGHT, Finish.Middle),
      playedAs(FIRST_NIGHT, Finish.Drawn),
      playedAs(FIRST_NIGHT, Finish.Fool),
      playedAs(SECOND_NIGHT, Finish.Middle),
    ];

    expect(eveningShares(career).map((night) => night.firsts)).toEqual([TWICE, NOTHING]);
  });

  it("should average the shares the scoring gave across the night", () => {
    shareAtSpy.mockReturnValueOnce(HALF_A_SHARE).mockReturnValueOnce(A_QUARTER_SHARE);
    const career = [
      playedAs(FIRST_NIGHT, Finish.First),
      playedAs(FIRST_NIGHT, Finish.Middle),
    ];

    expect(eveningShares(career)[NOTHING]?.share).toBe(MEAN_OF_THE_TWO);
  });

  it("should ask the scoring for the seat taken at the table that was sat", () => {
    const career = [
      playedAs(FIRST_NIGHT, Finish.First, A_DAY, A_PLACE, A_TABLE),
      playedAs(FIRST_NIGHT, Finish.Middle, A_DAY, ANOTHER_PLACE, ANOTHER_TABLE),
    ];

    eveningShares(career);

    expect(shareAtSpy).toHaveBeenNthCalledWith(ONCE, A_PLACE, A_TABLE);
    expect(shareAtSpy).toHaveBeenNthCalledWith(TWICE, ANOTHER_PLACE, ANOTHER_TABLE);
    expect(shareAtSpy).toHaveBeenCalledTimes(TWICE);
  });
});

describe("bestEvening()", () => {
  it("should name no evening when none were played", () => {
    expect(bestEvening([])).toBeNull();
  });

  it("should not judge an evening one game short of enough", () => {
    expect(bestEvening([nightOf(FIRST_NIGHT, ONE_GAME_SHORT, BRILLIANT)])).toBeNull();
  });

  it("should judge an evening of exactly enough games", () => {
    expect(bestEvening([nightOf(FIRST_NIGHT, ENOUGH_GAMES, BRILLIANT)])?.seriesNo).toBe(
      FIRST_NIGHT
    );
  });

  it("should name the evening with the highest share", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, MIDDLING),
      nightOf(SECOND_NIGHT, ENOUGH_GAMES, BRILLIANT),
    ];

    expect(bestEvening(nights)?.seriesNo).toBe(SECOND_NIGHT);
  });

  it("should pass over a short evening however well it went", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ONE_GAME_SHORT, BRILLIANT),
      nightOf(SECOND_NIGHT, ENOUGH_GAMES, DISMAL),
    ];

    expect(bestEvening(nights)?.seriesNo).toBe(SECOND_NIGHT);
  });

  it("should name no best evening when two evenings went equally well", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, MIDDLING),
      nightOf(SECOND_NIGHT, ONE_GAME_MORE, MIDDLING),
    ];

    expect(bestEvening(nights)).toBeNull();
  });

  it("should not let a longer evening break a tie on share", () => {
    const nights = [
      nightOf(LATE_NIGHT, ENOUGH_GAMES, MIDDLING),
      nightOf(EARLY_NIGHT, ENOUGH_GAMES, MIDDLING),
    ];

    expect(bestEvening(nights)).toBeNull();
  });

  it("should still name the best when only one evening holds the highest share", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, MIDDLING),
      nightOf(SECOND_NIGHT, ENOUGH_GAMES, A_GOOD_NIGHT),
    ];

    expect(bestEvening(nights)?.seriesNo).toBe(SECOND_NIGHT);
  });

  it("should ignore a tie held by evenings too short to judge", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, MIDDLING),
      nightOf(SECOND_NIGHT, ONE_GAME_SHORT, MIDDLING),
    ];

    expect(bestEvening(nights)?.seriesNo).toBe(FIRST_NIGHT);
  });

  it("should name nothing when two nights of one evening hold the same share", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, MIDDLING, A_DAY),
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, MIDDLING, NEXT_DAY),
    ];

    expect(bestEvening(nights)).toBeNull();
  });

  it("should not let a longer evening beat a better one", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, BRILLIANT),
      nightOf(SECOND_NIGHT, ONE_GAME_MORE, DISMAL),
    ];

    expect(bestEvening(nights)?.seriesNo).toBe(FIRST_NIGHT);
  });

  it("should not let an earlier evening beat a better one", () => {
    const nights = [
      nightOf(LATE_NIGHT, ENOUGH_GAMES, BRILLIANT),
      nightOf(EARLY_NIGHT, ENOUGH_GAMES, DISMAL),
    ];

    expect(bestEvening(nights)?.seriesNo).toBe(LATE_NIGHT);
  });

  it("should let no length or order break a tie on share", () => {
    const nights = [
      nightOf(LATE_NIGHT, ONE_GAME_MORE, MIDDLING),
      nightOf(EARLY_NIGHT, ENOUGH_GAMES, MIDDLING),
    ];

    expect(bestEvening(nights)).toBeNull();
  });
});

describe("worstEvening()", () => {
  it("should name no evening when none were played", () => {
    expect(worstEvening([])).toBeNull();
  });

  it("should not judge an evening one game short of enough", () => {
    expect(worstEvening([nightOf(FIRST_NIGHT, ONE_GAME_SHORT, DISMAL)])).toBeNull();
  });

  it("should name the evening with the lowest share", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, MIDDLING),
      nightOf(SECOND_NIGHT, ENOUGH_GAMES, DISMAL),
    ];

    expect(worstEvening(nights)?.seriesNo).toBe(SECOND_NIGHT);
  });

  it("should pass over a short evening however badly it went", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ONE_GAME_SHORT, DISMAL),
      nightOf(SECOND_NIGHT, ENOUGH_GAMES, BRILLIANT),
    ];

    expect(worstEvening(nights)?.seriesNo).toBe(SECOND_NIGHT);
  });

  it("should still name the worst when only one evening holds the lowest share", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, MIDDLING),
      nightOf(SECOND_NIGHT, ENOUGH_GAMES, A_GOOD_NIGHT),
    ];

    expect(worstEvening(nights)?.seriesNo).toBe(FIRST_NIGHT);
  });

  it("should name no worst evening when two evenings went equally badly", () => {
    const nights = [
      nightOf(LATE_NIGHT, ENOUGH_GAMES, MIDDLING),
      nightOf(EARLY_NIGHT, ENOUGH_GAMES, MIDDLING),
    ];

    expect(worstEvening(nights)).toBeNull();
  });

  it("should not let a longer evening beat a worse one", () => {
    const nights = [
      nightOf(FIRST_NIGHT, ENOUGH_GAMES, DISMAL),
      nightOf(SECOND_NIGHT, ONE_GAME_MORE, BRILLIANT),
    ];

    expect(worstEvening(nights)?.seriesNo).toBe(FIRST_NIGHT);
  });

  it("should not let an earlier evening beat a worse one", () => {
    const nights = [
      nightOf(LATE_NIGHT, ENOUGH_GAMES, DISMAL),
      nightOf(EARLY_NIGHT, ENOUGH_GAMES, BRILLIANT),
    ];

    expect(worstEvening(nights)?.seriesNo).toBe(LATE_NIGHT);
  });
});

describe("eveningsShortOfChart()", () => {
  it("should ask for the whole threshold from a career with no nights", () => {
    expect(eveningsShortOfChart(NOTHING)).toBe(ENOUGH_NIGHTS_TO_CHART);
  });

  it("should ask for one more evening on the career one evening short", () => {
    expect(eveningsShortOfChart(ENOUGH_NIGHTS_TO_CHART - ONCE)).toBe(ONCE);
  });

  it("should ask for nothing on exactly the evening that earns the chart", () => {
    expect(eveningsShortOfChart(ENOUGH_NIGHTS_TO_CHART)).toBe(NOTHING);
  });

  it("should ask for nothing rather than a negative on a long career", () => {
    expect(eveningsShortOfChart(ENOUGH_NIGHTS_TO_CHART + LATE_NIGHT)).toBe(NOTHING);
  });

  it("should count down one for one as the evenings pile up", () => {
    const early = eveningsShortOfChart(ONCE);
    const later = eveningsShortOfChart(ONCE + ONCE);

    expect(early - later).toBe(ONCE);
  });
});
