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
