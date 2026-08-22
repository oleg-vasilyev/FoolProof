import { describe, expect, it } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import { careerTally } from "#scoresheet/domain/career/career-tally.ts";


const NOTHING = 0;

const AN_EVEN_SPLIT = 0.5;

const ONCE = 1;

const TWICE = 2;

const A_ROUND = 0;

const A_PLACE = 2;

const FOUR_AT_THE_TABLE = 4;

const THREE_AT_THE_TABLE = 3;

const FIVE_AT_THE_TABLE = 5;

const TWO_AT_THE_TABLE = 2;

const FIRST_NIGHT = 7;

const SECOND_NIGHT = 8;

const A_DAY = "2026-05-01";

const A_QUARTER = 0.25;

const A_THIRD = 1 / 3;

const TWO_IN_THREE = 2 / 3;

const AT_THREE_AND_FIVE = 0.26666666666;

const TO_TEN_PLACES = 10;

const OPENED = true;

const SAT = false;

const playedAs = (
  finish: Finish,
  tableSize: number = FOUR_AT_THE_TABLE,
  seriesNo: number = FIRST_NIGHT,
  opened: boolean = SAT
): CareerAppearance => ({
  round: A_ROUND,
  finish,
  position: A_PLACE,
  tableSize,
  seriesNo,
  playedOn: A_DAY,
  opened,
});

describe("careerTally()", () => {
  it("should report a career of no games as nothing at all", () => {
    expect(careerTally([])).toEqual({
      games: NOTHING,
      evenings: NOTHING,
      shareChance: AN_EVEN_SPLIT,
      fools: NOTHING,
      decided: NOTHING,
      foolRate: NOTHING,
      seatChanceInDecided: NOTHING,
      firsts: NOTHING,
      firstRate: NOTHING,
      seatChance: NOTHING,
      opens: NOTHING,
      openRate: NOTHING,
    });
  });

  it("should count every game played, drawn ones included", () => {
    const career = [playedAs(Finish.First), playedAs(Finish.Drawn), playedAs(Finish.Fool)];

    expect(careerTally(career).games).toBe(career.length);
  });

  it("should count an evening once however many games it held", () => {
    const career = [
      playedAs(Finish.First, FOUR_AT_THE_TABLE, FIRST_NIGHT),
      playedAs(Finish.Middle, FOUR_AT_THE_TABLE, FIRST_NIGHT),
      playedAs(Finish.Middle, FOUR_AT_THE_TABLE, SECOND_NIGHT),
    ];

    expect(careerTally(career).evenings).toBe(TWICE);
  });

  it("should count the games left alone at the back", () => {
    const career = [playedAs(Finish.Fool), playedAs(Finish.Middle), playedAs(Finish.Fool)];

    expect(careerTally(career).fools).toBe(TWICE);
  });

  it("should not count a shared last place as a fool", () => {
    expect(careerTally([playedAs(Finish.Drawn)]).fools).toBe(NOTHING);
  });

  it("should count a game as decided unless it was drawn", () => {
    const career = [playedAs(Finish.First), playedAs(Finish.Fool), playedAs(Finish.Drawn)];

    expect(careerTally(career).decided).toBe(TWICE);
  });

  it("should measure the fool rate against the decided games only", () => {
    const career = [
      playedAs(Finish.Fool),
      playedAs(Finish.Fool),
      playedAs(Finish.Middle),
      playedAs(Finish.Drawn),
    ];

    expect(careerTally(career).foolRate).toBe(TWO_IN_THREE);
  });

  it("should count the games gone out first", () => {
    const career = [playedAs(Finish.First), playedAs(Finish.Middle), playedAs(Finish.First)];

    expect(careerTally(career).firsts).toBe(TWICE);
  });

  it("should measure the first rate against every game, drawn ones included", () => {
    const career = [
      playedAs(Finish.First),
      playedAs(Finish.Middle),
      playedAs(Finish.Middle),
      playedAs(Finish.Drawn),
    ];

    expect(careerTally(career).firstRate).toBe(A_QUARTER);
  });

  it("should expect the fool as often as a seat at the table comes round", () => {
    const career = [
      playedAs(Finish.Fool, FOUR_AT_THE_TABLE),
      playedAs(Finish.Middle, FOUR_AT_THE_TABLE),
    ];

    expect(careerTally(career).seatChanceInDecided).toBe(A_QUARTER);
  });

  it("should leave a drawn game's table out of the expected fool rate", () => {
    const career = [
      playedAs(Finish.Fool, FOUR_AT_THE_TABLE),
      playedAs(Finish.Middle, FOUR_AT_THE_TABLE),
      playedAs(Finish.Drawn, TWO_AT_THE_TABLE),
    ];

    expect(careerTally(career).seatChanceInDecided).toBe(A_QUARTER);
  });

  it("should count a drawn game's table towards the expected first rate", () => {
    const career = [
      playedAs(Finish.Fool, FOUR_AT_THE_TABLE),
      playedAs(Finish.Middle, FOUR_AT_THE_TABLE),
      playedAs(Finish.Drawn, TWO_AT_THE_TABLE),
    ];

    expect(careerTally(career).seatChance).toBe(A_THIRD);
  });

  it("should average the seat chance over tables of different sizes", () => {
    const career = [
      playedAs(Finish.Middle, THREE_AT_THE_TABLE),
      playedAs(Finish.Middle, FIVE_AT_THE_TABLE),
    ];

    expect(careerTally(career).seatChance).toBeCloseTo(AT_THREE_AND_FIVE, TO_TEN_PLACES);
  });

  it("should count the games the player opened", () => {
    const career = [
      playedAs(Finish.First, FOUR_AT_THE_TABLE, FIRST_NIGHT, OPENED),
      playedAs(Finish.Middle, FOUR_AT_THE_TABLE, FIRST_NIGHT, SAT),
    ];

    expect(careerTally(career).opens).toBe(ONCE);
  });

  it("should measure the open rate against every game, drawn ones included", () => {
    const career = [
      playedAs(Finish.First, FOUR_AT_THE_TABLE, FIRST_NIGHT, OPENED),
      playedAs(Finish.Middle, FOUR_AT_THE_TABLE, FIRST_NIGHT, OPENED),
      playedAs(Finish.Drawn, FOUR_AT_THE_TABLE, FIRST_NIGHT, SAT),
    ];

    expect(careerTally(career).openRate).toBe(TWO_IN_THREE);
  });
});
