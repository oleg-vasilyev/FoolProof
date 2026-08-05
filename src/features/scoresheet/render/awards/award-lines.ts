import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { gameTally } from "#scoresheet/render/session-tally.ts";


export const awardTitle = (copy: Copy, award: Award): string => copy.awardTitles[award.name];

export const awardWinner = (copy: Copy, names: readonly string[]): string =>
  names.join(copy.betweenWinners);

export const awardReason = (copy: Copy, award: Award): string => {
  switch (award.name) {
    case AwardName.King:
      return copy.kingReason(award.percent, gameTally(copy, award.games));

    case AwardName.Untouchable:
      return copy.untouchableReason(gameTally(copy, award.games));

    case AwardName.Teflon:
      return copy.teflonReason(award.streak);

    case AwardName.SweetRevenge:
      return copy.sweetRevengeReason(award.fools, award.comebacks);

    case AwardName.IronSeat:
      return copy.ironSeatReason(gameTally(copy, award.games));

    case AwardName.TheTruce:
      return copy.truceReason(gameTally(copy, award.draws), gameTally(copy, award.games));

    case AwardName.AllOrNothing:
      return copy.allOrNothingReason(award.edges, gameTally(copy, award.games));

    case AwardName.TheInvisible:
      return copy.invisibleReason(award.middles, gameTally(copy, award.games));

    case AwardName.TheIrishGoodbye:
      return copy.irishGoodbyeReason(award.leftAfter, gameTally(copy, award.games));

    case AwardName.Encore:
      return copy.encoreReason(award.run);

    case AwardName.DealersCurse:
      return copy.dealersCurseReason(award.deals, award.burns);

    case AwardName.FirstBlood:
      return copy.firstBloodReason(gameTally(copy, award.games));

    case AwardName.FoolOfTheNight:
      return copy.foolReason(award.fools, gameTally(copy, award.games));
  }
};
