import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerGame, CareerHistory } from "#shared/repository/repository-contract.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import {
  appearanceOf,
  eveningOf,
  playerAppearing,
} from "#scoresheet/domain/session-appearances.stub.ts";


const sessionAppearancesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  sessionAppearances: (chronology: unknown) => sessionAppearancesSpy(chronology),
}));

const { careerOf } = await import("#scoresheet/domain/career/career-appearances.ts");

const NOTHING = 0;

const ONCE = 1;

const NO_ROUNDS = 0;

const OPENING_ROUND = 0;

const SECOND_ROUND = 1;

const A_ROUND_NEVER_PLAYED = 4;

const THIRD_PLACE = 3;

const FOUR_AT_THE_TABLE = 4;

const OLEG = 1;

const ANYA = 2;

const STRANGER = 3;

const OLEGS_NAME = "Oleg";

const ANYAS_NAME = "Anya";

const OLEGS_SHARE = 0.61;

const ANYAS_SHARE = 0.42;

const FIRST_NIGHT = 7;

const SECOND_NIGHT = 8;

const OPENING_DAY = "2026-05-01";

const NEXT_DAY = "2026-05-08";

const gameOf = (seriesNo: number, playedOn: string, starterId: number | null): CareerGame => ({
  seriesNo,
  playedOn,
  starterId,
  placements: [],
});

const historyOf = (...games: readonly CareerGame[]): CareerHistory => ({
  players: [
    { playerId: OLEG, displayName: OLEGS_NAME },
    { playerId: ANYA, displayName: ANYAS_NAME },
  ],
  games,
});

const TWO_NIGHTS = historyOf(
  gameOf(FIRST_NIGHT, OPENING_DAY, ANYA),
  gameOf(SECOND_NIGHT, NEXT_DAY, OLEG)
);

const sitting = (...players: readonly PlayerAppearances[]): void => {
  sessionAppearancesSpy.mockReturnValue(eveningOf(NO_ROUNDS, players));
};

describe("careerOf()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    sitting(playerAppearing(OLEG, [appearanceOf(OPENING_ROUND, Finish.First)], OLEGS_SHARE));
  });

  it("should read the session out of the history it was handed, once", () => {
    careerOf(TWO_NIGHTS, OLEG);

    expect(sessionAppearancesSpy).toHaveBeenCalledWith(TWO_NIGHTS);
    expect(sessionAppearancesSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should report nothing for a player the history never named", () => {
    sitting(playerAppearing(STRANGER, [appearanceOf(OPENING_ROUND, Finish.First)]));

    expect(careerOf(TWO_NIGHTS, STRANGER)).toBeNull();
  });

  it("should report nothing for a named player the session never seated", () => {
    sitting(playerAppearing(ANYA, [appearanceOf(OPENING_ROUND, Finish.First)]));

    expect(careerOf(TWO_NIGHTS, OLEG)).toBeNull();
  });

  it("should report nothing for a player who sat down and played no game", () => {
    sitting(playerAppearing(OLEG, []));

    expect(careerOf(TWO_NIGHTS, OLEG)).toBeNull();
  });

  it("should name the player the history names, not whoever comes first", () => {
    sitting(playerAppearing(ANYA, [appearanceOf(OPENING_ROUND, Finish.First)], ANYAS_SHARE));

    expect(careerOf(TWO_NIGHTS, ANYA)?.displayName).toBe(ANYAS_NAME);
  });

  it("should report the player asked for", () => {
    expect(careerOf(TWO_NIGHTS, OLEG)?.playerId).toBe(OLEG);
  });

  it("should keep the share the session computed for that player alone", () => {
    sitting(
      playerAppearing(ANYA, [appearanceOf(OPENING_ROUND, Finish.First)], ANYAS_SHARE),
      playerAppearing(OLEG, [appearanceOf(OPENING_ROUND, Finish.First)], OLEGS_SHARE)
    );

    expect(careerOf(TWO_NIGHTS, OLEG)?.share).toBe(OLEGS_SHARE);
  });

  it("should date an appearance by the game of its own round", () => {
    sitting(
      playerAppearing(OLEG, [
        appearanceOf(SECOND_ROUND, Finish.Middle, THIRD_PLACE, FOUR_AT_THE_TABLE),
      ])
    );

    expect(careerOf(TWO_NIGHTS, OLEG)?.appearances[NOTHING]).toEqual({
      round: SECOND_ROUND,
      finish: Finish.Middle,
      position: THIRD_PLACE,
      tableSize: FOUR_AT_THE_TABLE,
      seriesNo: SECOND_NIGHT,
      playedOn: NEXT_DAY,
      opened: true,
    });
  });

  it("should keep every game the player played, in the order they were played", () => {
    sitting(
      playerAppearing(OLEG, [
        appearanceOf(OPENING_ROUND, Finish.Fool),
        appearanceOf(SECOND_ROUND, Finish.First),
      ])
    );

    expect(careerOf(TWO_NIGHTS, OLEG)?.appearances.map((played) => played.seriesNo)).toEqual([
      FIRST_NIGHT,
      SECOND_NIGHT,
    ]);
  });

  it("should mark the games the player opened", () => {
    sitting(playerAppearing(OLEG, [appearanceOf(SECOND_ROUND, Finish.First)]));

    expect(careerOf(TWO_NIGHTS, OLEG)?.appearances[NOTHING]?.opened).toBe(true);
  });

  it("should not call a game somebody else opened an opening", () => {
    sitting(playerAppearing(OLEG, [appearanceOf(OPENING_ROUND, Finish.First)]));

    expect(careerOf(TWO_NIGHTS, OLEG)?.appearances[NOTHING]?.opened).toBe(false);
  });

  it("should leave a game nobody opened unmarked", () => {
    sitting(playerAppearing(OLEG, [appearanceOf(OPENING_ROUND, Finish.First)]));

    expect(careerOf(historyOf(gameOf(FIRST_NIGHT, OPENING_DAY, null)), OLEG)?.appearances[NOTHING]
      ?.opened).toBe(false);
  });

  it("should leave out an appearance the history has no game for", () => {
    sitting(
      playerAppearing(OLEG, [
        appearanceOf(OPENING_ROUND, Finish.First),
        appearanceOf(A_ROUND_NEVER_PLAYED, Finish.Fool),
      ])
    );

    expect(careerOf(TWO_NIGHTS, OLEG)?.appearances).toHaveLength(ONCE);
  });
});
