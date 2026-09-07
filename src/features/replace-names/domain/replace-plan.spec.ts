import { beforeEach, describe, expect, it, vi } from "vitest";
import { Refusal } from "#replace-names/domain/replace-states.ts";
import type { Evening, PlayerRecord, PlayerTally } from "#shared/repository/repository-contract.ts";


const normalizeNameSpy = vi.fn((name: string) => name);

vi.mock("#shared/table/name-list.ts", () => ({
  normalizeName: (name: string) => normalizeNameSpy(name),
}));

const { planReplacement, recheck } = await import("#replace-names/domain/replace-plan.ts");

const CHAT_ID = -100777;

const ROMA_ID = 1;

const OLEG_ID = 3;

const ROMANI_ID = 6;

const FIRST_GAME = 87;

const SECOND_GAME = 88;

const ANOTHER_FIRST_GAME = 99;

const ELEVEN_GAMES = 11;

const player = (id: number, display_name: string): PlayerRecord => ({
  id,
  chat_id: CHAT_ID,
  display_name,
});

const tally = (playerId: number, displayName: string, games: number): PlayerTally => ({
  playerId,
  displayName,
  games,
});

const ROMA = player(ROMA_ID, "Рома");

const OLEG = player(OLEG_ID, "Олег");

const ROMANI = player(ROMANI_ID, "Романи");

const ROSTER = [ROMA, OLEG, ROMANI];

const ROMA_TONIGHT = tally(ROMA_ID, "Рома", ELEVEN_GAMES);

const OLEG_TONIGHT = tally(OLEG_ID, "Олег", ELEVEN_GAMES);

const EVENING: Evening = {
  startedOn: "2026-09-04",
  firstGameId: FIRST_GAME,
  gameIds: [FIRST_GAME, SECOND_GAME],
  players: [OLEG_TONIGHT, ROMA_TONIGHT],
};

describe("replace-plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    normalizeNameSpy.mockImplementation((name: string) => name);
  });

  describe("planReplacement()", () => {
    it("should refuse no names at all, before looking at the evening", () => {
      expect(planReplacement(null, ROSTER, [])).toEqual({
        ok: false,
        because: Refusal.NotTwoNames,
      });
    });

    it("should refuse a single name, before looking at the evening", () => {
      expect(planReplacement(null, ROSTER, ["Рома"])).toEqual({
        ok: false,
        because: Refusal.NotTwoNames,
      });
    });

    it("should refuse a third name even when the first two would have made a plan", () => {
      expect(planReplacement(EVENING, ROSTER, ["Рома", "Романи", "Олег"])).toEqual({
        ok: false,
        because: Refusal.NotTwoNames,
      });
    });

    it("should refuse when nothing has been recorded yet", () => {
      expect(planReplacement(null, ROSTER, ["Рома", "Романи"])).toEqual({
        ok: false,
        because: Refusal.NoEvening,
      });
    });

    it("should refuse a written name that did not sit down this evening, handing back the evening and both names", () => {
      expect(planReplacement(EVENING, ROSTER, ["Романи", "Рома"])).toEqual({
        ok: false,
        because: Refusal.NotThisEvening,
        evening: EVENING,
        written: "Романи",
        played: "Рома",
      });
    });

    it("should refuse when the one who really played sat at the same table", () => {
      expect(planReplacement(EVENING, ROSTER, ["Рома", "Олег"])).toEqual({
        ok: false,
        because: Refusal.AlsoPlayed,
        evening: EVENING,
        written: "Рома",
        played: "Олег",
      });
    });

    it("should plan a known arrival by their roster id and roster spelling", () => {
      expect(planReplacement(EVENING, ROSTER, ["Рома", "Романи"])).toEqual({
        ok: true,
        plan: {
          evening: EVENING,
          leaving: ROMA_TONIGHT,
          arriving: { playerId: ROMANI_ID, displayName: "Романи" },
        },
      });
    });

    it("should plan a new arrival with no id and the name as typed", () => {
      expect(planReplacement(EVENING, ROSTER, ["Рома", "Гена"])).toEqual({
        ok: true,
        plan: {
          evening: EVENING,
          leaving: ROMA_TONIGHT,
          arriving: { playerId: null, displayName: "Гена" },
        },
      });
    });

    it("should match every name through the shared normaliser, on both sides", () => {
      normalizeNameSpy.mockImplementation((name: string) => name.toLowerCase());

      const planned = planReplacement(EVENING, ROSTER, ["РОМА", "РОМАНИ"]);

      expect(planned).toMatchObject({ ok: true });
      expect(normalizeNameSpy).toHaveBeenCalledWith("РОМА");
      expect(normalizeNameSpy).toHaveBeenCalledWith("Рома");
      expect(normalizeNameSpy).toHaveBeenCalledWith("РОМАНИ");
      expect(normalizeNameSpy).toHaveBeenCalledWith("Романи");
    });

    it("should keep the roster spelling for a known arrival, not the typed one", () => {
      normalizeNameSpy.mockImplementation((name: string) => name.toLowerCase());

      const planned = planReplacement(EVENING, ROSTER, ["Рома", "РОМАНИ"]);

      expect(planned).toMatchObject({ plan: { arriving: { displayName: "Романи" } } });
    });
  });

  describe("recheck()", () => {
    const PAYLOAD = { firstGameId: FIRST_GAME, fromId: ROMA_ID, toId: ROMANI_ID };

    it("should confirm the plan against the evening as it stands now", () => {
      expect(recheck(EVENING, ROSTER, PAYLOAD)).toEqual({
        ok: true,
        evening: EVENING,
        leaving: ROMA_TONIGHT,
        arriving: ROMANI,
      });
    });

    it("should call the screen stale when the evening is gone", () => {
      expect(recheck(null, ROSTER, PAYLOAD)).toEqual({ ok: false, because: Refusal.ScreenStale });
    });

    it("should call the screen stale when a newer evening has begun", () => {
      const later = { ...EVENING, firstGameId: ANOTHER_FIRST_GAME, gameIds: [ANOTHER_FIRST_GAME] };

      expect(recheck(later, ROSTER, PAYLOAD)).toEqual({ ok: false, because: Refusal.ScreenStale });
    });

    it("should call the screen stale when the leaving player is no longer in the evening", () => {
      const without = { ...EVENING, players: [OLEG_TONIGHT] };

      expect(recheck(without, ROSTER, PAYLOAD)).toEqual({ ok: false, because: Refusal.ScreenStale });
    });

    it("should call the screen stale when the arriving player has been swept away", () => {
      expect(recheck(EVENING, [ROMA, OLEG], PAYLOAD)).toEqual({
        ok: false,
        because: Refusal.ScreenStale,
      });
    });

    it("should call the screen stale when the arriving player has since sat down this evening", () => {
      const both = { ...EVENING, players: [...EVENING.players, tally(ROMANI_ID, "Романи", 1)] };

      expect(recheck(both, ROSTER, PAYLOAD)).toEqual({ ok: false, because: Refusal.ScreenStale });
    });
  });
});
