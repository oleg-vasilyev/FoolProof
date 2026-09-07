import { Refusal } from "#replace-names/domain/replace-states.ts";
import type { Evening, PlayerRecord, PlayerTally } from "#shared/repository/repository-contract.ts";
import { normalizeName } from "#shared/table/name-list.ts";


export interface Arriving {
  readonly playerId: number | null;
  readonly displayName: string;
}

export interface Replacement {
  readonly evening: Evening;
  readonly leaving: PlayerTally;
  readonly arriving: Arriving;
}

export type PlanResult =
  | { readonly ok: true; readonly plan: Replacement }
  | {
      readonly ok: false;
      readonly because: typeof Refusal.NotTwoNames | typeof Refusal.NoEvening;
    }
  | {
      readonly ok: false;
      readonly because: typeof Refusal.NotThisEvening | typeof Refusal.AlsoPlayed;
      readonly evening: Evening;
      readonly written: string;
      readonly played: string;
    };

export interface Payload {
  readonly firstGameId: number;
  readonly fromId: number;
  readonly toId: number;
}

export type Recheck =
  | {
      readonly ok: true;
      readonly evening: Evening;
      readonly leaving: PlayerTally;
      readonly arriving: PlayerRecord;
    }
  | { readonly ok: false; readonly because: typeof Refusal.ScreenStale };

const TWO_NAMES = 2;

const sameName = (known: string, typed: string): boolean =>
  normalizeName(known) === normalizeName(typed);

const seatedAs = (evening: Evening, name: string): PlayerTally | undefined =>
  evening.players.find((player) => sameName(player.displayName, name));

const knownAs = (roster: readonly PlayerRecord[], name: string): PlayerRecord | undefined =>
  roster.find((player) => sameName(player.display_name, name));

export const planReplacement = (
  evening: Evening | null,
  roster: readonly PlayerRecord[],
  names: readonly string[]
): PlanResult => {
  const [written, played] = names;

  if (written === undefined || played === undefined || names.length !== TWO_NAMES) {
    return { ok: false, because: Refusal.NotTwoNames };
  }

  if (evening === null) {
    return { ok: false, because: Refusal.NoEvening };
  }

  const leaving = seatedAs(evening, written);
  if (leaving === undefined) {
    return { ok: false, because: Refusal.NotThisEvening, evening, written, played };
  }

  if (seatedAs(evening, played) !== undefined) {
    return { ok: false, because: Refusal.AlsoPlayed, evening, written, played };
  }

  const known = knownAs(roster, played);

  return {
    ok: true,
    plan: {
      evening,
      leaving,
      arriving:
        known === undefined
          ? { playerId: null, displayName: played }
          : { playerId: known.id, displayName: known.display_name },
    },
  };
};

const sitsIn = (evening: Evening, playerId: number): PlayerTally | undefined =>
  evening.players.find((player) => player.playerId === playerId);

export const recheck = (
  evening: Evening | null,
  roster: readonly PlayerRecord[],
  payload: Payload
): Recheck => {
  if (evening === null || evening.firstGameId !== payload.firstGameId) {
    return { ok: false, because: Refusal.ScreenStale };
  }

  const leaving = sitsIn(evening, payload.fromId);
  const arriving = roster.find((player) => player.id === payload.toId);

  if (leaving === undefined || arriving === undefined || sitsIn(evening, payload.toId) !== undefined) {
    return { ok: false, because: Refusal.ScreenStale };
  }

  return { ok: true, evening, leaving, arriving };
};
