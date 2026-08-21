import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CareerFactName,
  RAREST_FIRST,
  type CareerFact,
} from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";


const theBlinderSpy = vi.fn();

const theNightmareSpy = vi.fn();

const theCharmSpy = vi.fn();

const theJinxSpy = vi.fn();

const thePatsySpy = vi.fn();

const theBogeySpy = vi.fn();

const bigTableCharmSpy = vi.fn();

const bigTableCurseSpy = vi.fn();

const openersGiftSpy = vi.fn();

const openersCurseSpy = vi.fn();

const theHomecomingSpy = vi.fn();

const neverWentFirstSpy = vi.fn();

const theHeadStartSpy = vi.fn();

const theBadPatchSpy = vi.fn();

const theCleanRunSpy = vi.fn();

const theSurvivorSpy = vi.fn();

const lightningRodSpy = vi.fn();

const everPresentSpy = vi.fn();

const foundingMemberSpy = vi.fn();

const theNewcomerSpy = vi.fn();

vi.mock("#scoresheet/domain/career/facts/night-facts.ts", () => ({
  theBlinder: (subject: unknown) => theBlinderSpy(subject),
  theNightmare: (subject: unknown) => theNightmareSpy(subject),
}));

vi.mock("#scoresheet/domain/career/facts/rival-facts.ts", () => ({
  theCharm: (subject: unknown) => theCharmSpy(subject),
  theJinx: (subject: unknown) => theJinxSpy(subject),
  thePatsy: (subject: unknown) => thePatsySpy(subject),
  theBogey: (subject: unknown) => theBogeySpy(subject),
}));

vi.mock("#scoresheet/domain/career/facts/table-facts.ts", () => ({
  bigTableCharm: (subject: unknown) => bigTableCharmSpy(subject),
  bigTableCurse: (subject: unknown) => bigTableCurseSpy(subject),
}));

vi.mock("#scoresheet/domain/career/facts/opening-facts.ts", () => ({
  openersGift: (subject: unknown) => openersGiftSpy(subject),
  openersCurse: (subject: unknown) => openersCurseSpy(subject),
  theHeadStart: (subject: unknown) => theHeadStartSpy(subject),
  neverWentFirst: (subject: unknown) => neverWentFirstSpy(subject),
}));

vi.mock("#scoresheet/domain/career/facts/run-facts.ts", () => ({
  theBadPatch: (subject: unknown) => theBadPatchSpy(subject),
  theCleanRun: (subject: unknown) => theCleanRunSpy(subject),
}));

vi.mock("#scoresheet/domain/career/facts/seat-facts.ts", () => ({
  theSurvivor: (subject: unknown) => theSurvivorSpy(subject),
  lightningRod: (subject: unknown) => lightningRodSpy(subject),
}));

vi.mock("#scoresheet/domain/career/facts/attendance-facts.ts", () => ({
  everPresent: (subject: unknown) => everPresentSpy(subject),
  foundingMember: (subject: unknown) => foundingMemberSpy(subject),
  theHomecoming: (subject: unknown) => theHomecomingSpy(subject),
  theNewcomer: (subject: unknown) => theNewcomerSpy(subject),
}));

const { careerFacts } = await import("#scoresheet/domain/career/facts/career-facts.ts");

const ONCE = 1;

const NOTHING_AT_ALL = 0;

const A_ROUND = 0;

const A_PLACE = 2;

const FOUR_AT_THE_TABLE = 4;

const SIX_AT_THE_TABLE = 6;

const A_NIGHT = 7;

const SOME_GAMES = 14;

const MORE_GAMES = 18;

const SOME_DECIDED = 20;

const SOME_BURNS = 9;

const NO_BURNS = 0;

const SOME_FIRSTS = 4;

const MANY_FIRSTS = 5;

const SOME_OPENS = 11;

const SOME_EVENINGS = 8;

const SOME_DUELS = 12;

const SOME_LOSSES = 10;

const SOME_WINS = 11;

const SOME_MISSED = 4;

const A_FOOL_RATE = 0.42;

const A_FIRST_RATE = 0.18;

const A_SEAT_IN_FOUR = 0.25;

const A_SEAT_IN_FIVE = 0.2;

const AN_OPEN_RATE = 0.31;

const A_SHARE = 0.61;

const OLEG = 1;

const OLEGS_NAME = "Oleg";

const ANYAS_NAME = "Anya";

const BORIS_NAME = "Boris";

const FIRST_DAY = "2026-05-01";

const A_DAY = "2026-05-08";

const ANOTHER_DAY = "2026-05-15";

const A_TALLY: CareerTally = {
  games: SOME_GAMES,
  evenings: SOME_EVENINGS,
  fools: SOME_BURNS,
  decided: SOME_DECIDED,
  foolRate: A_FOOL_RATE,
  seatChanceInDecided: A_SEAT_IN_FOUR,
  firsts: SOME_FIRSTS,
  firstRate: A_FIRST_RATE,
  seatChance: A_SEAT_IN_FIVE,
  opens: SOME_OPENS,
  openRate: AN_OPEN_RATE,
};

const SUBJECT: CareerSubject = {
  history: { players: [], games: [] },
  career: {
    playerId: OLEG,
    displayName: OLEGS_NAME,
    share: A_SHARE,
    appearances: [
      {
        round: A_ROUND,
        finish: Finish.Middle,
        position: A_PLACE,
        tableSize: FOUR_AT_THE_TABLE,
        seriesNo: A_NIGHT,
        playedOn: FIRST_DAY,
        opened: false,
      },
    ],
  },
  tally: A_TALLY,
  nights: [],
};

const jinxOn = (rival: string): CareerFact => ({
  name: CareerFactName.TheJinx,
  rival,
  games: SOME_GAMES,
  burns: SOME_BURNS,
  usual: A_FOOL_RATE,
});

const charmOn = (rival: string): CareerFact => ({
  name: CareerFactName.TheCharm,
  rival,
  games: MORE_GAMES,
  burns: NO_BURNS,
  usual: A_FOOL_RATE,
});

const bogeyOn = (rival: string): CareerFact => ({
  name: CareerFactName.TheBogey,
  rival,
  duels: SOME_DUELS,
  lost: SOME_LOSSES,
});

const patsyOn = (rival: string): CareerFact => ({
  name: CareerFactName.ThePatsy,
  rival,
  duels: SOME_DUELS,
  won: SOME_WINS,
});

const FACTS: Readonly<Record<CareerFactName, CareerFact>> = {
  [CareerFactName.TheBlinder]: {
    name: CareerFactName.TheBlinder,
    playedOn: A_DAY,
    games: SOME_GAMES,
    firsts: MANY_FIRSTS,
  },
  [CareerFactName.TheNightmare]: {
    name: CareerFactName.TheNightmare,
    playedOn: ANOTHER_DAY,
    games: MORE_GAMES,
    burns: SOME_BURNS,
  },
  [CareerFactName.TheCharm]: charmOn(ANYAS_NAME),
  [CareerFactName.TheJinx]: jinxOn(ANYAS_NAME),
  [CareerFactName.ThePatsy]: patsyOn(BORIS_NAME),
  [CareerFactName.TheBogey]: bogeyOn(BORIS_NAME),
  [CareerFactName.BigTableCharm]: {
    name: CareerFactName.BigTableCharm,
    seats: SIX_AT_THE_TABLE,
    games: SOME_GAMES,
    burns: NO_BURNS,
  },
  [CareerFactName.BigTableCurse]: {
    name: CareerFactName.BigTableCurse,
    seats: FOUR_AT_THE_TABLE,
    games: MORE_GAMES,
    burns: SOME_BURNS,
  },
  [CareerFactName.OpenersGift]: {
    name: CareerFactName.OpenersGift,
    opens: SOME_OPENS,
    firsts: MANY_FIRSTS,
  },
  [CareerFactName.OpenersCurse]: {
    name: CareerFactName.OpenersCurse,
    opens: SOME_OPENS,
    burns: SOME_BURNS,
  },
  [CareerFactName.TheHomecoming]: {
    name: CareerFactName.TheHomecoming,
    missed: SOME_MISSED,
    playedOn: A_DAY,
  },
  [CareerFactName.NeverWentFirst]: { name: CareerFactName.NeverWentFirst, games: SOME_GAMES },
  [CareerFactName.TheHeadStart]: {
    name: CareerFactName.TheHeadStart,
    opens: SOME_OPENS,
    games: MORE_GAMES,
  },
  [CareerFactName.TheBadPatch]: {
    name: CareerFactName.TheBadPatch,
    games: SOME_BURNS,
    from: FIRST_DAY,
    until: A_DAY,
  },
  [CareerFactName.TheCleanRun]: {
    name: CareerFactName.TheCleanRun,
    games: SOME_GAMES,
    from: A_DAY,
    until: ANOTHER_DAY,
  },
  [CareerFactName.TheSurvivor]: {
    name: CareerFactName.TheSurvivor,
    games: SOME_DECIDED,
    burns: NO_BURNS,
    expected: A_SEAT_IN_FOUR,
  },
  [CareerFactName.LightningRod]: {
    name: CareerFactName.LightningRod,
    games: SOME_DECIDED,
    burns: SOME_BURNS,
    expected: A_SEAT_IN_FIVE,
  },
  [CareerFactName.EverPresent]: {
    name: CareerFactName.EverPresent,
    evenings: SOME_EVENINGS,
  },
  [CareerFactName.FoundingMember]: {
    name: CareerFactName.FoundingMember,
    playedOn: FIRST_DAY,
    evenings: SOME_EVENINGS,
  },
  [CareerFactName.TheNewcomer]: {
    name: CareerFactName.TheNewcomer,
    evenings: SOME_EVENINGS,
    games: SOME_GAMES,
  },
};

const RULES: Readonly<Record<CareerFactName, ReturnType<typeof vi.fn>>> = {
  [CareerFactName.TheBlinder]: theBlinderSpy,
  [CareerFactName.TheNightmare]: theNightmareSpy,
  [CareerFactName.TheCharm]: theCharmSpy,
  [CareerFactName.TheJinx]: theJinxSpy,
  [CareerFactName.ThePatsy]: thePatsySpy,
  [CareerFactName.TheBogey]: theBogeySpy,
  [CareerFactName.BigTableCharm]: bigTableCharmSpy,
  [CareerFactName.BigTableCurse]: bigTableCurseSpy,
  [CareerFactName.OpenersGift]: openersGiftSpy,
  [CareerFactName.OpenersCurse]: openersCurseSpy,
  [CareerFactName.TheHomecoming]: theHomecomingSpy,
  [CareerFactName.NeverWentFirst]: neverWentFirstSpy,
  [CareerFactName.TheHeadStart]: theHeadStartSpy,
  [CareerFactName.TheBadPatch]: theBadPatchSpy,
  [CareerFactName.TheCleanRun]: theCleanRunSpy,
  [CareerFactName.TheSurvivor]: theSurvivorSpy,
  [CareerFactName.LightningRod]: lightningRodSpy,
  [CareerFactName.EverPresent]: everPresentSpy,
  [CareerFactName.FoundingMember]: foundingMemberSpy,
  [CareerFactName.TheNewcomer]: theNewcomerSpy,
};

const fires = (name: CareerFactName, fact: CareerFact = FACTS[name]): void => {
  RULES[name].mockReturnValue(fact);
};

const namesOut = (facts: readonly CareerFact[]): readonly CareerFactName[] =>
  facts.map((fact) => fact.name);

describe("careerFacts()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    for (const name of RAREST_FIRST) {
      RULES[name].mockReturnValue(null);
    }
  });

  it("should have a rule for every fact the catalogue names", () => {
    expect(Object.keys(RULES).sort()).toEqual([...RAREST_FIRST].sort());
  });

  it("should have a sample fact for every fact the catalogue names", () => {
    expect(Object.keys(FACTS).sort()).toEqual([...RAREST_FIRST].sort());
  });

  it("should ask every rule about the subject it was handed", () => {
    careerFacts(SUBJECT);

    for (const name of RAREST_FIRST) {
      expect(RULES[name]).toHaveBeenCalledWith(SUBJECT);
      expect(RULES[name]).toHaveBeenCalledTimes(ONCE);
    }
  });

  it("should print nothing when no rule found anything", () => {
    expect(careerFacts(SUBJECT)).toHaveLength(NOTHING_AT_ALL);
  });

  it("should print only what the one rule that fired found", () => {
    fires(CareerFactName.TheCleanRun);

    expect(careerFacts(SUBJECT)).toEqual([FACTS[CareerFactName.TheCleanRun]]);
  });

  it("should print the facts rarest first", () => {
    for (const name of RAREST_FIRST) {
      fires(name);
    }

    expect(namesOut(careerFacts(SUBJECT))).toEqual(RAREST_FIRST);
  });

  it("should print the rarer fact first even when the rule that found it ran last", () => {
    fires(CareerFactName.TheNewcomer, FACTS[CareerFactName.TheBlinder]);
    fires(CareerFactName.TheBlinder, FACTS[CareerFactName.TheNewcomer]);

    expect(namesOut(careerFacts(SUBJECT))).toEqual([
      CareerFactName.TheBlinder,
      CareerFactName.TheNewcomer,
    ]);
  });

  it("should drop a bogey when a jinx about the same rival fired", () => {
    fires(CareerFactName.TheJinx, jinxOn(ANYAS_NAME));
    fires(CareerFactName.TheBogey, bogeyOn(ANYAS_NAME));

    expect(careerFacts(SUBJECT)).toEqual([jinxOn(ANYAS_NAME)]);
  });

  it("should keep a bogey about a rival the jinx did not name", () => {
    fires(CareerFactName.TheJinx, jinxOn(ANYAS_NAME));
    fires(CareerFactName.TheBogey, bogeyOn(BORIS_NAME));

    expect(namesOut(careerFacts(SUBJECT))).toEqual([
      CareerFactName.TheJinx,
      CareerFactName.TheBogey,
    ]);
  });

  it("should keep a bogey when no jinx fired at all", () => {
    fires(CareerFactName.TheBogey, bogeyOn(ANYAS_NAME));

    expect(careerFacts(SUBJECT)).toEqual([bogeyOn(ANYAS_NAME)]);
  });

  it("should drop a patsy when a charm about the same rival fired", () => {
    fires(CareerFactName.TheCharm, charmOn(BORIS_NAME));
    fires(CareerFactName.ThePatsy, patsyOn(BORIS_NAME));

    expect(careerFacts(SUBJECT)).toEqual([charmOn(BORIS_NAME)]);
  });

  it("should keep a patsy about a rival the charm did not name", () => {
    fires(CareerFactName.TheCharm, charmOn(ANYAS_NAME));
    fires(CareerFactName.ThePatsy, patsyOn(BORIS_NAME));

    expect(namesOut(careerFacts(SUBJECT))).toEqual([
      CareerFactName.TheCharm,
      CareerFactName.ThePatsy,
    ]);
  });

  it("should not drop a bogey because a charm about that same rival fired", () => {
    fires(CareerFactName.TheCharm, charmOn(ANYAS_NAME));
    fires(CareerFactName.TheBogey, bogeyOn(ANYAS_NAME));

    expect(namesOut(careerFacts(SUBJECT))).toEqual([
      CareerFactName.TheBogey,
      CareerFactName.TheCharm,
    ]);
  });

  it("should keep a fact that names no rival at all", () => {
    fires(CareerFactName.TheJinx, jinxOn(ANYAS_NAME));
    fires(CareerFactName.EverPresent);

    expect(namesOut(careerFacts(SUBJECT))).toEqual([
      CareerFactName.TheJinx,
      CareerFactName.EverPresent,
    ]);
  });
});
