import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { gameTally } from "#scoresheet/render/session-tally.ts";


export const awardTitle = (copy: Copy, award: Award): string => copy.awardTitles[award.name];

export const awardWinner = (copy: Copy, names: readonly string[], wholeTable: boolean): string =>
  wholeTable ? copy.everyWinner : names.join(copy.betweenWinners);

export const awardReason = (copy: Copy, award: Award): string => {
  switch (award.name) {
    case AwardName.King:
      return award.passed
        ? copy.kingPassedReason(award.percent, gameTally(copy, award.games))
        : copy.kingReason(award.percent, gameTally(copy, award.games));

    case AwardName.WireToWire:
      return copy.wireToWireReason(gameTally(copy, award.games));

    case AwardName.TheFavourite:
      return copy.favouriteReason(award.firsts, gameTally(copy, award.games));

    case AwardName.HatTrick:
      return copy.hatTrickReason(award.run);

    case AwardName.HomeAdvantage:
      return copy.homeAdvantageReason(award.wins, award.opens);

    case AwardName.Untouchable:
      return copy.untouchableReason(gameTally(copy, award.games));

    case AwardName.Teflon:
      return copy.teflonReason(award.streak);

    case AwardName.HotSeat:
      return copy.hotSeatReason(award.opens);

    case AwardName.TheComeback:
      return copy.comebackReason(award.sank, award.percent);

    case AwardName.TheLadder:
      return copy.ladderReason(award.run);

    case AwardName.SweetRevenge:
      return copy.sweetRevengeReason(award.fools, award.comebacks);

    case AwardName.IronSeat:
      return copy.ironSeatReason(gameTally(copy, award.games));

    case AwardName.TheTruce:
      return copy.truceReason(award.draws, gameTally(copy, award.games));

    case AwardName.ThePacifist:
      return copy.pacifistReason(gameTally(copy, award.draws));

    case AwardName.TheNemesis:
      return copy.nemesisReason(gameTally(copy, award.over));

    case AwardName.TheDoorman:
      return copy.doormanReason(award.opens, gameTally(copy, award.games));

    case AwardName.NeverAsked:
      return copy.neverAskedReason(gameTally(copy, award.games));

    case AwardName.TheLatecomer:
      return copy.latecomerReason(award.joinedAt, award.percent);

    case AwardName.RevolvingDoor:
      return copy.revolvingDoorReason(gameTally(copy, award.missed), gameTally(copy, award.games));

    case AwardName.TheCameo:
      return copy.cameoReason(gameTally(copy, award.games));

    case AwardName.SecondWind:
      return copy.secondWindReason(award.burnedBy, gameTally(copy, award.games));

    case AwardName.TheUnderstudy:
      return copy.understudyReason(award.seconds, gameTally(copy, award.games));

    case AwardName.TheFlatline:
      return copy.flatlineReason(award.band, gameTally(copy, award.games));

    case AwardName.TheInvisible:
      return copy.invisibleReason(award.middles, gameTally(copy, award.games));

    case AwardName.GroundhogDay:
      return copy.groundhogReason(award.place, award.run);

    case AwardName.ThePendulum:
      return copy.pendulumReason(award.run);

    case AwardName.TheRollercoaster:
      return copy.rollercoasterReason(award.swing, gameTally(copy, award.games));

    case AwardName.AllOrNothing:
      return copy.allOrNothingReason(award.edges, gameTally(copy, award.games));

    case AwardName.TheIrishGoodbye:
      return copy.irishGoodbyeReason(award.leftAfter, gameTally(copy, award.games));

    case AwardName.TheAnchor:
      return copy.anchorReason(gameTally(copy, award.games));

    case AwardName.TheSlide:
      return copy.slideReason(award.run);

    case AwardName.FalseDawn:
      return copy.falseDawnReason(award.ledAt, award.percent);

    case AwardName.OpenersCurse:
      return copy.openersCurseReason(award.opens, award.burns);

    case AwardName.Encore:
      return copy.encoreReason(award.run);

    case AwardName.FirstBlood:
      return copy.firstBloodReason(gameTally(copy, award.games));

    case AwardName.FoolOfTheNight:
      return copy.foolReason(award.fools, gameTally(copy, award.games));
  }
};
