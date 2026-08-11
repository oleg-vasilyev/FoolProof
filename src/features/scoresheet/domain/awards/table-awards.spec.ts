import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { LONG_ENOUGH } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import { appearanceOf, eveningOf, playerAppearing } from "#scoresheet/domain/session-appearances.stub.ts";


const foolCountSpy = vi.fn();

const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  foolCount: (player: unknown) => foolCountSpy(player),
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const { fullHouse, thePacifist, theRotation, theTruce } = await import(
  "#scoresheet/domain/awards/table-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const SEVEN = 7;

const NINETEEN = 19;

const DIMA = 2;

const VERONIKA = 5;

const TWO_PLAYERS = 2;

const eveningFor = (players: readonly PlayerAppearances[], rounds = NINETEEN) =>
  eveningOf(rounds, players);

const DREW = playerAppearing(DIMA, [
  appearanceOf(NOTHING, Finish.Fool),
  appearanceOf(TWICE, Finish.Drawn),
]);

const ALSO_DREW = playerAppearing(VERONIKA, [
  appearanceOf(NOTHING, Finish.First),
  appearanceOf(TWICE, Finish.Drawn),
]);

const NEVER_DREW = playerAppearing(SEVEN, [appearanceOf(NOTHING, Finish.Fool)]);

beforeEach(() => {
  vi.clearAllMocks();

  foolCountSpy.mockReturnValue(ONCE);
  playedGamesSpy.mockReturnValue(NINETEEN);
});

describe("theTruce()", () => {
  it("should award nothing when the evening had no draw", () => {
    expect(theTruce(eveningFor([NEVER_DREW]))).toBeNull();
  });

  it("should name everybody who was in a draw", () => {
    expect(theTruce(eveningFor([DREW, NEVER_DREW, ALSO_DREW]))?.winners).toEqual([
      DIMA,
      VERONIKA,
    ]);
  });

  it("should count one draw when two players shared the same last place", () => {
    const award = theTruce(eveningFor([DREW, ALSO_DREW]));

    expect(award?.name === AwardName.TheTruce ? [award.draws, award.games] : []).toEqual([
      ONCE,
      NINETEEN,
    ]);
  });

  it("should count two draws played in different games", () => {
    const twice = playerAppearing(DIMA, [
      appearanceOf(NOTHING, Finish.Drawn),
      appearanceOf(ONCE, Finish.First),
      appearanceOf(TWICE, Finish.Drawn),
    ]);
    const award = theTruce(eveningFor([twice]));

    expect(award?.name === AwardName.TheTruce ? award.draws : NOTHING).toBe(TWICE);
  });
});

describe("thePacifist()", () => {
  const BOTH_DRAWS = playerAppearing(DIMA, [
    appearanceOf(NOTHING, Finish.Drawn),
    appearanceOf(ONCE, Finish.First),
    appearanceOf(TWICE, Finish.Drawn),
  ]);

  const ONE_DRAW = playerAppearing(VERONIKA, [
    appearanceOf(NOTHING, Finish.Drawn),
    appearanceOf(TWICE, Finish.Fool),
  ]);

  it("should award nothing when the evening had only one draw", () => {
    expect(thePacifist(eveningFor([DREW, ALSO_DREW]))).toBeNull();
  });

  it("should award nothing when nobody was in every draw", () => {
    const OTHER_DRAW = playerAppearing(VERONIKA, [appearanceOf(ONCE, Finish.Drawn)]);
    const SOME_DRAW = playerAppearing(DIMA, [appearanceOf(NOTHING, Finish.Drawn)]);

    expect(thePacifist(eveningFor([SOME_DRAW, OTHER_DRAW]))).toBeNull();
  });

  it("should name the player who was in every draw of the evening", () => {
    const award = thePacifist(eveningFor([BOTH_DRAWS, ONE_DRAW]));

    expect(award?.name === AwardName.ThePacifist ? [award.winners, award.draws] : []).toEqual([
      [DIMA],
      TWICE,
    ]);
  });

  it("should name both when a pair drew the same games together", () => {
    const PARTNER = playerAppearing(VERONIKA, BOTH_DRAWS.appearances);

    expect(thePacifist(eveningFor([BOTH_DRAWS, PARTNER]))?.winners).toEqual([DIMA, VERONIKA]);
  });
});

describe("theRotation()", () => {
  it("should award nothing in an evening too short to go round", () => {
    expect(theRotation(eveningFor([DREW], ONCE))).toBeNull();
  });

  it("should award nothing when somebody escaped being the fool", () => {
    foolCountSpy.mockReturnValueOnce(ONCE).mockReturnValueOnce(NOTHING);

    expect(theRotation(eveningFor([DREW, ALSO_DREW]))).toBeNull();
  });

  it("should name everybody who sat down when the fool went all the way round", () => {
    const award = theRotation(eveningFor([DREW, ALSO_DREW]));

    expect(award?.name === AwardName.TheRotation ? [award.winners, award.players] : []).toEqual([
      [DIMA, VERONIKA],
      TWO_PLAYERS,
    ]);
  });

  it("should leave out somebody who never sat down at all", () => {
    playedGamesSpy.mockReturnValueOnce(NINETEEN).mockReturnValueOnce(NOTHING);

    expect(theRotation(eveningFor([DREW, ALSO_DREW]))?.winners).toEqual([DIMA]);
  });

  it("should award nothing when nobody played at all", () => {
    playedGamesSpy.mockReturnValue(NOTHING);

    expect(theRotation(eveningFor([DREW]))).toBeNull();
  });
});

describe("fullHouse()", () => {
  it("should award nothing in an evening shorter than a long one", () => {
    expect(fullHouse(eveningFor([DREW], LONG_ENOUGH - ONCE))).toBeNull();
  });

  it("should award nothing when somebody missed a game", () => {
    playedGamesSpy.mockImplementation((player: PlayerAppearances) =>
      player.playerId === VERONIKA ? NINETEEN - ONCE : NINETEEN
    );

    expect(fullHouse(eveningFor([DREW, ALSO_DREW]))).toBeNull();
  });

  it("should name the whole table when nobody missed a hand", () => {
    const award = fullHouse(eveningFor([DREW, ALSO_DREW]));

    expect(award?.name === AwardName.FullHouse ? [award.winners, award.games] : []).toEqual([
      [DIMA, VERONIKA],
      NINETEEN,
    ]);
  });

  it("should award nothing when nobody played at all", () => {
    playedGamesSpy.mockReturnValue(NOTHING);

    expect(fullHouse(eveningFor([DREW]))).toBeNull();
  });
});
