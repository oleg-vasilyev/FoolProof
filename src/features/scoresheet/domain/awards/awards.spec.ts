import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName, EVENING_MINIMUM } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { EveningPast } from "#scoresheet/domain/awards/evening-past.ts";


const eveningOfSpy = vi.fn();

const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  sessionAppearances: (chronology: unknown) => eveningOfSpy(chronology),
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

type RuleSpy = Mock<(evening: unknown) => unknown>;

const ruleSpies: Record<AwardName, RuleSpy> = Object.fromEntries(
  Object.values(AwardName).map((name) => [name, vi.fn()])
) as Record<AwardName, RuleSpy>;

const tableCurseSpy = vi.fn();

const ruleFor =
  (name: AwardName) =>
  (evening: unknown): unknown =>
    ruleSpies[name](evening);

vi.mock("#scoresheet/domain/awards/share-awards.ts", () => ({
  kingOfTheTable: ruleFor(AwardName.King),
  foolOfTheNight: ruleFor(AwardName.FoolOfTheNight),
}));

vi.mock("#scoresheet/domain/awards/position-awards.ts", () => ({
  untouchable: ruleFor(AwardName.Untouchable),
  theFavourite: ruleFor(AwardName.TheFavourite),
  theUnderstudy: ruleFor(AwardName.TheUnderstudy),
  theAnchor: ruleFor(AwardName.TheAnchor),
  allOrNothing: ruleFor(AwardName.AllOrNothing),
  theInvisible: ruleFor(AwardName.TheInvisible),
}));

vi.mock("#scoresheet/domain/awards/streak-awards.ts", () => ({
  teflon: ruleFor(AwardName.Teflon),
  sweetRevenge: ruleFor(AwardName.SweetRevenge),
  encore: ruleFor(AwardName.Encore),
  secondWind: ruleFor(AwardName.SecondWind),
}));

vi.mock("#scoresheet/domain/awards/attendance-awards.ts", () => ({
  ironSeat: ruleFor(AwardName.IronSeat),
  theIrishGoodbye: ruleFor(AwardName.TheIrishGoodbye),
  revolvingDoor: ruleFor(AwardName.RevolvingDoor),
  theLatecomer: ruleFor(AwardName.TheLatecomer),
  theCameo: ruleFor(AwardName.TheCameo),
  firstBlood: ruleFor(AwardName.FirstBlood),
}));

vi.mock("#scoresheet/domain/awards/opener-awards.ts", () => ({
  openersCurse: ruleFor(AwardName.OpenersCurse),
  hotSeat: ruleFor(AwardName.HotSeat),
  theDoorman: ruleFor(AwardName.TheDoorman),
  homeAdvantage: ruleFor(AwardName.HomeAdvantage),
  neverAsked: ruleFor(AwardName.NeverAsked),
  tableCurse: (evening: unknown) => tableCurseSpy(evening),
}));

vi.mock("#scoresheet/domain/awards/run-awards.ts", () => ({
  hatTrick: ruleFor(AwardName.HatTrick),
  theLadder: ruleFor(AwardName.TheLadder),
  theSlide: ruleFor(AwardName.TheSlide),
  thePendulum: ruleFor(AwardName.ThePendulum),
  groundhogDay: ruleFor(AwardName.GroundhogDay),
}));

vi.mock("#scoresheet/domain/awards/chart-awards.ts", () => ({
  wireToWire: ruleFor(AwardName.WireToWire),
  theRollercoaster: ruleFor(AwardName.TheRollercoaster),
  theComeback: ruleFor(AwardName.TheComeback),
  falseDawn: ruleFor(AwardName.FalseDawn),
  theFlatline: ruleFor(AwardName.TheFlatline),
}));

vi.mock("#scoresheet/domain/awards/table-awards.ts", () => ({
  theTruce: ruleFor(AwardName.TheTruce),
  thePacifist: ruleFor(AwardName.ThePacifist),
}));

vi.mock("#scoresheet/domain/awards/rivalry-awards.ts", () => ({
  theNemesis: ruleFor(AwardName.TheNemesis),
}));

vi.mock("#scoresheet/domain/awards/standing-awards.ts", () => ({
  theViceroy: ruleFor(AwardName.TheViceroy),
  theKingslayer: ruleFor(AwardName.TheKingslayer),
  theLastStand: ruleFor(AwardName.TheLastStand),
  theirHour: ruleFor(AwardName.TheirHour),
  theHalfNight: ruleFor(AwardName.TheHalfNight),
}));

vi.mock("#scoresheet/domain/awards/past-awards.ts", () => ({
  personalBest: ruleFor(AwardName.PersonalBest),
  firstCleanNight: ruleFor(AwardName.FirstCleanNight),
  firstWin: ruleFor(AwardName.FirstWin),
  newAtTheTable: ruleFor(AwardName.NewAtTheTable),
}));

const { gamesShortOfAwards, honoursFor } = await import(
  "#scoresheet/domain/awards/awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const MOST_AWARDS = 9;

const ROMANI = 6;

const OLEG = 3;

const SOME_EVENING = { rounds: NOTHING, players: [], starters: [] };

const NO_PAST: EveningPast = { players: [] };

const seatedAs = (...playerIds: readonly number[]) => ({
  rounds: EVENING_MINIMUM,
  players: playerIds.map((playerId) => ({
    playerId,
    share: NOTHING,
    running: [],
    appearances: [{ round: NOTHING, finish: Finish.Middle, position: ONCE, tableSize: ONCE }],
  })),
  starters: [],
});

const CURSE = { burns: ONCE, games: EVENING_MINIMUM, predicted: NOTHING };

const awardOf = (name: AwardName, winner = OLEG): Award =>
  ({ name, winners: [winner], games: NOTHING, percent: NOTHING }) as unknown as Award;

const chronologyOf = (games: number) => ({
  startedOn: "2026-07-31",
  players: [],
  games: Array.from({ length: games }, (_unused, index) => ({
    gameId: index,
    starterId: null,
    placements: [],
  })),
});

const ENOUGH = chronologyOf(EVENING_MINIMUM);

const fires = (...names: readonly AwardName[]): void => {
  for (const name of names) {
    ruleSpies[name].mockReturnValue(awardOf(name));
  }
};

const firesFor = (name: AwardName, winner: number): void => {
  ruleSpies[name].mockReturnValue(awardOf(name, winner));
};

const pairedUp = (
  playerIds: readonly number[],
  names: readonly AwardName[]
): readonly (readonly [number, AwardName])[] =>
  playerIds.flatMap((playerId, at) => {
    const name = names[at];

    return name === undefined ? [] : [[playerId, name] as const];
  });

const oneAwardEach = (...pairs: readonly (readonly [number, AwardName])[]): void => {
  for (const [playerId, name] of pairs) {
    ruleSpies[name].mockReturnValue(awardOf(name, playerId));
  }
};

const firesShared = (name: AwardName, one: number, other: number): void => {
  ruleSpies[name].mockReturnValue({
    ...awardOf(name, one),
    winners: [one, other],
  } as unknown as Award);
};

const everyRuleFires = (): void => {
  fires(...Object.values(AwardName));
};

const namesOf = (games = ENOUGH): readonly string[] =>
  honoursFor(games, NO_PAST)?.awards.map((award) => award.name) ?? [];

beforeEach(() => {
  vi.clearAllMocks();

  eveningOfSpy.mockReturnValue(SOME_EVENING);
  playedGamesSpy.mockReturnValue(EVENING_MINIMUM);
  tableCurseSpy.mockReturnValue(null);

  for (const spy of Object.values(ruleSpies)) {
    spy.mockReturnValue(null);
  }
});

describe("honoursFor()", () => {
  it("should refuse an evening one game short", () => {
    expect(honoursFor(chronologyOf(EVENING_MINIMUM - ONCE), NO_PAST)).toBeNull();
  });

  it("should accept an evening of exactly five games", () => {
    expect(honoursFor(ENOUGH, NO_PAST)).not.toBeNull();
  });

  it("should read the evening out of the chronology once", () => {
    honoursFor(ENOUGH, NO_PAST);

    expect(eveningOfSpy).toHaveBeenCalledWith(ENOUGH);
    expect(eveningOfSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should judge every rule against that same evening", () => {
    honoursFor(ENOUGH, NO_PAST);

    for (const spy of Object.values(ruleSpies)) {
      expect(spy).toHaveBeenCalledWith(SOME_EVENING);
    }
  });

  it("should leave out the rules that did not fire", () => {
    fires(AwardName.Teflon);

    expect(namesOf()).toEqual([AwardName.Teflon]);
  });

  it("should print the awards from glory to disgrace", () => {
    fires(AwardName.OpenersCurse, AwardName.King, AwardName.IronSeat);

    expect(namesOf()).toEqual([AwardName.King, AwardName.IronSeat, AwardName.OpenersCurse]);
  });

  it("should keep the fool of the night last, however early it was judged", () => {
    ruleSpies[AwardName.FoolOfTheNight].mockReturnValue(awardOf(AwardName.FoolOfTheNight, ROMANI));
    fires(AwardName.King);

    expect(namesOf()).toEqual([AwardName.King, AwardName.FoolOfTheNight]);
  });

  it("should hand over the table's own fact alongside the awards", () => {
    tableCurseSpy.mockReturnValue(CURSE);

    expect(honoursFor(ENOUGH, NO_PAST)?.curse).toBe(CURSE);
  });

  describe("when more rules fire than fit on the card", () => {
    it("should print no more than nine", () => {
      everyRuleFires();

      expect(namesOf()).toHaveLength(MOST_AWARDS);
    });

    it("should keep the king of the table, common as it is", () => {
      everyRuleFires();

      expect(namesOf()[NOTHING]).toBe(AwardName.King);
    });

    it("should keep the fool of the night even when the card is full", () => {
      everyRuleFires();

      expect(namesOf().at(-ONCE)).toBe(AwardName.FoolOfTheNight);
    });

    it("should fill the free slots with the rarest of what fired", () => {
      everyRuleFires();

      expect(namesOf()).toEqual([
        AwardName.King,
        AwardName.FirstWin,
        AwardName.TheComeback,
        AwardName.NewAtTheTable,
        AwardName.TheHalfNight,
        AwardName.TheCameo,
        AwardName.TheAnchor,
        AwardName.FalseDawn,
        AwardName.FoolOfTheNight,
      ]);
    });

    it("should drop the favourite when the king of the table is the same player", () => {
      fires(AwardName.King, AwardName.TheFavourite);

      expect(namesOf()).toEqual([AwardName.King]);
    });

    it("should keep the favourite when somebody else sat highest", () => {
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.TheFavourite, ROMANI);

      expect(namesOf()).toEqual([AwardName.King, AwardName.TheFavourite]);
    });

    it("should drop a shared award the king already speaks for, not only a solo one", () => {
      firesFor(AwardName.King, OLEG);
      firesShared(AwardName.TheFavourite, OLEG, ROMANI);

      expect(namesOf()).toEqual([AwardName.King]);
    });

    it("should hand the last row back to rarity once everybody who fired has one", () => {
      firesFor(AwardName.TheComeback, OLEG);
      firesFor(AwardName.TheCameo, OLEG);
      firesFor(AwardName.Encore, ROMANI);

      expect(namesOf()).toEqual([
        AwardName.TheComeback,
        AwardName.TheCameo,
        AwardName.Encore,
      ]);
    });

    it("should not let one player hold every row while another holds none", () => {
      fires(
        AwardName.TheComeback,
        AwardName.TheFlatline,
        AwardName.TheCameo,
        AwardName.TheLatecomer,
        AwardName.TheAnchor,
        AwardName.TheSlide,
        AwardName.FalseDawn,
        AwardName.TheRollercoaster,
        AwardName.ThePendulum
      );
      firesFor(AwardName.Encore, ROMANI);

      expect(namesOf()).toContain(AwardName.Encore);
    });

    it("should drop the commonest of what fired rather than the last one judged", () => {
      fires(
        AwardName.King,
        AwardName.FoolOfTheNight,
        AwardName.Untouchable,
        AwardName.Encore,
        AwardName.AllOrNothing,
        AwardName.TheIrishGoodbye,
        AwardName.TheTruce,
        AwardName.HotSeat,
        AwardName.ThePendulum,
        AwardName.TheLadder
      );

      expect(namesOf()).toContain(AwardName.TheLadder);
      expect(namesOf()).not.toContain(AwardName.Encore);
    });

    it("should find a row for a player the fool's plate is the only word about", () => {
      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI));
      fires(
        AwardName.FirstWin,
        AwardName.FirstCleanNight,
        AwardName.NewAtTheTable,
        AwardName.PersonalBest,
        AwardName.FalseDawn,
        AwardName.TheFlatline,
        AwardName.TheComeback,
        AwardName.TheCameo
      );
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, ROMANI);
      firesFor(AwardName.TheLastStand, ROMANI);

      expect(namesOf()).toContain(AwardName.TheLastStand);
    });

    it("should spend that row on the commonest award rather than drop it", () => {
      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI));
      fires(AwardName.FirstWin, AwardName.PersonalBest);
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, ROMANI);
      firesFor(AwardName.TheLastStand, ROMANI);

      expect(namesOf()).toEqual([
        AwardName.King,
        AwardName.FirstWin,
        AwardName.TheLastStand,
        AwardName.FoolOfTheNight,
      ]);
    });

    it("should count the king's own row as having spoken for him", () => {
      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI));
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.TheCameo, OLEG);
      firesFor(AwardName.TheLastStand, ROMANI);

      expect(namesOf()).toEqual([
        AwardName.King,
        AwardName.TheCameo,
        AwardName.TheLastStand,
      ]);
    });

    it("should carry on when a player fired nothing at all", () => {
      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI));
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.TheCameo, OLEG);

      expect(namesOf()).toEqual([AwardName.King, AwardName.TheCameo]);
    });

    it("should never spend one award on two players' guarantees", () => {
      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI));
      firesShared(AwardName.TheTruce, OLEG, ROMANI);

      expect(namesOf().filter((name) => name === AwardName.TheTruce)).toHaveLength(ONCE);
    });

    it("should let one shared award speak for everybody it names", () => {
      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI));
      firesShared(AwardName.TheTruce, OLEG, ROMANI);

      expect(namesOf()).toEqual([AwardName.TheTruce]);
    });

    it("should serve a full table fewest-stories-first, and run out of rows on the busiest", () => {
      const BUSY = 13;
      const ONE_AWARD_EACH = [
        AwardName.FirstWin,
        AwardName.TheFlatline,
        AwardName.TheComeback,
        AwardName.TheCameo,
        AwardName.TheAnchor,
        AwardName.TheSlide,
        AwardName.SweetRevenge,
      ];
      const THE_BUSIEST_PLAYERS_OWN = [
        AwardName.NewAtTheTable,
        AwardName.TheHalfNight,
        AwardName.FalseDawn,
      ];
      const QUIET_PLAYERS = [14, 15, 16, 17, 18, 19, 20];

      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI, BUSY, ...QUIET_PLAYERS));
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, ROMANI);

      for (const name of THE_BUSIEST_PLAYERS_OWN) {
        firesFor(name, BUSY);
      }

      oneAwardEach(...pairedUp(QUIET_PLAYERS, ONE_AWARD_EACH));

      const printed = namesOf();

      expect(printed).toHaveLength(MOST_AWARDS);
      expect([...printed].sort()).toEqual(
        [AwardName.King, AwardName.FoolOfTheNight, ...ONE_AWARD_EACH].sort()
      );
    });

    it("should keep the fool's plate out of the rows the rarity pass has to fill", () => {
      const THIRD = 13;
      const A_FOURTH = 14;
      const ROMANI_OWN = [
        AwardName.FirstWin,
        AwardName.TheFlatline,
        AwardName.TheCameo,
        AwardName.TheSlide,
      ];
      const THE_THIRD_PLAYERS_OWN = [
        AwardName.TheComeback,
        AwardName.TheAnchor,
        AwardName.SweetRevenge,
        AwardName.ThePacifist,
      ];

      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI, THIRD, A_FOURTH));
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, A_FOURTH);
      firesShared(AwardName.TheTruce, ROMANI, THIRD);

      for (const name of ROMANI_OWN) {
        firesFor(name, ROMANI);
      }

      for (const name of THE_THIRD_PLAYERS_OWN) {
        firesFor(name, THIRD);
      }

      const printed = namesOf();

      expect(printed).toHaveLength(MOST_AWARDS);
      expect(new Set(printed).size).toBe(MOST_AWARDS);
    });

    it("should spend no guaranteed row on the king, whose crown already speaks for him", () => {
      const ONE_AWARD_EACH = [
        AwardName.FirstWin,
        AwardName.TheFlatline,
        AwardName.TheComeback,
        AwardName.TheCameo,
        AwardName.TheAnchor,
        AwardName.TheSlide,
        AwardName.SweetRevenge,
        AwardName.ThePacifist,
      ];
      const QUIET_PLAYERS = [13, 14, 15, 16, 17, 18, 19, 20];

      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI, ...QUIET_PLAYERS));
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, ROMANI);
      firesFor(AwardName.TheHalfNight, OLEG);
      oneAwardEach(...pairedUp(QUIET_PLAYERS, ONE_AWARD_EACH));

      expect(namesOf()).not.toContain(AwardName.TheHalfNight);
    });

    it("should still hand out the guarantees on a night nobody was king", () => {
      const LAST_IN_ORDER = 20;
      const EARLIER_PLAYERS = [12, 13, 14, 15, 16, 17, 18, 19];
      const ONE_AWARD_EACH = [
        AwardName.TheHalfNight,
        AwardName.FirstWin,
        AwardName.TheFlatline,
        AwardName.TheComeback,
        AwardName.TheCameo,
        AwardName.TheAnchor,
        AwardName.TheSlide,
        AwardName.SweetRevenge,
      ];

      eveningOfSpy.mockReturnValue(seatedAs(...EARLIER_PLAYERS, LAST_IN_ORDER, ROMANI));
      firesFor(AwardName.FoolOfTheNight, ROMANI);
      firesFor(AwardName.NewAtTheTable, LAST_IN_ORDER);
      oneAwardEach(...pairedUp(EARLIER_PLAYERS, ONE_AWARD_EACH));

      expect([...namesOf()].sort()).toEqual(
        [AwardName.FoolOfTheNight, ...ONE_AWARD_EACH].sort()
      );
    });

    it("should promise no row to a player who sat the whole evening out", () => {
      const SAT_OUT = 13;
      const ONE_AWARD_EACH = [
        AwardName.FirstWin,
        AwardName.TheFlatline,
        AwardName.TheComeback,
        AwardName.TheCameo,
        AwardName.TheAnchor,
        AwardName.TheSlide,
        AwardName.SweetRevenge,
      ];
      const QUIET_PLAYERS = [14, 15, 16, 17, 18, 19, 20];

      eveningOfSpy.mockReturnValue(seatedAs(SAT_OUT, OLEG, ROMANI, ...QUIET_PLAYERS));
      playedGamesSpy.mockImplementation((player: { readonly playerId: number }) =>
        player.playerId === SAT_OUT ? NOTHING : EVENING_MINIMUM
      );
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, ROMANI);
      firesFor(AwardName.TheHalfNight, SAT_OUT);
      oneAwardEach(...pairedUp(QUIET_PLAYERS, ONE_AWARD_EACH));

      expect([...namesOf()].sort()).toEqual(
        [AwardName.King, AwardName.FoolOfTheNight, ...ONE_AWARD_EACH].sort()
      );
    });

    it("should count a shared row against the winner it has already said most about", () => {
      const SHARES_WITH_ROMANI = 13;

      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI, SHARES_WITH_ROMANI, 14, 15, 16));
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, ROMANI);
      firesShared(AwardName.TheTruce, ROMANI, SHARES_WITH_ROMANI);
      oneAwardEach(
        [ROMANI, AwardName.NewAtTheTable],
        [ROMANI, AwardName.TheHalfNight],
        [SHARES_WITH_ROMANI, AwardName.FalseDawn],
        [14, AwardName.FirstWin],
        [14, AwardName.Encore],
        [15, AwardName.TheFlatline],
        [16, AwardName.TheComeback]
      );

      const printed = namesOf();

      expect(printed).toContain(AwardName.Encore);
      expect(printed).not.toContain(AwardName.TheTruce);
    });

    it("should count the king's own row when the rarity pass spreads what is left", () => {
      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI, 13, 14, 15, 16, 17));
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, ROMANI);
      oneAwardEach(
        [OLEG, AwardName.Encore],
        [ROMANI, AwardName.NewAtTheTable],
        [ROMANI, AwardName.TheHalfNight],
        [13, AwardName.FalseDawn],
        [14, AwardName.FirstWin],
        [15, AwardName.TheFlatline],
        [16, AwardName.TheComeback],
        [17, AwardName.TheCameo]
      );

      const printed = namesOf();

      expect(printed).toContain(AwardName.TheHalfNight);
      expect(printed).not.toContain(AwardName.Encore);
    });

    it("should let a shared row speak for both winners' guarantees, never one each", () => {
      const ONE_WINNER = 13;
      const THE_OTHER = 14;

      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI, ONE_WINNER, THE_OTHER, 15, 16, 17, 18, 19));
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.FoolOfTheNight, ROMANI);
      firesShared(AwardName.TheCameo, ONE_WINNER, THE_OTHER);
      oneAwardEach(
        [ONE_WINNER, AwardName.Encore],
        [THE_OTHER, AwardName.TheLastStand],
        [15, AwardName.FalseDawn],
        [16, AwardName.FirstWin],
        [17, AwardName.TheFlatline],
        [18, AwardName.TheComeback],
        [19, AwardName.TheAnchor]
      );

      const printed = namesOf();

      expect(printed).toContain(AwardName.Encore);
      expect(printed).not.toContain(AwardName.TheLastStand);
    });

    it("should give the row to the player the card has said least about", () => {
      eveningOfSpy.mockReturnValue(seatedAs(OLEG, ROMANI));
      firesFor(AwardName.TheCameo, OLEG);
      firesFor(AwardName.TheFlatline, OLEG);
      firesFor(AwardName.Encore, ROMANI);

      expect(namesOf()).toContain(AwardName.Encore);
    });

    it("should drop the pendulum when the same player led the chart all evening", () => {
      firesFor(AwardName.WireToWire, OLEG);
      firesFor(AwardName.ThePendulum, OLEG);

      expect(namesOf()).toEqual([AwardName.WireToWire]);
    });

    it("should keep the pendulum when somebody else led the chart", () => {
      firesFor(AwardName.WireToWire, OLEG);
      firesFor(AwardName.ThePendulum, ROMANI);

      expect(namesOf()).toContain(AwardName.ThePendulum);
    });

    it("should drop the flatline when the same player took the crown", () => {
      firesFor(AwardName.King, OLEG);
      firesFor(AwardName.TheFlatline, OLEG);

      expect(namesOf()).toEqual([AwardName.King]);
    });

    it("should still print the rarest in the catalogue's order, not in the rarity order", () => {
      fires(AwardName.TheLadder, AwardName.Untouchable);

      expect(namesOf()).toEqual([AwardName.Untouchable, AwardName.TheLadder]);
    });

    it("should still print nine when there is no fool of the night to pin", () => {
      everyRuleFires();
      ruleSpies[AwardName.FoolOfTheNight].mockReturnValue(null);

      expect(namesOf()).toHaveLength(MOST_AWARDS);
    });

    it("should still print nine when nobody was king either", () => {
      everyRuleFires();
      ruleSpies[AwardName.FoolOfTheNight].mockReturnValue(null);
      ruleSpies[AwardName.King].mockReturnValue(null);

      expect(namesOf()).toHaveLength(MOST_AWARDS);
    });
  });

  describe("an award that says nothing the card does not already say", () => {
    it("should drop the hot seat when the same player also took home advantage", () => {
      fires(AwardName.HotSeat, AwardName.HomeAdvantage);

      expect(namesOf()).toEqual([AwardName.HomeAdvantage]);
    });

    it("should drop first blood when the same player's second wind already told it", () => {
      fires(AwardName.FirstBlood, AwardName.SecondWind);

      expect(namesOf()).toEqual([AwardName.SecondWind]);
    });

    it("should keep first blood when the second wind belongs to somebody else", () => {
      ruleSpies[AwardName.FirstBlood].mockReturnValue(awardOf(AwardName.FirstBlood, OLEG));
      ruleSpies[AwardName.SecondWind].mockReturnValue(awardOf(AwardName.SecondWind, ROMANI));

      expect(namesOf()).toEqual([AwardName.SecondWind, AwardName.FirstBlood]);
    });

    it("should keep the hot seat when it names somebody else", () => {
      ruleSpies[AwardName.HotSeat].mockReturnValue(awardOf(AwardName.HotSeat, ROMANI));
      fires(AwardName.HomeAdvantage);

      expect(namesOf()).toEqual([AwardName.HomeAdvantage, AwardName.HotSeat]);
    });

    it("should keep the hot seat when nobody won a game they opened", () => {
      fires(AwardName.HotSeat);

      expect(namesOf()).toEqual([AwardName.HotSeat]);
    });

    it("should drop the invisible when the king's own row names the same player", () => {
      fires(AwardName.TheInvisible, AwardName.King);

      expect(namesOf()).toEqual([AwardName.King]);
    });

    it("should keep the invisible when somebody else was king", () => {
      firesFor(AwardName.TheInvisible, ROMANI);
      firesFor(AwardName.King, OLEG);

      expect(namesOf()).toEqual([AwardName.King, AwardName.TheInvisible]);
    });

    it("should drop the ladder when the comeback already tells that player's climb", () => {
      fires(AwardName.TheLadder, AwardName.TheComeback);

      expect(namesOf()).toEqual([AwardName.TheComeback]);
    });

    it("should keep the ladder when the comeback belongs to somebody else", () => {
      firesFor(AwardName.TheLadder, OLEG);
      firesFor(AwardName.TheComeback, ROMANI);

      expect(namesOf()).toEqual([AwardName.TheComeback, AwardName.TheLadder]);
    });

    it("should not let the dropped award take a slot from a rarer one", () => {
      fires(
        AwardName.King,
        AwardName.FoolOfTheNight,
        AwardName.HotSeat,
        AwardName.HomeAdvantage,
        AwardName.Untouchable,
        AwardName.TheFavourite,
        AwardName.AllOrNothing,
        AwardName.TheIrishGoodbye,
        AwardName.TheTruce,
        AwardName.TheInvisible
      );

      expect(namesOf()).toContain(AwardName.Untouchable);
    });
  });

  describe("first blood", () => {
    it("should be dropped when it would name the fool of the night twice", () => {
      ruleSpies[AwardName.FirstBlood].mockReturnValue(awardOf(AwardName.FirstBlood, ROMANI));
      ruleSpies[AwardName.FoolOfTheNight].mockReturnValue(awardOf(AwardName.FoolOfTheNight, ROMANI));

      expect(namesOf()).toEqual([AwardName.FoolOfTheNight]);
    });

    it("should stay when somebody else opened the evening badly", () => {
      ruleSpies[AwardName.FirstBlood].mockReturnValue(awardOf(AwardName.FirstBlood, OLEG));
      ruleSpies[AwardName.FoolOfTheNight].mockReturnValue(awardOf(AwardName.FoolOfTheNight, ROMANI));

      expect(namesOf()).toEqual([AwardName.FirstBlood, AwardName.FoolOfTheNight]);
    });

    it("should stay when nobody was fool of the night at all", () => {
      fires(AwardName.FirstBlood);

      expect(namesOf()).toEqual([AwardName.FirstBlood]);
    });
  });
});

describe("gamesShortOfAwards()", () => {
  it("should ask for the whole threshold when nothing has been played", () => {
    expect(gamesShortOfAwards(NOTHING)).toBe(EVENING_MINIMUM);
  });

  it("should ask for one more game on the evening one game short", () => {
    expect(gamesShortOfAwards(EVENING_MINIMUM - ONCE)).toBe(ONCE);
  });

  it("should ask for nothing on exactly the game that earns the awards", () => {
    expect(gamesShortOfAwards(EVENING_MINIMUM)).toBe(NOTHING);
  });

  it("should ask for nothing rather than a negative on a long evening", () => {
    expect(gamesShortOfAwards(EVENING_MINIMUM + MOST_AWARDS)).toBe(NOTHING);
  });

  it("should count down one for one as the evening goes on", () => {
    const early = gamesShortOfAwards(ONCE);
    const later = gamesShortOfAwards(ONCE + ONCE);

    expect(early - later).toBe(ONCE);
  });

  it("should agree with the threshold the same module refuses on", () => {
    const short = EVENING_MINIMUM - ONCE;

    expect(honoursFor(chronologyOf(short), NO_PAST)).toBeNull();
    expect(gamesShortOfAwards(short)).toBeGreaterThan(NOTHING);
  });
});
