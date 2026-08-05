export const ENOUGH_GAMES = 5;

export const AwardName = {
  King: "king",
  Untouchable: "untouchable",
  Teflon: "teflon",
  SweetRevenge: "sweetRevenge",
  IronSeat: "ironSeat",
  TheTruce: "theTruce",
  AllOrNothing: "allOrNothing",
  TheInvisible: "theInvisible",
  TheIrishGoodbye: "theIrishGoodbye",
  Encore: "encore",
  DealersCurse: "dealersCurse",
  FirstBlood: "firstBlood",
  FoolOfTheNight: "foolOfTheNight",
} as const;

export type AwardName = (typeof AwardName)[keyof typeof AwardName];

export type Award =
  | { readonly name: typeof AwardName.King; readonly winners: readonly number[]; readonly percent: number; readonly games: number }
  | { readonly name: typeof AwardName.Untouchable; readonly winners: readonly number[]; readonly games: number }
  | { readonly name: typeof AwardName.Teflon; readonly winners: readonly number[]; readonly streak: number }
  | {
      readonly name: typeof AwardName.SweetRevenge;
      readonly winners: readonly number[];
      readonly fools: number;
      readonly comebacks: number;
    }
  | {
      readonly name: typeof AwardName.IronSeat;
      readonly winners: readonly number[];
      readonly games: number;
    }
  | {
      readonly name: typeof AwardName.TheTruce;
      readonly winners: readonly number[];
      readonly draws: number;
      readonly games: number;
    }
  | {
      readonly name: typeof AwardName.AllOrNothing;
      readonly winners: readonly number[];
      readonly edges: number;
      readonly games: number;
    }
  | {
      readonly name: typeof AwardName.TheInvisible;
      readonly winners: readonly number[];
      readonly middles: number;
      readonly games: number;
    }
  | {
      readonly name: typeof AwardName.TheIrishGoodbye;
      readonly winners: readonly number[];
      readonly leftAfter: number;
      readonly games: number;
    }
  | { readonly name: typeof AwardName.Encore; readonly winners: readonly number[]; readonly run: number }
  | {
      readonly name: typeof AwardName.DealersCurse;
      readonly winners: readonly number[];
      readonly deals: number;
      readonly burns: number;
    }
  | { readonly name: typeof AwardName.FirstBlood; readonly winners: readonly number[]; readonly games: number }
  | {
      readonly name: typeof AwardName.FoolOfTheNight;
      readonly winners: readonly number[];
      readonly fools: number;
      readonly games: number;
    };

export interface TableCurse {
  readonly burns: number;
  readonly games: number;
}

export interface Honours {
  readonly awards: readonly Award[];
  readonly curse: TableCurse | null;
}
