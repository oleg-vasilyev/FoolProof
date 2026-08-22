import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { gameTally, gamesAcross, gamesOf, timeTally } from "#scoresheet/render/tally-phrases.ts";


export const awardTitle = (copy: Copy, award: Award): string => copy.awardTitles[award.name];

export const awardWinner = (copy: Copy, names: readonly string[], wholeTable: boolean): string =>
  wholeTable ? copy.everyWinner : names.join(copy.betweenWinners);

export const awardReason = (copy: Copy, award: Award): string => {
  switch (award.name) {
    case AwardName.King:
      return award.passed
        ? copy.kingPassedReason(award.percent, gamesAcross(copy, award.games))
        : copy.kingReason(award.percent, gamesAcross(copy, award.games));

    case AwardName.WireToWire:
      return copy.wireToWireReason(gamesAcross(copy, award.games));

    case AwardName.TheFavourite:
      return copy.favouriteReason(award.firsts, gamesOf(copy, award.games));

    case AwardName.HatTrick:
      return copy.hatTrickReason(gameTally(copy, award.run));

    case AwardName.HomeAdvantage:
      return copy.homeAdvantageReason(award.wins, award.opens);

    case AwardName.Untouchable:
      return copy.untouchableReason(gameTally(copy, award.games));

    case AwardName.Teflon:
      return copy.teflonReason(gamesAcross(copy, award.streak));

    case AwardName.HotSeat:
      return copy.hotSeatReason(award.opens);

    case AwardName.TheComeback:
      return copy.comebackReason(award.sank, award.percent);

    case AwardName.TheLadder:
      return copy.ladderReason(gameTally(copy, award.run));

    case AwardName.SweetRevenge:
      return copy.sweetRevengeReason(
        timeTally(copy, award.fools),
        timeTally(copy, award.comebacks)
      );

    case AwardName.IronSeat:
      return copy.ironSeatReason(gameTally(copy, award.games));

    case AwardName.TheTruce:
      return copy.truceReason(award.draws, gamesOf(copy, award.games));

    case AwardName.ThePacifist:
      return copy.pacifistReason(gameTally(copy, award.draws));

    case AwardName.TheNemesis:
      return copy.nemesisReason(gameTally(copy, award.over));

    case AwardName.TheDoorman:
      return copy.doormanReason(award.opens, gamesOf(copy, award.games));

    case AwardName.NeverAsked:
      return copy.neverAskedReason(gameTally(copy, award.games));

    case AwardName.TheLatecomer:
      return copy.latecomerReason(award.joinedAt, award.percent);

    case AwardName.RevolvingDoor:
      return copy.revolvingDoorReason(award.missed, gameTally(copy, award.games));

    case AwardName.TheCameo:
      return copy.cameoReason(gamesOf(copy, award.games));

    case AwardName.SecondWind:
      return copy.secondWindReason(award.burnedBy, gamesAcross(copy, award.games));

    case AwardName.TheUnderstudy:
      return copy.understudyReason(timeTally(copy, award.seconds), gamesAcross(copy, award.games));

    case AwardName.TheFlatline:
      return copy.flatlineReason(award.band, gamesAcross(copy, award.games));

    case AwardName.TheInvisible:
      return copy.invisibleReason(award.middles, gamesOf(copy, award.games));

    case AwardName.GroundhogDay:
      return copy.groundhogReason(award.place, gameTally(copy, award.run));

    case AwardName.ThePendulum:
      return copy.pendulumReason(gameTally(copy, award.run));

    case AwardName.TheRollercoaster:
      return copy.rollercoasterReason(award.swing, gamesAcross(copy, award.games));

    case AwardName.AllOrNothing:
      return copy.allOrNothingReason(award.edges, gamesOf(copy, award.games));

    case AwardName.TheIrishGoodbye:
      return copy.irishGoodbyeReason(award.leftAfter, gamesOf(copy, award.games));

    case AwardName.TheAnchor:
      return copy.anchorReason(gameTally(copy, award.games));

    case AwardName.TheSlide:
      return copy.slideReason(gameTally(copy, award.run));

    case AwardName.FalseDawn:
      return copy.falseDawnReason(award.ledAt, award.percent);

    case AwardName.OpenersCurse:
      return copy.openersCurseReason(award.opens, award.burns);

    case AwardName.Encore:
      return copy.encoreReason(gameTally(copy, award.run));

    case AwardName.FirstBlood:
      return copy.firstBloodReason;

    case AwardName.FoolOfTheNight:
      return copy.foolReason(award.fools, gamesOf(copy, award.games));
  }
};
