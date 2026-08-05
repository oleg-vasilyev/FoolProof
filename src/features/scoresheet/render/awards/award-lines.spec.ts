import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwardName, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";


const gameTallySpy = vi.fn();

vi.mock("#scoresheet/render/session-tally.ts", () => ({
  gameTally: (games: number) => gameTallySpy(games),
}));

const { awardReason, awardTitle, awardWinner } = await import(
  "#scoresheet/render/awards/award-lines.ts"
);

const tallyOf = (games: number): string => `tally(${String(games)})`;

const WINNER = 1;

describe("award-lines", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    gameTallySpy.mockImplementation((games: number) => tallyOf(games));
  });

  describe("awardTitle()", () => {
    const NAMES: readonly AwardName[] = [
      "king",
      "untouchable",
      "teflon",
      "sweetRevenge",
      "ironSeat",
      "theTruce",
      "allOrNothing",
      "theInvisible",
      "theIrishGoodbye",
      "encore",
      "dealersCurse",
      "firstBlood",
      "foolOfTheNight",
    ];

    it.each(NAMES)("should look up %s in the copy table", (name) => {
      const award = { name, winners: [WINNER] } as unknown as Award;

      expect(awardTitle(award)).toBe(copy.awardTitles[name]);
    });
  });

  describe("awardWinner()", () => {
    it("should print a single name untouched", () => {
      expect(awardWinner(["Oleg"])).toBe("Oleg");
    });

    it("should join several names with the copy's own separator", () => {
      const names = ["Oleg", "Anya", "Roma"];

      expect(awardWinner(names)).toBe(names.join(copy.betweenWinners));
    });
  });

  describe("awardReason()", () => {
    it("should give the king their percent and a tally of the games", () => {
      const PERCENT = 62;
      const GAMES = 9;
      const award: Award = { name: AwardName.King, winners: [WINNER], percent: PERCENT, games: GAMES };

      const reason = awardReason(award);

      expect(reason).toContain(String(PERCENT));
      expect(reason).toContain(tallyOf(GAMES));
      expect(gameTallySpy).toHaveBeenCalledWith(GAMES);
    });

    it("should give the untouchable a tally of the games, not the raw count", () => {
      const GAMES = 6;
      const award: Award = { name: AwardName.Untouchable, winners: [WINNER], games: GAMES };

      const reason = awardReason(award);

      expect(reason).toContain(tallyOf(GAMES));
      expect(reason).not.toContain(`${String(GAMES)} games`);
    });

    it("should give teflon their raw streak, with no tally involved", () => {
      const STREAK = 7;
      const award: Award = { name: AwardName.Teflon, winners: [WINNER], streak: STREAK };

      const reason = awardReason(award);

      expect(reason).toContain(String(STREAK));
      expect(gameTallySpy).not.toHaveBeenCalled();
    });

    it("should give sweet revenge the raw fools and comebacks, with no tally involved", () => {
      const FOOLS = 3;
      const COMEBACKS = 2;
      const award: Award = {
        name: AwardName.SweetRevenge,
        winners: [WINNER],
        fools: FOOLS,
        comebacks: COMEBACKS,
      };

      const reason = awardReason(award);

      expect(reason).toContain(String(FOOLS));
      expect(reason).toContain(String(COMEBACKS));
      expect(gameTallySpy).not.toHaveBeenCalled();
    });

    it("should give iron seat a tally of the games", () => {
      const GAMES = 11;
      const award: Award = { name: AwardName.IronSeat, winners: [WINNER], games: GAMES };

      const reason = awardReason(award);

      expect(reason).toContain(tallyOf(GAMES));
      expect(gameTallySpy).toHaveBeenCalledWith(GAMES);
    });

    it("should give the truce a tally of both the draws and the games", () => {
      const DRAWS = 2;
      const GAMES = 8;
      const award: Award = { name: AwardName.TheTruce, winners: [WINNER], draws: DRAWS, games: GAMES };

      const reason = awardReason(award);

      expect(reason).toContain(tallyOf(DRAWS));
      expect(reason).toContain(tallyOf(GAMES));
      expect(gameTallySpy).toHaveBeenCalledWith(DRAWS);
      expect(gameTallySpy).toHaveBeenCalledWith(GAMES);
    });

    it("should give all or nothing the raw edges and a tally of the games", () => {
      const EDGES = 4;
      const GAMES = 10;
      const award: Award = { name: AwardName.AllOrNothing, winners: [WINNER], edges: EDGES, games: GAMES };

      const reason = awardReason(award);

      expect(reason).toContain(String(EDGES));
      expect(reason).toContain(tallyOf(GAMES));
    });

    it("should give the invisible the raw middles and a tally of the games", () => {
      const MIDDLES = 5;
      const GAMES = 12;
      const award: Award = {
        name: AwardName.TheInvisible,
        winners: [WINNER],
        middles: MIDDLES,
        games: GAMES,
      };

      const reason = awardReason(award);

      expect(reason).toContain(String(MIDDLES));
      expect(reason).toContain(tallyOf(GAMES));
    });

    it("should give the irish goodbye the raw departure game and a tally of the games", () => {
      const LEFT_AFTER = 3;
      const GAMES = 9;
      const award: Award = {
        name: AwardName.TheIrishGoodbye,
        winners: [WINNER],
        leftAfter: LEFT_AFTER,
        games: GAMES,
      };

      const reason = awardReason(award);

      expect(reason).toContain(String(LEFT_AFTER));
      expect(reason).toContain(tallyOf(GAMES));
    });

    it("should give encore the raw run, with no tally involved", () => {
      const RUN = 4;
      const award: Award = { name: AwardName.Encore, winners: [WINNER], run: RUN };

      const reason = awardReason(award);

      expect(reason).toContain(String(RUN));
      expect(gameTallySpy).not.toHaveBeenCalled();
    });

    it("should give the dealer's curse the raw deals and burns, with no tally involved", () => {
      const DEALS = 6;
      const BURNS = 2;
      const award: Award = { name: AwardName.DealersCurse, winners: [WINNER], deals: DEALS, burns: BURNS };

      const reason = awardReason(award);

      expect(reason).toContain(String(DEALS));
      expect(reason).toContain(String(BURNS));
      expect(gameTallySpy).not.toHaveBeenCalled();
    });

    it("should give first blood a tally of the games", () => {
      const GAMES = 5;
      const award: Award = { name: AwardName.FirstBlood, winners: [WINNER], games: GAMES };

      const reason = awardReason(award);

      expect(reason).toContain(tallyOf(GAMES));
      expect(gameTallySpy).toHaveBeenCalledWith(GAMES);
    });

    it("should give fool of the night the raw fool count and a tally of the games", () => {
      const FOOLS = 4;
      const GAMES = 9;
      const award: Award = {
        name: AwardName.FoolOfTheNight,
        winners: [WINNER],
        fools: FOOLS,
        games: GAMES,
      };

      const reason = awardReason(award);

      expect(reason).toContain(String(FOOLS));
      expect(reason).toContain(tallyOf(GAMES));
    });
  });
});
