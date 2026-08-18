import { describe, expect, it } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import { ENOUGH_TO_BOAST, longestCleanStreak } from "#scoresheet/domain/career/clean-streak.ts";


const ONE_GAME = 1;

const A_ROUND = 0;

const A_PLACE = 2;

const A_TABLE = 5;

const A_NIGHT = 7;

const FIRST_GAME = 1;

const A_LATER_GAME = 20;

const A_LATER_STILL_GAME = 40;

const ENOUGH_GAMES = ENOUGH_TO_BOAST;

const ONE_GAME_SHORT = ENOUGH_TO_BOAST - ONE_GAME;

const ONE_GAME_MORE = ENOUGH_TO_BOAST + ONE_GAME;

const dayOf = (game: number): string => `2026-05-${String(game)}`;

const playedAs = (finish: Finish, game: number): CareerAppearance => ({
  round: A_ROUND,
  finish,
  position: A_PLACE,
  tableSize: A_TABLE,
  seriesNo: A_NIGHT,
  playedOn: dayOf(game),
  opened: false,
});

const cleanRun = (from: number, games: number): readonly CareerAppearance[] =>
  Array.from({ length: games }, (_unused, step) => playedAs(Finish.Middle, from + step));

describe("longestCleanStreak()", () => {
  it("should boast of nothing for a career with no games", () => {
    expect(longestCleanStreak([])).toBeNull();
  });

  it("should boast of nothing for a career of nothing but fools", () => {
    const career = [playedAs(Finish.Fool, FIRST_GAME), playedAs(Finish.Fool, A_LATER_GAME)];

    expect(longestCleanStreak(career)).toBeNull();
  });

  it("should boast of nothing about a run one game short of enough", () => {
    expect(longestCleanStreak(cleanRun(FIRST_GAME, ONE_GAME_SHORT))).toBeNull();
  });

  it("should boast of a run of exactly enough games", () => {
    expect(longestCleanStreak(cleanRun(FIRST_GAME, ENOUGH_GAMES))).toEqual({
      games: ENOUGH_GAMES,
      from: dayOf(FIRST_GAME),
      until: dayOf(FIRST_GAME + ONE_GAME_SHORT),
    });
  });

  it("should let a shared last place carry the run on", () => {
    const career = [
      ...cleanRun(FIRST_GAME, ONE_GAME_SHORT),
      playedAs(Finish.Drawn, A_LATER_GAME),
    ];

    expect(longestCleanStreak(career)?.games).toBe(ENOUGH_GAMES);
  });

  it("should break the run on the game the player was left the fool", () => {
    const career = [
      ...cleanRun(FIRST_GAME, ENOUGH_GAMES),
      playedAs(Finish.Fool, A_LATER_GAME),
      ...cleanRun(A_LATER_STILL_GAME, ONE_GAME_MORE),
    ];

    expect(longestCleanStreak(career)).toEqual({
      games: ONE_GAME_MORE,
      from: dayOf(A_LATER_STILL_GAME),
      until: dayOf(A_LATER_STILL_GAME + ENOUGH_GAMES),
    });
  });

  it("should count a run that starts after a fool", () => {
    const career = [
      playedAs(Finish.Fool, FIRST_GAME),
      ...cleanRun(A_LATER_GAME, ENOUGH_GAMES),
    ];

    expect(longestCleanStreak(career)).toEqual({
      games: ENOUGH_GAMES,
      from: dayOf(A_LATER_GAME),
      until: dayOf(A_LATER_GAME + ONE_GAME_SHORT),
    });
  });

  it("should count a run the player then ended by being the fool", () => {
    const career = [
      ...cleanRun(FIRST_GAME, ENOUGH_GAMES),
      playedAs(Finish.Fool, A_LATER_GAME),
    ];

    expect(longestCleanStreak(career)?.until).toBe(dayOf(FIRST_GAME + ONE_GAME_SHORT));
  });

  it("should keep the first of two runs of the same length", () => {
    const career = [
      ...cleanRun(FIRST_GAME, ENOUGH_GAMES),
      playedAs(Finish.Fool, A_LATER_GAME),
      ...cleanRun(A_LATER_STILL_GAME, ENOUGH_GAMES),
    ];

    expect(longestCleanStreak(career)?.from).toBe(dayOf(FIRST_GAME));
  });

  it("should boast of the longest run rather than the last one", () => {
    const career = [
      ...cleanRun(FIRST_GAME, ONE_GAME_MORE),
      playedAs(Finish.Fool, A_LATER_GAME),
      ...cleanRun(A_LATER_STILL_GAME, ENOUGH_GAMES),
    ];

    expect(longestCleanStreak(career)?.from).toBe(dayOf(FIRST_GAME));
  });
});
