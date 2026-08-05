export const ENOUGH_GAMES = 5;

export type Award =
  | { readonly name: "king"; readonly winners: readonly number[]; readonly percent: number; readonly games: number }
  | { readonly name: "untouchable"; readonly winners: readonly number[]; readonly games: number }
  | { readonly name: "teflon"; readonly winners: readonly number[]; readonly streak: number }
  | {
      readonly name: "sweetRevenge";
      readonly winners: readonly number[];
      readonly fools: number;
      readonly comebacks: number;
    }
  | {
      readonly name: "ironSeat";
      readonly winners: readonly number[];
      readonly games: number;
    }
  | {
      readonly name: "theTruce";
      readonly winners: readonly number[];
      readonly draws: number;
      readonly games: number;
    }
  | {
      readonly name: "allOrNothing";
      readonly winners: readonly number[];
      readonly edges: number;
      readonly games: number;
    }
  | {
      readonly name: "theInvisible";
      readonly winners: readonly number[];
      readonly middles: number;
      readonly games: number;
    }
  | {
      readonly name: "theIrishGoodbye";
      readonly winners: readonly number[];
      readonly leftAfter: number;
      readonly games: number;
    }
  | { readonly name: "encore"; readonly winners: readonly number[]; readonly run: number }
  | {
      readonly name: "dealersCurse";
      readonly winners: readonly number[];
      readonly deals: number;
      readonly burns: number;
    }
  | { readonly name: "firstBlood"; readonly winners: readonly number[]; readonly games: number }
  | {
      readonly name: "foolOfTheNight";
      readonly winners: readonly number[];
      readonly fools: number;
      readonly games: number;
    };

export type AwardName = Award["name"];

export interface TableCurse {
  readonly burns: number;
  readonly games: number;
}

export interface Honours {
  readonly awards: readonly Award[];
  readonly curse: TableCurse | null;
}
