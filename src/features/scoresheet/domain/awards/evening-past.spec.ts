import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { EVENING_MINIMUM } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { CareerHistory } from "#shared/repository/repository-contract.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import {
  appearanceOf,
  eveningOf,
  playerAppearing,
} from "#scoresheet/domain/session-appearances.stub.ts";


const sessionAppearancesSpy = vi.fn();

const foolCountSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  sessionAppearances: (chronology: unknown) => sessionAppearancesSpy(chronology),
  foolCount: (player: unknown) => foolCountSpy(player),
}));

const { NO_PAST, pastBefore, pastOf } = await import(
  "#scoresheet/domain/awards/evening-past.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const OLEG = 1;

const ANYA = 2;

const A_STRANGER = 99;

const FIRST_SERIES = 1;

const SECOND_SERIES = 2;

const TONIGHT = 3;

const THEIR_SHARE = 0.64;

const FOOLED_TWICE = 2;

const A_LONG_EVENING = 12;

const playersInChat = [
  { playerId: OLEG, displayName: "Oleg" },
  { playerId: ANYA, displayName: "Anya" },
];

const gameIn = (seriesNo: number, playedOn: string) => ({
  seriesNo,
  playedOn,
  starterId: OLEG,
  placements: [{ playerId: OLEG, position: ONCE }],
});

const historyOf = (...seriesNumbers: readonly number[]): CareerHistory => ({
  players: playersInChat,
  games: seriesNumbers.map((seriesNo) => gameIn(seriesNo, "2026-08-21")),
});

const playedEnough = (playerId: number, finish: Finish = Finish.Middle): PlayerAppearances =>
  playerAppearing(
    playerId,
    Array.from({ length: EVENING_MINIMUM }, (_unused, round) => appearanceOf(round, finish)),
    THEIR_SHARE
  );

describe("evening past", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    foolCountSpy.mockReturnValue(FOOLED_TWICE);
    sessionAppearancesSpy.mockReturnValue(eveningOf(A_LONG_EVENING, [playedEnough(OLEG)]));
  });

  describe("pastBefore", () => {
    it("should score every series but the newest, which is tonight", () => {
      pastBefore(historyOf(FIRST_SERIES, SECOND_SERIES, TONIGHT));

      expect(sessionAppearancesSpy).toHaveBeenCalledTimes(TWICE);
    });

    it("should hand each earlier series only its own games", () => {
      const history: CareerHistory = {
        players: playersInChat,
        games: [
          gameIn(FIRST_SERIES, "2026-07-31"),
          gameIn(SECOND_SERIES, "2026-08-21"),
          gameIn(TONIGHT, "2026-08-28"),
        ],
      };

      pastBefore(history);

      expect(sessionAppearancesSpy).toHaveBeenNthCalledWith(ONCE, {
        players: playersInChat,
        games: [{ placements: history.games[NOTHING]?.placements, starterId: OLEG }],
      });
    });

    it("should carry what a player did on an evening they played", () => {
      const past = pastBefore(historyOf(FIRST_SERIES, TONIGHT));

      expect(pastOf(past, OLEG)).toEqual([
        { share: THEIR_SHARE, fools: FOOLED_TWICE, firsts: NOTHING, games: EVENING_MINIMUM },
      ]);
    });

    it("should count the first places of an evening", () => {
      sessionAppearancesSpy.mockReturnValue(
        eveningOf(A_LONG_EVENING, [playedEnough(OLEG, Finish.First)])
      );

      const past = pastBefore(historyOf(FIRST_SERIES, TONIGHT));

      expect(pastOf(past, OLEG)[NOTHING]?.firsts).toBe(EVENING_MINIMUM);
    });

    it("should not count an evening too short to be judged", () => {
      sessionAppearancesSpy.mockReturnValue(
        eveningOf(A_LONG_EVENING, [
          playerAppearing(
            OLEG,
            Array.from({ length: EVENING_MINIMUM - ONCE }, (_unused, round) =>
              appearanceOf(round, Finish.Middle)
            ),
            THEIR_SHARE
          ),
        ])
      );

      const past = pastBefore(historyOf(FIRST_SERIES, TONIGHT));

      expect(pastOf(past, OLEG)).toEqual([]);
    });

    it("should leave a player who sat out an earlier evening without one", () => {
      const past = pastBefore(historyOf(FIRST_SERIES, TONIGHT));

      expect(pastOf(past, ANYA)).toEqual([]);
    });

    it("should find nothing behind a table playing its first evening", () => {
      pastBefore(historyOf(TONIGHT));

      expect(sessionAppearancesSpy).not.toHaveBeenCalled();
    });
  });

  describe("pastOf", () => {
    it("should say nothing about somebody the past has never seen", () => {
      expect(pastOf(pastBefore(historyOf(FIRST_SERIES, TONIGHT)), A_STRANGER)).toEqual([]);
    });

    it("should hold no evenings at all when there is no past", () => {
      expect(pastOf(NO_PAST, OLEG)).toEqual([]);
    });
  });
});
