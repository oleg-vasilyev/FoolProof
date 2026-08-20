import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwardName, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";


const gameTallySpy = vi.fn();

const playerTallySpy = vi.fn();

const timeTallySpy = vi.fn();

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
  playerTally: (table: unknown, players: number) => playerTallySpy(table, players),
  timeTally: (table: unknown, times: number) => timeTallySpy(table, times),
}));

const { awardReason, awardTitle, awardWinner } = await import(
  "#scoresheet/render/awards/award-lines.ts"
);

const tallyOf = (games: number): string => `tally(${String(games)})`;

const headcountOf = (players: number): string => `heads(${String(players)})`;

const timesOf = (times: number): string => `times(${String(times)})`;

const WINNER = 1;

const FIRST_FACT = 101;

const SECOND_FACT = 40;

const NAMES: readonly AwardName[] = Object.values(AwardName);

const oneOf = (name: AwardName): number => NAMES.indexOf(name) + FIRST_FACT;

const twoOf = (name: AwardName): number => oneOf(name) + SECOND_FACT;

const SAMPLES: readonly Award[] = [
  { name: AwardName.King, winners: [WINNER], percent: oneOf(AwardName.King), games: twoOf(AwardName.King), passed: false },
  { name: AwardName.WireToWire, winners: [WINNER], games: oneOf(AwardName.WireToWire) },
  { name: AwardName.TheFavourite, winners: [WINNER], firsts: oneOf(AwardName.TheFavourite), games: twoOf(AwardName.TheFavourite) },
  { name: AwardName.HatTrick, winners: [WINNER], run: oneOf(AwardName.HatTrick) },
  { name: AwardName.HomeAdvantage, winners: [WINNER], wins: oneOf(AwardName.HomeAdvantage), opens: twoOf(AwardName.HomeAdvantage) },
  { name: AwardName.Untouchable, winners: [WINNER], games: oneOf(AwardName.Untouchable) },
  { name: AwardName.Teflon, winners: [WINNER], streak: oneOf(AwardName.Teflon) },
  { name: AwardName.HotSeat, winners: [WINNER], opens: oneOf(AwardName.HotSeat) },
  { name: AwardName.TheComeback, winners: [WINNER], percent: oneOf(AwardName.TheComeback), sank: twoOf(AwardName.TheComeback) },
  { name: AwardName.TheLadder, winners: [WINNER], run: oneOf(AwardName.TheLadder) },
  { name: AwardName.SweetRevenge, winners: [WINNER], fools: oneOf(AwardName.SweetRevenge), comebacks: twoOf(AwardName.SweetRevenge) },
  { name: AwardName.IronSeat, winners: [WINNER], games: oneOf(AwardName.IronSeat) },
  { name: AwardName.TheTruce, winners: [WINNER], draws: oneOf(AwardName.TheTruce), games: twoOf(AwardName.TheTruce) },
  { name: AwardName.ThePacifist, winners: [WINNER], draws: oneOf(AwardName.ThePacifist) },
  { name: AwardName.TheNemesis, winners: [WINNER], over: oneOf(AwardName.TheNemesis) },
  { name: AwardName.TheDoorman, winners: [WINNER], opens: oneOf(AwardName.TheDoorman), games: twoOf(AwardName.TheDoorman) },
  { name: AwardName.NeverAsked, winners: [WINNER], games: oneOf(AwardName.NeverAsked) },
  { name: AwardName.TheLatecomer, winners: [WINNER], joinedAt: oneOf(AwardName.TheLatecomer), percent: twoOf(AwardName.TheLatecomer) },
  { name: AwardName.RevolvingDoor, winners: [WINNER], missed: oneOf(AwardName.RevolvingDoor), games: twoOf(AwardName.RevolvingDoor) },
  { name: AwardName.TheCameo, winners: [WINNER], games: oneOf(AwardName.TheCameo) },
  { name: AwardName.SecondWind, winners: [WINNER], burnedBy: oneOf(AwardName.SecondWind), games: twoOf(AwardName.SecondWind) },
  { name: AwardName.TheUnderstudy, winners: [WINNER], seconds: oneOf(AwardName.TheUnderstudy), games: twoOf(AwardName.TheUnderstudy) },
  { name: AwardName.TheFlatline, winners: [WINNER], band: oneOf(AwardName.TheFlatline), games: twoOf(AwardName.TheFlatline) },
  { name: AwardName.TheInvisible, winners: [WINNER], middles: oneOf(AwardName.TheInvisible), games: twoOf(AwardName.TheInvisible) },
  { name: AwardName.GroundhogDay, winners: [WINNER], place: oneOf(AwardName.GroundhogDay), run: twoOf(AwardName.GroundhogDay) },
  { name: AwardName.ThePendulum, winners: [WINNER], run: oneOf(AwardName.ThePendulum) },
  { name: AwardName.TheRollercoaster, winners: [WINNER], swing: oneOf(AwardName.TheRollercoaster), games: twoOf(AwardName.TheRollercoaster) },
  { name: AwardName.AllOrNothing, winners: [WINNER], edges: oneOf(AwardName.AllOrNothing), games: twoOf(AwardName.AllOrNothing) },
  { name: AwardName.TheIrishGoodbye, winners: [WINNER], leftAfter: oneOf(AwardName.TheIrishGoodbye), games: twoOf(AwardName.TheIrishGoodbye) },
  { name: AwardName.TheAnchor, winners: [WINNER], games: oneOf(AwardName.TheAnchor) },
  { name: AwardName.TheSlide, winners: [WINNER], run: oneOf(AwardName.TheSlide) },
  { name: AwardName.FalseDawn, winners: [WINNER], ledAt: oneOf(AwardName.FalseDawn), percent: twoOf(AwardName.FalseDawn) },
  { name: AwardName.OpenersCurse, winners: [WINNER], opens: oneOf(AwardName.OpenersCurse), burns: twoOf(AwardName.OpenersCurse) },
  { name: AwardName.Encore, winners: [WINNER], run: oneOf(AwardName.Encore) },
  { name: AwardName.FirstBlood, winners: [WINNER], games: oneOf(AwardName.FirstBlood) },
  { name: AwardName.FoolOfTheNight, winners: [WINNER], fools: oneOf(AwardName.FoolOfTheNight), games: twoOf(AwardName.FoolOfTheNight) },
];

const factsIn = (award: Award): readonly number[] =>
  Object.values(award).filter((fact): fact is number => typeof fact === "number");

describe("award-lines", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    gameTallySpy.mockImplementation((_table: unknown, games: number) => tallyOf(games));
    timeTallySpy.mockImplementation((_table: unknown, times: number) => timesOf(times));
    playerTallySpy.mockImplementation((_table: unknown, players: number) => headcountOf(players));
  });

  describe("awardTitle()", () => {
    it.each(NAMES)("should look up %s in the copy table", (name) => {
      const award = { name, winners: [WINNER] } as unknown as Award;

      expect(awardTitle(copy, award)).toBe(copy.awardTitles[name]);
    });
  });

  describe("awardWinner()", () => {
    const SOME_OF_THEM = false;

    const ALL_OF_THEM = true;

    it("should print a single name untouched", () => {
      expect(awardWinner(copy, ["Oleg"], SOME_OF_THEM)).toBe("Oleg");
    });

    it("should join several names with the copy's own separator", () => {
      const names = ["Oleg", "Anya", "Roma"];

      expect(awardWinner(copy, names, SOME_OF_THEM)).toBe(names.join(copy.betweenWinners));
    });

    it("should name the table rather than list it when the winners are everybody", () => {
      const names = ["Oleg", "Anya", "Roma", "Dima"];

      expect(awardWinner(copy, names, ALL_OF_THEM)).toBe(copy.everyWinner);
    });

    it("should say so even when the whole table is two people", () => {
      expect(awardWinner(copy, ["Oleg", "Anya"], ALL_OF_THEM)).toBe(copy.everyWinner);
    });
  });

  describe("awardReason()", () => {
    it("should have a sample for every award the catalogue names", () => {
      expect(SAMPLES.map((award) => award.name).sort()).toEqual([...NAMES].sort());
    });

    it.each(SAMPLES)("should print every fact $name was earned on", (award) => {
      const reason = awardReason(copy, award);

      for (const fact of factsIn(award)) {
        expect(reason, String(fact)).toContain(String(fact));
      }
    });

    it("should give every award a justification of its own", () => {
      const reasons = SAMPLES.map((award) => awardReason(copy, award));

      expect(new Set(reasons).size).toBe(SAMPLES.length);
    });

    it.each(SAMPLES)("should route $name to a justification that fits its facts", (award) => {
      expect(awardReason(copy, award)).not.toContain("undefined");
    });

    it("should give the untouchable a tally of the games, not the raw count", () => {
      const award: Award = {
        name: AwardName.Untouchable,
        winners: [WINNER],
        games: oneOf(AwardName.Untouchable),
      };

      const reason = awardReason(copy, award);

      expect(reason).toContain(tallyOf(oneOf(AwardName.Untouchable)));
      expect(gameTallySpy).toHaveBeenCalledWith(copy, oneOf(AwardName.Untouchable));
    });

    it("should give teflon its raw streak, with no tally involved", () => {
      awardReason(copy, {
        name: AwardName.Teflon,
        winners: [WINNER],
        streak: oneOf(AwardName.Teflon),
      });

      expect(gameTallySpy).not.toHaveBeenCalled();
    });

    it("should give the truce its draws raw and tally only the games", () => {
      const award: Award = {
        name: AwardName.TheTruce,
        winners: [WINNER],
        draws: oneOf(AwardName.TheTruce),
        games: twoOf(AwardName.TheTruce),
      };

      const reason = awardReason(copy, award);

      expect(reason).toContain(tallyOf(twoOf(AwardName.TheTruce)));
      expect(reason).not.toContain(tallyOf(oneOf(AwardName.TheTruce)));
      expect(gameTallySpy).toHaveBeenCalledTimes(1);
    });

  });
});
