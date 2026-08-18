import { CareerFactName, RAREST_FIRST, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { theBogey, theCharm, theJinx, thePatsy } from "#scoresheet/domain/career/facts/rival-facts.ts";
import { neverDealt, openersCurse, openersGift, theHeadStart } from "#scoresheet/domain/career/facts/opening-facts.ts";
import { bigTableCharm, bigTableCurse } from "#scoresheet/domain/career/facts/table-facts.ts";
import { theBlinder, theNightmare } from "#scoresheet/domain/career/facts/night-facts.ts";
import { lightningRod, theSurvivor } from "#scoresheet/domain/career/facts/seat-facts.ts";
import { theBadPatch, theCleanRun } from "#scoresheet/domain/career/facts/run-facts.ts";
import {
  everPresent,
  foundingMember,
  theHomecoming,
  theNewcomer,
} from "#scoresheet/domain/career/facts/attendance-facts.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";


type FactRule = (subject: CareerSubject) => CareerFact | null;

const RULES_IN_ORDER: readonly FactRule[] = [
  theBlinder,
  theNightmare,
  theCharm,
  theJinx,
  thePatsy,
  theBogey,
  bigTableCharm,
  bigTableCurse,
  openersGift,
  openersCurse,
  theHomecoming,
  neverDealt,
  theHeadStart,
  theBadPatch,
  theCleanRun,
  theSurvivor,
  lightningRod,
  everPresent,
  foundingMember,
  theNewcomer,
];

interface Overshadowing {
  readonly lesser: CareerFactName;
  readonly greater: CareerFactName;
}

const OVERSHADOWED: readonly Overshadowing[] = [
  { lesser: CareerFactName.TheBogey, greater: CareerFactName.TheJinx },
  { lesser: CareerFactName.ThePatsy, greater: CareerFactName.TheCharm },
];

const rivalIn = (fact: CareerFact): string | null => ("rival" in fact ? fact.rival : null);

const aboutTheSame = (fact: CareerFact, other: CareerFact): boolean => {
  const named = rivalIn(fact);

  return named !== null && named === rivalIn(other);
};

const saysNothingNew = (fact: CareerFact, fired: readonly CareerFact[]): boolean =>
  OVERSHADOWED.some(
    ({ lesser, greater }) =>
      fact.name === lesser &&
      fired.some((other) => other.name === greater && aboutTheSame(fact, other))
  );

const rarestFirst = (one: CareerFact, other: CareerFact): number =>
  RAREST_FIRST.indexOf(one.name) - RAREST_FIRST.indexOf(other.name);

export const careerFacts = (subject: CareerSubject): readonly CareerFact[] => {
  const fired = RULES_IN_ORDER.flatMap((rule) => rule(subject) ?? []);

  return [...fired.filter((fact) => !saysNothingNew(fact, fired))].sort(rarestFirst);
};
