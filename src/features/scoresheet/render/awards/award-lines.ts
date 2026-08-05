import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { gameTally } from "#scoresheet/render/session-tally.ts";


export const awardTitle = (award: Award): string => copy.awardTitles[award.name];

export const awardWinner = (names: readonly string[]): string =>
  names.join(copy.betweenWinners);

export const awardReason = (award: Award): string => {
  switch (award.name) {
    case AwardName.King:
      return copy.kingReason(award.percent, gameTally(award.games));

    case AwardName.Untouchable:
      return copy.untouchableReason(gameTally(award.games));

    case AwardName.Teflon:
      return copy.teflonReason(award.streak);

    case AwardName.SweetRevenge:
      return copy.sweetRevengeReason(award.fools, award.comebacks);

    case AwardName.IronSeat:
      return copy.ironSeatReason(gameTally(award.games));

    case AwardName.TheTruce:
      return copy.truceReason(gameTally(award.draws), gameTally(award.games));

    case AwardName.AllOrNothing:
      return copy.allOrNothingReason(award.edges, gameTally(award.games));

    case AwardName.TheInvisible:
      return copy.invisibleReason(award.middles, gameTally(award.games));

    case AwardName.TheIrishGoodbye:
      return copy.irishGoodbyeReason(award.leftAfter, gameTally(award.games));

    case AwardName.Encore:
      return copy.encoreReason(award.run);

    case AwardName.DealersCurse:
      return copy.dealersCurseReason(award.deals, award.burns);

    case AwardName.FirstBlood:
      return copy.firstBloodReason(gameTally(award.games));

    case AwardName.FoolOfTheNight:
      return copy.foolReason(award.fools, gameTally(award.games));
  }
};
