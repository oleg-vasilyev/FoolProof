import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { gameTally } from "#scoresheet/render/session-tally.ts";


export const awardTitle = (award: Award): string => copy.awardTitles[award.name];

export const awardWinner = (names: readonly string[]): string =>
  names.join(copy.betweenWinners);

export const awardReason = (award: Award): string => {
  switch (award.name) {
    case "king":
      return copy.kingReason(award.percent, gameTally(award.games));

    case "untouchable":
      return copy.untouchableReason(gameTally(award.games));

    case "teflon":
      return copy.teflonReason(award.streak);

    case "sweetRevenge":
      return copy.sweetRevengeReason(award.fools, award.comebacks);

    case "ironSeat":
      return copy.ironSeatReason(gameTally(award.games));

    case "theTruce":
      return copy.truceReason(gameTally(award.draws), gameTally(award.games));

    case "allOrNothing":
      return copy.allOrNothingReason(award.edges, gameTally(award.games));

    case "theInvisible":
      return copy.invisibleReason(award.middles, gameTally(award.games));

    case "theIrishGoodbye":
      return copy.irishGoodbyeReason(award.leftAfter, gameTally(award.games));

    case "encore":
      return copy.encoreReason(award.run);

    case "dealersCurse":
      return copy.dealersCurseReason(award.deals, award.burns);

    case "firstBlood":
      return copy.firstBloodReason(gameTally(award.games));

    case "foolOfTheNight":
      return copy.foolReason(award.fools, gameTally(award.games));
  }
};
