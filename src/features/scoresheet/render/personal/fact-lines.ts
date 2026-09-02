import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import {
  eveningTally,
  gameTally,
  gamesAcross,
  gamesOf,
  timeTally,
} from "#scoresheet/render/tally-phrases.ts";
import { percentLabel } from "#scoresheet/render/percent-label.ts";
import { sessionDate } from "#scoresheet/render/session-date.ts";
import type { Copy } from "#scoresheet/copy.ts";


const THE_FIRST_EVENING_ITSELF = 1;

export interface FactLines {
  readonly title: string;
  readonly holder: string;
  readonly holderId: number | null;
  readonly reason: string;
}

export const holderIdOf = (fact: CareerFact): number | null =>
  "rivalId" in fact ? fact.rivalId : null;

interface Body {
  readonly holder: string;
  readonly reason: string;
}

const bodyOf = (copy: Copy, fact: CareerFact): Body => {
  switch (fact.name) {
    case CareerFactName.TheBlinder:
      return {
        holder: sessionDate(copy, fact.playedOn),
        reason: copy.blinderReason(timeTally(copy, fact.firsts), gamesAcross(copy, fact.games)),
      };

    case CareerFactName.TheNightmare:
      return {
        holder: sessionDate(copy, fact.playedOn),
        reason: copy.nightmareReason(timeTally(copy, fact.burns), gamesAcross(copy, fact.games)),
      };

    case CareerFactName.TheCharm:
    case CareerFactName.TheJinx:
      return {
        holder: fact.rival,
        reason: copy.alongsideReason(
          fact.burns,
          gamesAcross(copy, fact.games),
          fact.usualBurns
        ),
      };

    case CareerFactName.ThePatsy:
      return {
        holder: fact.rival,
        reason: copy.patsyReason(fact.won, timeTally(copy, fact.duels)),
      };

    case CareerFactName.TheBogey:
      return {
        holder: fact.rival,
        reason: copy.bogeyReason(fact.lost, timeTally(copy, fact.duels)),
      };

    case CareerFactName.BigTableCharm:
    case CareerFactName.BigTableCurse:
      return {
        holder: copy.atTableOf(fact.seats),
        reason: copy.atSizeReason(fact.burns, gamesAcross(copy, fact.games), fact.usualBurns),
      };

    case CareerFactName.OpenersGift:
      return {
        holder: timeTally(copy, fact.opens),
        reason: copy.firstMoveGiftReason(fact.firsts),
      };

    case CareerFactName.OpenersCurse:
      return {
        holder: timeTally(copy, fact.opens),
        reason: copy.firstMoveCurseReason(fact.burns),
      };

    case CareerFactName.TheHomecoming:
      return {
        holder: sessionDate(copy, fact.playedOn),
        reason: copy.homecomingReason(eveningTally(copy, fact.missed)),
      };

    case CareerFactName.NeverWentFirst:
      return {
        holder: copy.neverWentFirstHolder(gameTally(copy, fact.games)),
        reason: copy.neverWentFirstReason,
      };

    case CareerFactName.TheHeadStart:
      return {
        holder: timeTally(copy, fact.opens),
        reason: copy.headStartReason(gamesOf(copy, fact.games)),
      };

    case CareerFactName.TheBadPatch:
      return {
        holder: copy.badPatchHolder(gameTally(copy, fact.games)),
        reason: copy.betweenDates(sessionDate(copy, fact.from), sessionDate(copy, fact.until)),
      };

    case CareerFactName.TheCleanRun:
      return {
        holder: copy.cleanRunHolder(gameTally(copy, fact.games)),
        reason: copy.betweenDates(sessionDate(copy, fact.from), sessionDate(copy, fact.until)),
      };

    case CareerFactName.TheSurvivor:
    case CareerFactName.LightningRod:
      return {
        holder: timeTally(copy, fact.burns),
        reason: copy.againstTheSeatReason(
          gamesOf(copy, fact.games),
          percentLabel(fact.expected),
          percentLabel(fact.rate)
        ),
      };

    case CareerFactName.EverPresent:
      return {
        holder: eveningTally(copy, fact.evenings),
        reason: copy.everPresentReason,
      };

    case CareerFactName.FoundingMember:
      return {
        holder: sessionDate(copy, fact.playedOn),
        reason: copy.foundingReason(
          eveningTally(copy, fact.evenings - THE_FIRST_EVENING_ITSELF)
        ),
      };

    case CareerFactName.TheNewcomer:
      return {
        holder: gameTally(copy, fact.games),
        reason: copy.newcomerReason(eveningTally(copy, fact.evenings)),
      };
  }
};

export const factLines = (copy: Copy, fact: CareerFact): FactLines => ({
  title: copy.factTitles[fact.name],
  holderId: holderIdOf(fact),
  ...bodyOf(copy, fact),
});
