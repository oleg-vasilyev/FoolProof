export const CareerFactName = {
  TheBlinder: "theBlinder",
  TheNightmare: "theNightmare",
  TheCharm: "theCharm",
  TheJinx: "theJinx",
  ThePatsy: "thePatsy",
  TheBogey: "theBogey",
  BigTableCharm: "bigTableCharm",
  BigTableCurse: "bigTableCurse",
  OpenersGift: "openersGift",
  OpenersCurse: "openersCurse",
  TheHomecoming: "theHomecoming",
  NeverWentFirst: "neverWentFirst",
  TheHeadStart: "theHeadStart",
  TheBadPatch: "theBadPatch",
  TheCleanRun: "theCleanRun",
  TheSurvivor: "theSurvivor",
  LightningRod: "lightningRod",
  EverPresent: "everPresent",
  FoundingMember: "foundingMember",
  TheNewcomer: "theNewcomer",
} as const;

export type CareerFactName = (typeof CareerFactName)[keyof typeof CareerFactName];

interface Evening {
  readonly playedOn: string;
  readonly games: number;
}

interface Duel {
  readonly rival: string;
  readonly duels: number;
}

interface Alongside {
  readonly rival: string;
  readonly games: number;
  readonly burns: number;
  readonly usualBurns: number;
}

interface Crowd {
  readonly seats: number;
  readonly games: number;
  readonly burns: number;
  readonly usualBurns: number;
}

interface Stretch {
  readonly games: number;
  readonly from: string;
  readonly until: string;
}

interface AgainstTheSeat {
  readonly games: number;
  readonly burns: number;
  readonly expected: number;
  readonly rate: number;
}

interface Opening {
  readonly opens: number;
}

type Noted<Name extends CareerFactName, Facts> = { readonly name: Name } & Facts;

export type CareerFact =
  | Noted<typeof CareerFactName.TheBlinder, Evening & { readonly firsts: number }>
  | Noted<typeof CareerFactName.TheNightmare, Evening & { readonly burns: number }>
  | Noted<typeof CareerFactName.TheCharm, Alongside>
  | Noted<typeof CareerFactName.TheJinx, Alongside>
  | Noted<typeof CareerFactName.ThePatsy, Duel & { readonly won: number }>
  | Noted<typeof CareerFactName.TheBogey, Duel & { readonly lost: number }>
  | Noted<typeof CareerFactName.BigTableCharm, Crowd>
  | Noted<typeof CareerFactName.BigTableCurse, Crowd>
  | Noted<typeof CareerFactName.OpenersGift, Opening & { readonly firsts: number }>
  | Noted<typeof CareerFactName.OpenersCurse, Opening & { readonly burns: number }>
  | Noted<
      typeof CareerFactName.TheHomecoming,
      { readonly missed: number; readonly playedOn: string }
    >
  | Noted<typeof CareerFactName.NeverWentFirst, { readonly games: number }>
  | Noted<typeof CareerFactName.TheHeadStart, Opening & { readonly games: number }>
  | Noted<typeof CareerFactName.TheBadPatch, Stretch>
  | Noted<typeof CareerFactName.TheCleanRun, Stretch>
  | Noted<typeof CareerFactName.TheSurvivor, AgainstTheSeat>
  | Noted<typeof CareerFactName.LightningRod, AgainstTheSeat>
  | Noted<typeof CareerFactName.EverPresent, { readonly evenings: number }>
  | Noted<
      typeof CareerFactName.FoundingMember,
      { readonly playedOn: string; readonly evenings: number }
    >
  | Noted<typeof CareerFactName.TheNewcomer, { readonly evenings: number; readonly games: number }>;

export const RAREST_FIRST: readonly CareerFactName[] = [
  CareerFactName.TheBlinder,
  CareerFactName.TheNightmare,
  CareerFactName.TheJinx,
  CareerFactName.TheBogey,
  CareerFactName.TheCharm,
  CareerFactName.ThePatsy,
  CareerFactName.BigTableCharm,
  CareerFactName.BigTableCurse,
  CareerFactName.OpenersGift,
  CareerFactName.OpenersCurse,
  CareerFactName.TheHomecoming,
  CareerFactName.NeverWentFirst,
  CareerFactName.TheHeadStart,
  CareerFactName.TheBadPatch,
  CareerFactName.TheCleanRun,
  CareerFactName.TheSurvivor,
  CareerFactName.LightningRod,
  CareerFactName.EverPresent,
  CareerFactName.FoundingMember,
  CareerFactName.TheNewcomer,
];
