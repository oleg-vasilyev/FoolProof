import { describe, expect, it } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName, RAREST_FIRST } from "#scoresheet/domain/awards/award-catalogue.ts";
import { flyingStart } from "#scoresheet/domain/awards/run-awards.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { NO_PAST } from "#scoresheet/domain/awards/evening-past.ts";
import { awardReason, awardTitle } from "#scoresheet/render/awards/award-lines.ts";
import { copyIn } from "#scoresheet/copy.ts";
import { Locale, LOCALES } from "#shared/locale/locales.ts";
import {
  appearanceOf,
  appearingAs,
  eveningOf,
  playerAppearing,
} from "#scoresheet/domain/session-appearances.stub.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";


const OLEG = 1;

const ANYA = 2;

const ROMA = 3;

const DIMA = 4;

const SIX_ROUNDS = 6;

const THREE = 3;

const FOUR = 4;

const FIRST_PLACE = 1;

const NINETEEN = 19;

const chronologyOf = (orders: readonly (readonly number[])[]): SeriesChronology => ({
  startedOn: "2026-09-10",
  players: [OLEG, ANYA, ROMA, DIMA].map((playerId) => ({
    playerId,
    displayName: `P${String(playerId)}`,
  })),
  games: orders.map((order, index) => ({
    gameId: index + FIRST_PLACE,
    starterId: order[0] ?? null,
    placements: order.map((playerId, at) => ({ playerId, position: at + FIRST_PLACE })),
  })),
});

describe("FLYING START — acceptance", () => {
  it("fires for three firsts from the very first game", () => {
    const evening = eveningOf(SIX_ROUNDS, [
      appearingAs(OLEG, Finish.First, Finish.First, Finish.First, Finish.Middle, Finish.Fool, Finish.Middle),
      appearingAs(ANYA, Finish.Middle, Finish.Middle, Finish.Middle, Finish.First, Finish.First, Finish.First),
    ]);

    expect(flyingStart(evening)).toEqual({
      name: AwardName.FlyingStart,
      winners: [OLEG],
      run: THREE,
    });
  });

  it("carries the whole opening run, not just the threshold", () => {
    const evening = eveningOf(SIX_ROUNDS, [
      appearingAs(OLEG, Finish.First, Finish.First, Finish.First, Finish.First, Finish.Middle, Finish.Middle),
    ]);

    expect(flyingStart(evening)?.run).toBe(FOUR);
  });

  it("does not fire on two firsts from the off", () => {
    const evening = eveningOf(SIX_ROUNDS, [
      appearingAs(OLEG, Finish.First, Finish.First, Finish.Middle, Finish.First, Finish.First, Finish.First),
    ]);

    expect(flyingStart(evening)).toBeNull();
  });

  it("does not fire for a player who arrived after the first game", () => {
    const late = playerAppearing(OLEG, [
      appearanceOf(1, Finish.First),
      appearanceOf(2, Finish.First),
      appearanceOf(3, Finish.First),
      appearanceOf(4, Finish.Middle),
    ]);

    expect(flyingStart(eveningOf(SIX_ROUNDS, [late]))).toBeNull();
  });

  it("does not count a run that is broken by a missed game", () => {
    const absentee = playerAppearing(OLEG, [
      appearanceOf(0, Finish.First),
      appearanceOf(2, Finish.First),
      appearanceOf(3, Finish.First),
    ]);

    expect(flyingStart(eveningOf(SIX_ROUNDS, [absentee]))).toBeNull();
  });

  it("reaches the card through the real selection", () => {
    const honours = honoursFor(
      chronologyOf([
        [OLEG, ANYA, ROMA, DIMA],
        [OLEG, ROMA, DIMA, ANYA],
        [OLEG, DIMA, ANYA, ROMA],
        [ANYA, OLEG, ROMA, DIMA],
        [ROMA, ANYA, OLEG, DIMA],
        [DIMA, ROMA, ANYA, OLEG],
      ]),
      NO_PAST
    );

    expect(honours?.awards.find((award) => award.name === AwardName.FlyingStart)).toEqual({
      name: AwardName.FlyingStart,
      winners: [OLEG],
      run: THREE,
    });
  });

  it("is dropped when the hat trick names the same player", () => {
    const honours = honoursFor(
      chronologyOf([
        [OLEG, ANYA, ROMA, DIMA],
        [OLEG, ROMA, DIMA, ANYA],
        [OLEG, DIMA, ANYA, ROMA],
        [OLEG, ANYA, ROMA, DIMA],
        [ROMA, ANYA, OLEG, DIMA],
        [DIMA, ROMA, ANYA, OLEG],
      ]),
      NO_PAST
    );
    const names = honours?.awards.map((award) => award.name) ?? [];

    expect(AwardName.FlyingStart).toBe("flyingStart");
    expect(names).toContain(AwardName.HatTrick);
    expect(names).not.toContain(AwardName.FlyingStart);
  });

  it("is ranked right after FALSE DAWN and before FIRST WIN", () => {
    const at = RAREST_FIRST.indexOf(AwardName.FlyingStart);

    expect(at).toBe(RAREST_FIRST.indexOf(AwardName.FalseDawn) + FIRST_PLACE);
    expect(at).toBe(RAREST_FIRST.indexOf(AwardName.FirstWin) - FIRST_PLACE);
  });

  it.each(LOCALES)("has a title and a reason carrying the count in %s", (locale) => {
    const copy = copyIn(locale);
    const award = { name: AwardName.FlyingStart, winners: [OLEG], run: NINETEEN } as const;

    expect(awardTitle(copy, award)).not.toBe("");
    expect(awardReason(copy, award)).toContain(String(NINETEEN));
  });

  it("is titled FLYING START in English", () => {
    expect(copyIn(Locale.En).awardTitles.flyingStart).toBe("FLYING START");
  });
});
