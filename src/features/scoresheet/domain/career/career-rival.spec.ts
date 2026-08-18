import { describe, expect, it } from "vitest";
import type {
  CareerGame,
  CareerHistory,
  Finalist,
  PlayerColumn,
} from "#shared/repository/repository-contract.ts";
import { ENOUGH_DUELS, chiefRival } from "#scoresheet/domain/career/career-rival.ts";


const NO_BURNS = 0;

const ONE_BURN = 1;

const ONE_DUEL = 1;

const FIRST_OUT = 1;

const SECOND_LAST = 2;

const LAST_PLACE = 3;

const OLEG = 1;

const ANYA = 2;

const ROMAN = 3;

const MISHA = 4;

const OLEGS_NAME = "Oleg";

const ANYAS_NAME = "Anya";

const ROMANS_NAME = "Roman";

const MISHAS_NAME = "Misha";

const A_NIGHT = 7;

const A_DAY = "2026-05-01";

const ENOUGH = ENOUGH_DUELS;

const ONE_DUEL_SHORT = ENOUGH_DUELS - ONE_DUEL;

const ONE_DUEL_MORE = ENOUGH_DUELS + ONE_DUEL;

const named = (playerId: number, displayName: string): PlayerColumn => ({ playerId, displayName });

const OLEG_NAMED = named(OLEG, OLEGS_NAME);

const ANYA_NAMED = named(ANYA, ANYAS_NAME);

const ROMAN_NAMED = named(ROMAN, ROMANS_NAME);

const MISHA_NAMED = named(MISHA, MISHAS_NAME);

const EVERYBODY = [OLEG_NAMED, ANYA_NAMED, ROMAN_NAMED, MISHA_NAMED];

const THE_YOUNGER_FIRST = [OLEG_NAMED, ROMAN_NAMED, ANYA_NAMED, MISHA_NAMED];

const seat = (playerId: number, position: number): Finalist => ({ playerId, position });

const gameWith = (...placements: readonly Finalist[]): CareerGame => ({
  seriesNo: A_NIGHT,
  playedOn: A_DAY,
  starterId: null,
  placements,
});

const times = (count: number, game: CareerGame): readonly CareerGame[] =>
  Array.from({ length: count }, () => game);

const lostTo = (rivalId: number, watcherId: number = MISHA): CareerGame =>
  gameWith(seat(watcherId, FIRST_OUT), seat(rivalId, SECOND_LAST), seat(OLEG, LAST_PLACE));

const wonAgainst = (rivalId: number): CareerGame =>
  gameWith(seat(MISHA, FIRST_OUT), seat(OLEG, SECOND_LAST), seat(rivalId, LAST_PLACE));

const drawnWith = (rivalId: number): CareerGame =>
  gameWith(seat(MISHA, FIRST_OUT), seat(OLEG, LAST_PLACE), seat(rivalId, LAST_PLACE));

const satOutByOleg = (): CareerGame =>
  gameWith(seat(MISHA, FIRST_OUT), seat(ANYA, SECOND_LAST), seat(ROMAN, LAST_PLACE));

const wentOutFirst = (rivalId: number): CareerGame =>
  gameWith(seat(OLEG, FIRST_OUT), seat(MISHA, SECOND_LAST), seat(rivalId, LAST_PLACE));

const drawnBetween = (first: number, second: number): CareerGame =>
  gameWith(seat(first, FIRST_OUT), seat(second, FIRST_OUT));

const burnedBy = (rivalId: number, duels: number, lost: number): readonly CareerGame[] => [
  ...times(lost, lostTo(rivalId)),
  ...times(duels - lost, wonAgainst(rivalId)),
];

const historyOf = (
  games: readonly CareerGame[],
  players: readonly PlayerColumn[] = EVERYBODY
): CareerHistory => ({ players, games });

describe("chiefRival()", () => {
  it("should name no rival for a player who has played nobody", () => {
    expect(chiefRival(historyOf([]), OLEG)).toBeNull();
  });

  it("should not name a rival met one duel short of enough", () => {
    expect(chiefRival(historyOf(burnedBy(ANYA, ONE_DUEL_SHORT, ONE_DUEL_SHORT)), OLEG)).toBeNull();
  });

  it("should name a rival met exactly enough times", () => {
    expect(chiefRival(historyOf(burnedBy(ANYA, ENOUGH, ENOUGH)), OLEG)).toEqual({
      playerId: ANYA,
      displayName: ANYAS_NAME,
      duels: ENOUGH,
      lost: ENOUGH,
    });
  });

  it("should not name a rival who never left them the fool", () => {
    expect(chiefRival(historyOf(burnedBy(ANYA, ENOUGH, NO_BURNS)), OLEG)).toBeNull();
  });

  it("should not name the player as their own rival", () => {
    expect(chiefRival(historyOf(burnedBy(ANYA, ENOUGH, ENOUGH)), OLEG)?.playerId).toBe(ANYA);
  });

  it("should count only the duels the player sat at", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ENOUGH), ...times(ENOUGH, satOutByOleg())];

    expect(chiefRival(historyOf(games), OLEG)?.duels).toBe(ENOUGH);
  });

  it("should count only the duels the rival sat at", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ENOUGH), ...burnedBy(ROMAN, ENOUGH, ENOUGH)];

    expect(chiefRival(historyOf(games), OLEG)?.duels).toBe(ENOUGH);
  });

  it("should not count a two-handed draw the player sat out", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ENOUGH), ...times(ENOUGH, drawnBetween(ANYA, MISHA))];

    expect(chiefRival(historyOf(games), OLEG)?.duels).toBe(ENOUGH);
  });

  it("should not count a two-handed draw the rival sat out", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ENOUGH), ...times(ENOUGH, drawnBetween(OLEG, MISHA))];

    expect(chiefRival(historyOf(games), OLEG)?.duels).toBe(ENOUGH);
  });

  it("should not count a game the player finished far from the back", () => {
    const games = [
      ...burnedBy(ANYA, ONE_DUEL_SHORT, ONE_DUEL_SHORT),
      ...times(ENOUGH, wentOutFirst(ANYA)),
    ];

    expect(chiefRival(historyOf(games), OLEG)).toBeNull();
  });

  it("should not count whoever went out first as a duellist", () => {
    const games = times(ENOUGH, lostTo(ROMAN, ANYA));

    expect(chiefRival(historyOf(games), OLEG)?.playerId).toBe(ROMAN);
  });

  it("should count a shared last place as a duel nobody lost", () => {
    const games = [...times(ONE_DUEL_SHORT, drawnWith(ANYA)), lostTo(ANYA)];

    expect(chiefRival(historyOf(games), OLEG)).toEqual({
      playerId: ANYA,
      displayName: ANYAS_NAME,
      duels: ENOUGH,
      lost: ONE_BURN,
    });
  });

  it("should count as lost only the games the player was left alone at the back", () => {
    expect(chiefRival(historyOf(burnedBy(ANYA, ENOUGH, ONE_BURN)), OLEG)?.lost).toBe(ONE_BURN);
  });

  it("should prefer the rival who left them the fool more often", () => {
    const games = [...burnedBy(ANYA, ONE_DUEL_MORE, ONE_BURN), ...burnedBy(ROMAN, ENOUGH, ENOUGH)];

    expect(chiefRival(historyOf(games), OLEG)?.playerId).toBe(ROMAN);
  });

  it("should keep the fiercer rival when a busier one comes later", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ENOUGH), ...burnedBy(ROMAN, ONE_DUEL_MORE, ONE_BURN)];

    expect(chiefRival(historyOf(games), OLEG)?.playerId).toBe(ANYA);
  });

  it("should prefer the rival met more often when the burns are equal", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ONE_BURN), ...burnedBy(ROMAN, ONE_DUEL_MORE, ONE_BURN)];

    expect(chiefRival(historyOf(games), OLEG)?.playerId).toBe(ROMAN);
  });

  it("should keep the rival met more often when a rarer one comes later", () => {
    const games = [...burnedBy(ANYA, ONE_DUEL_MORE, ONE_BURN), ...burnedBy(ROMAN, ENOUGH, ONE_BURN)];

    expect(chiefRival(historyOf(games), OLEG)?.playerId).toBe(ANYA);
  });

  it("should not let an older rival beat one met more often", () => {
    const games = [
      ...burnedBy(ROMAN, ONE_DUEL_MORE, ONE_BURN),
      ...burnedBy(ANYA, ENOUGH, ONE_BURN),
    ];

    expect(chiefRival(historyOf(games, THE_YOUNGER_FIRST), OLEG)?.playerId).toBe(ROMAN);
  });

  it("should prefer the longer-standing rival when burns and duels are equal", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ENOUGH), ...burnedBy(ROMAN, ENOUGH, ENOUGH)];

    expect(chiefRival(historyOf(games, THE_YOUNGER_FIRST), OLEG)?.playerId).toBe(ANYA);
  });

  it("should keep the longer-standing rival when a newer one matches them", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ENOUGH), ...burnedBy(ROMAN, ENOUGH, ENOUGH)];

    expect(chiefRival(historyOf(games), OLEG)?.playerId).toBe(ANYA);
  });

  it("should not let a longer-standing rival beat a fiercer one", () => {
    const games = [...burnedBy(ANYA, ENOUGH, ONE_BURN), ...burnedBy(ROMAN, ENOUGH, ENOUGH)];

    expect(chiefRival(historyOf(games, THE_YOUNGER_FIRST), OLEG)?.playerId).toBe(ROMAN);
  });
});
