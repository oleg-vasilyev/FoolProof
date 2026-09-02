import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { atLeast, atMost, usualOver } from "#scoresheet/domain/career/facts/binomial-tail.ts";
import { notablePick } from "#scoresheet/domain/career/facts/notable-pick.ts";
import type { CareerGame, Finalist } from "#shared/repository/repository-contract.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";
import type { Rare } from "#scoresheet/domain/career/facts/rarest-of.ts";


const NOTHING = 0;

const ONE_PLACE = 1;

const ALONE = 1;

const HALVES = 2;

export const ENOUGH_DUELS = 6;

export const ENOUGH_TOGETHER = 12;

interface Pairing {
  readonly rivalId: number;
  readonly rival: string;
  readonly duels: number;
  readonly lost: number;
  readonly together: number;
  readonly burns: number;
}

const lastPlaceIn = (placements: readonly Finalist[]): number =>
  placements.reduce((furthest, placement) => Math.max(furthest, placement.position), NOTHING);

const placeOf = (placements: readonly Finalist[], playerId: number): number | null =>
  placements.find((placement) => placement.playerId === playerId)?.position ?? null;

const sharing = (placements: readonly Finalist[], position: number): number =>
  placements.filter((placement) => placement.position === position).length;

const wasDrawn = (placements: readonly Finalist[]): boolean =>
  sharing(placements, lastPlaceIn(placements)) > ALONE;

const burnedIn = (placements: readonly Finalist[], playerId: number): boolean =>
  !wasDrawn(placements) && placeOf(placements, playerId) === lastPlaceIn(placements);

interface Standing {
  readonly game: CareerGame;
  readonly mine: number;
}

const endedHeadsUp = (standing: Standing, rivalId: number): boolean => {
  const theirs = placeOf(standing.game.placements, rivalId);
  const last = lastPlaceIn(standing.game.placements);

  return theirs !== null && standing.mine >= last - ONE_PLACE && theirs >= last - ONE_PLACE;
};

const pairingWith = (
  standings: readonly Standing[],
  playerId: number,
  rivalId: number,
  rival: string
): Pairing => {
  const duelled = standings.filter((standing) => endedHeadsUp(standing, rivalId));
  const shared = standings.filter(
    (standing) => placeOf(standing.game.placements, rivalId) !== null
  );

  return {
    rivalId,
    rival,
    duels: duelled.length,
    lost: duelled.filter((standing) => burnedIn(standing.game.placements, playerId)).length,
    together: shared.length,
    burns: shared.filter((standing) => burnedIn(standing.game.placements, playerId)).length,
  };
};

const standingsOf = (subject: CareerSubject): readonly Standing[] =>
  subject.history.games.flatMap((game) => {
    const mine = placeOf(game.placements, subject.career.playerId);

    return mine === null || wasDrawn(game.placements) ? [] : [{ game, mine }];
  });

const pairings = (subject: CareerSubject): readonly Pairing[] => {
  const standings = standingsOf(subject);

  return subject.history.players
    .filter((player) => player.playerId !== subject.career.playerId)
    .map((player) =>
      pairingWith(standings, subject.career.playerId, player.playerId, player.displayName)
    );
};

const duelled = (subject: CareerSubject): readonly Pairing[] =>
  pairings(subject).filter((pairing) => pairing.duels >= ENOUGH_DUELS);

type DuelMerit = (pairing: Pairing) => number;

const outranks = (challenger: Pairing, holder: Pairing, meritOf: DuelMerit): boolean => {
  const theirs = meritOf(challenger);
  const held = meritOf(holder);

  return (
    theirs > held ||
    (theirs === held && challenger.duels > holder.duels) ||
    (theirs === held && challenger.duels === holder.duels && challenger.rival < holder.rival)
  );
};

const chiefBy = (subject: CareerSubject, meritOf: DuelMerit): Pairing | null =>
  duelled(subject).reduce<Pairing | null>(
    (holder, challenger) =>
      holder === null || outranks(challenger, holder, meritOf) ? challenger : holder,
    null
  );

const lostTo: DuelMerit = (pairing) => pairing.lost;

const wonAgainst: DuelMerit = (pairing) => pairing.duels - pairing.lost;

const wonTheSeries = (pairing: Pairing, merit: DuelMerit): boolean =>
  merit(pairing) > pairing.duels / HALVES;

export const theBogey = (subject: CareerSubject): CareerFact | null => {
  const chief = chiefBy(subject, lostTo);

  return chief === null || !wonTheSeries(chief, lostTo)
    ? null
    : {
        name: CareerFactName.TheBogey,
        rivalId: chief.rivalId,
        rival: chief.rival,
        duels: chief.duels,
        lost: chief.lost,
      };
};

export const thePatsy = (subject: CareerSubject): CareerFact | null => {
  const chief = chiefBy(subject, wonAgainst);

  return chief === null || !wonTheSeries(chief, wonAgainst)
    ? null
    : {
        name: CareerFactName.ThePatsy,
        rivalId: chief.rivalId,
        rival: chief.rival,
        duels: chief.duels,
        won: chief.duels - chief.lost,
      };
};

const alongsideField = (
  subject: CareerSubject,
  name: typeof CareerFactName.TheJinx | typeof CareerFactName.TheCharm,
  tailOf: (pairing: Pairing, usual: number) => number
): readonly Rare<CareerFact>[] =>
  pairings(subject)
    .filter((pairing) => pairing.together >= ENOUGH_TOGETHER)
    .map((pairing) => ({
      fact: {
        name,
        rivalId: pairing.rivalId,
        rival: pairing.rival,
        games: pairing.together,
        burns: pairing.burns,
        usualBurns: usualOver(subject.tally.foolRate, pairing.together),
      },
      tail: tailOf(pairing, subject.tally.foolRate),
    }));

export const theJinx = (subject: CareerSubject): CareerFact | null =>
  notablePick(
    alongsideField(subject, CareerFactName.TheJinx, (pairing, usual) =>
      atLeast(pairing.burns, pairing.together, usual)
    )
  );

export const theCharm = (subject: CareerSubject): CareerFact | null =>
  notablePick(
    alongsideField(subject, CareerFactName.TheCharm, (pairing, usual) =>
      atMost(pairing.burns, pairing.together, usual)
    )
  );
