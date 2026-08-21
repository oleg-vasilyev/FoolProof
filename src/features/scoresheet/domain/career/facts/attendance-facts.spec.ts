import { describe, expect, it } from "vitest";
import { CareerFactName } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import {
  ENOUGH_EVENINGS_BEHIND,
  ENOUGH_GAMES_TO_COUNT,
  LONG_ENOUGH_AWAY,
  STILL_NEW_AFTER,
  everPresent,
  foundingMember,
  theHomecoming,
  theNewcomer,
} from "#scoresheet/domain/career/facts/attendance-facts.ts";
import type { CareerGame } from "#shared/repository/repository-contract.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";


const ONE_NIGHT = 1;

const ONE_GAME = 1;

const NO_DAY = "";

const A_ROUND = 0;

const A_PLACE = 2;

const FOUR_AT_THE_TABLE = 4;

const SOME_GAMES = 6;

const SOME_DECIDED = 5;

const SOME_BURNS = 2;

const SOME_FIRSTS = 3;

const SOME_OPENS = 4;

const SOME_EVENINGS = 7;

const A_NIGHTS_SHARE = 0.55;

const A_FOOL_RATE = 0.42;

const A_FIRST_RATE = 0.18;

const A_SEAT_IN_FOUR = 0.25;

const A_SEAT_IN_FIVE = 0.2;

const AN_OPEN_RATE = 0.31;

const A_SHARE = 0.61;

const OLEG = 1;

const OLEGS_NAME = "Oleg";

const FIRST_DAY = "2026-05-01";

const SECOND_DAY = "2026-05-02";

const THIRD_DAY = "2026-05-03";

const FOURTH_DAY = "2026-05-04";

const FIFTH_DAY = "2026-05-05";

const SIXTH_DAY = "2026-05-06";

const SEVENTH_DAY = "2026-05-07";

const EIGHTH_DAY = "2026-05-08";

const NINTH_DAY = "2026-05-09";

const TENTH_DAY = "2026-05-10";

const ELEVENTH_DAY = "2026-05-11";

const DAYS: readonly string[] = [
  FIRST_DAY,
  SECOND_DAY,
  THIRD_DAY,
  FOURTH_DAY,
  FIFTH_DAY,
  SIXTH_DAY,
  SEVENTH_DAY,
  EIGHTH_DAY,
  NINTH_DAY,
  TENTH_DAY,
  ELEVENTH_DAY,
];

const FIRST_EVENING = 1;

const SECOND_EVENING = 2;

const FOURTH_EVENING = 4;

const FIFTH_EVENING = 5;

const SIXTH_EVENING = 6;

const SEVENTH_EVENING = 7;

const NINTH_EVENING = 9;

const ELEVENTH_EVENING = 11;

const A_TALLY: CareerTally = {
  games: SOME_GAMES,
  evenings: SOME_EVENINGS,
  fools: SOME_BURNS,
  decided: SOME_DECIDED,
  foolRate: A_FOOL_RATE,
  seatChanceInDecided: A_SEAT_IN_FOUR,
  firsts: SOME_FIRSTS,
  firstRate: A_FIRST_RATE,
  seatChance: A_SEAT_IN_FIVE,
  opens: SOME_OPENS,
  openRate: AN_OPEN_RATE,
};

const dayOf = (seriesNo: number): string => DAYS[seriesNo - ONE_NIGHT] ?? NO_DAY;

const evenings = (count: number): readonly number[] =>
  Array.from({ length: count }, (_, at) => at + ONE_NIGHT);

const heldOn = (seriesNumbers: readonly number[]): readonly CareerGame[] =>
  seriesNumbers.map((seriesNo) => ({
    seriesNo,
    playedOn: dayOf(seriesNo),
    starterId: null,
    placements: [],
  }));

const cameOn = (seriesNumbers: readonly number[]): readonly EveningShare[] =>
  seriesNumbers.map((seriesNo) => ({
    seriesNo,
    playedOn: dayOf(seriesNo),
    games: SOME_GAMES,
    decided: SOME_DECIDED,
    fools: SOME_BURNS,
    firsts: SOME_FIRSTS,
    share: A_NIGHTS_SHARE,
  }));

const gamesBehind = (count: number): readonly CareerAppearance[] =>
  Array.from({ length: count }, () => ({
    round: A_ROUND,
    finish: Finish.Middle,
    position: A_PLACE,
    tableSize: FOUR_AT_THE_TABLE,
    seriesNo: FIRST_EVENING,
    playedOn: FIRST_DAY,
    opened: false,
  }));

const subjectOf = (
  held: readonly number[],
  attended: readonly number[],
  games: number = ENOUGH_GAMES_TO_COUNT
): CareerSubject => ({
  history: { players: [], games: heldOn(held) },
  career: {
    playerId: OLEG,
    displayName: OLEGS_NAME,
    share: A_SHARE,
    appearances: gamesBehind(games),
  },
  tally: A_TALLY,
  nights: cameOn(attended),
});

const SETTLED = evenings(ENOUGH_EVENINGS_BEHIND);

const TOO_YOUNG_A_CLUB = evenings(ENOUGH_EVENINGS_BEHIND - ONE_NIGHT);

describe("everPresent()", () => {
  it("should say nothing until ENOUGH_EVENINGS_BEHIND evenings have been held", () => {
    expect(everPresent(subjectOf(TOO_YOUNG_A_CLUB, TOO_YOUNG_A_CLUB))).toBeNull();
  });

  it("should name the ever-present who made every one of those evenings", () => {
    expect(everPresent(subjectOf(SETTLED, SETTLED))).toEqual({
      name: CareerFactName.EverPresent,
      evenings: ENOUGH_EVENINGS_BEHIND,
    });
  });

  it("should say nothing about a player who missed one of the evenings", () => {
    expect(everPresent(subjectOf(SETTLED, TOO_YOUNG_A_CLUB))).toBeNull();
  });

  it("should count an evening once however many games it held", () => {
    const twiceOver = [...SETTLED, ...SETTLED];

    expect(everPresent(subjectOf(twiceOver, SETTLED))).toEqual({
      name: CareerFactName.EverPresent,
      evenings: ENOUGH_EVENINGS_BEHIND,
    });
  });
});

describe("foundingMember()", () => {
  it("should say nothing until ENOUGH_EVENINGS_BEHIND evenings have been held", () => {
    expect(foundingMember(subjectOf(TOO_YOUNG_A_CLUB, TOO_YOUNG_A_CLUB))).toBeNull();
  });

  it("should name the founder whose first night was the club's first evening", () => {
    expect(foundingMember(subjectOf(SETTLED, [FIRST_EVENING]))).toEqual({
      name: CareerFactName.FoundingMember,
      playedOn: FIRST_DAY,
      evenings: ENOUGH_EVENINGS_BEHIND,
    });
  });

  it("should say nothing about a player who arrived after the club opened", () => {
    expect(foundingMember(subjectOf(SETTLED, [SECOND_EVENING]))).toBeNull();
  });

  it("should say nothing about a player with no night at all", () => {
    expect(foundingMember(subjectOf(SETTLED, []))).toBeNull();
  });
});

describe("theNewcomer()", () => {
  it("should say nothing until ENOUGH_EVENINGS_BEHIND evenings have been held", () => {
    expect(theNewcomer(subjectOf(TOO_YOUNG_A_CLUB, [FIRST_EVENING]))).toBeNull();
  });

  it("should name the newcomer at exactly STILL_NEW_AFTER evenings played", () => {
    const lately = evenings(STILL_NEW_AFTER);

    expect(theNewcomer(subjectOf(SETTLED, lately))).toEqual({
      name: CareerFactName.TheNewcomer,
      evenings: STILL_NEW_AFTER,
      games: ENOUGH_GAMES_TO_COUNT,
    });
  });

  it("should say nothing once the player has played more than STILL_NEW_AFTER evenings", () => {
    const lately = evenings(STILL_NEW_AFTER + ONE_NIGHT);

    expect(theNewcomer(subjectOf(SETTLED, lately))).toBeNull();
  });

  it("should say nothing when fewer than ENOUGH_GAMES_TO_COUNT games sit behind those evenings", () => {
    const lately = evenings(STILL_NEW_AFTER);

    expect(theNewcomer(subjectOf(SETTLED, lately, ENOUGH_GAMES_TO_COUNT - ONE_GAME))).toBeNull();
  });

  it("should count the games the player has actually played", () => {
    const lately = evenings(STILL_NEW_AFTER);
    const more = ENOUGH_GAMES_TO_COUNT + ONE_GAME;

    expect(theNewcomer(subjectOf(SETTLED, lately, more))).toEqual({
      name: CareerFactName.TheNewcomer,
      evenings: STILL_NEW_AFTER,
      games: more,
    });
  });
});

describe("theHomecoming()", () => {
  const A_LONG_HISTORY = evenings(NINTH_EVENING);

  it("should say nothing when the player was never away for LONG_ENOUGH_AWAY evenings", () => {
    const attended = [FIRST_EVENING, FIFTH_EVENING];

    expect(theHomecoming(subjectOf(A_LONG_HISTORY, attended))).toBeNull();
  });

  it("should name the homecoming after exactly LONG_ENOUGH_AWAY evenings missed", () => {
    const attended = [FIRST_EVENING, SIXTH_EVENING];

    expect(theHomecoming(subjectOf(A_LONG_HISTORY, attended))).toEqual({
      name: CareerFactName.TheHomecoming,
      missed: LONG_ENOUGH_AWAY,
      playedOn: SIXTH_DAY,
    });
  });

  it("should not count the evenings held before the player's first night", () => {
    const attended = [SIXTH_EVENING, SEVENTH_EVENING];

    expect(theHomecoming(subjectOf(A_LONG_HISTORY, attended))).toBeNull();
  });

  it("should hold the longest of several absences", () => {
    const attended = [FIRST_EVENING, FOURTH_EVENING, NINTH_EVENING];

    expect(theHomecoming(subjectOf(A_LONG_HISTORY, attended))).toEqual({
      name: CareerFactName.TheHomecoming,
      missed: LONG_ENOUGH_AWAY,
      playedOn: NINTH_DAY,
    });
  });

  it("should keep the first of two absences of the same length, not the latest", () => {
    const A_LONGER_HISTORY = evenings(ELEVENTH_EVENING);

    const attended = [FIRST_EVENING, SIXTH_EVENING, ELEVENTH_EVENING];

    expect(theHomecoming(subjectOf(A_LONGER_HISTORY, attended))).toEqual({
      name: CareerFactName.TheHomecoming,
      missed: LONG_ENOUGH_AWAY,
      playedOn: SIXTH_DAY,
    });
  });

  it("should say nothing about a player with no night at all", () => {
    expect(theHomecoming(subjectOf(A_LONG_HISTORY, []))).toBeNull();
  });
});
