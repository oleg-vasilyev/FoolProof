export const ENOUGH_GAMES = 5;

export const LONG_ENOUGH = 8;

export const AwardName = {
  King: "king",
  WireToWire: "wireToWire",
  TheFavourite: "theFavourite",
  HatTrick: "hatTrick",
  HomeAdvantage: "homeAdvantage",
  Untouchable: "untouchable",
  Teflon: "teflon",
  HotSeat: "hotSeat",
  TheComeback: "theComeback",
  TheLadder: "theLadder",
  SweetRevenge: "sweetRevenge",
  IronSeat: "ironSeat",
  TheTruce: "theTruce",
  ThePacifist: "thePacifist",
  TheNemesis: "theNemesis",
  TheDoorman: "theDoorman",
  NeverAsked: "neverAsked",
  TheLatecomer: "theLatecomer",
  RevolvingDoor: "revolvingDoor",
  TheCameo: "theCameo",
  SecondWind: "secondWind",
  TheUnderstudy: "theUnderstudy",
  TheFlatline: "theFlatline",
  TheInvisible: "theInvisible",
  GroundhogDay: "groundhogDay",
  ThePendulum: "thePendulum",
  TheRollercoaster: "theRollercoaster",
  AllOrNothing: "allOrNothing",
  TheIrishGoodbye: "theIrishGoodbye",
  TheAnchor: "theAnchor",
  TheSlide: "theSlide",
  FalseDawn: "falseDawn",
  OpenersCurse: "openersCurse",
  Encore: "encore",
  FirstBlood: "firstBlood",
  FoolOfTheNight: "foolOfTheNight",
} as const;

export type AwardName = (typeof AwardName)[keyof typeof AwardName];

type Earned<Name extends AwardName, Facts> = {
  readonly name: Name;
  readonly winners: readonly number[];
} & Facts;

export type Award =
  | Earned<
      typeof AwardName.King,
      { readonly percent: number; readonly games: number; readonly passed: boolean }
    >
  | Earned<typeof AwardName.WireToWire, { readonly games: number }>
  | Earned<typeof AwardName.TheFavourite, { readonly firsts: number; readonly games: number }>
  | Earned<typeof AwardName.HatTrick, { readonly run: number }>
  | Earned<typeof AwardName.HomeAdvantage, { readonly wins: number; readonly opens: number }>
  | Earned<typeof AwardName.Untouchable, { readonly games: number }>
  | Earned<typeof AwardName.Teflon, { readonly streak: number }>
  | Earned<typeof AwardName.HotSeat, { readonly opens: number }>
  | Earned<typeof AwardName.TheComeback, { readonly percent: number; readonly sank: number }>
  | Earned<typeof AwardName.TheLadder, { readonly run: number }>
  | Earned<typeof AwardName.SweetRevenge, { readonly fools: number; readonly comebacks: number }>
  | Earned<typeof AwardName.IronSeat, { readonly games: number }>
  | Earned<typeof AwardName.TheTruce, { readonly draws: number; readonly games: number }>
  | Earned<typeof AwardName.ThePacifist, { readonly draws: number }>
  | Earned<typeof AwardName.TheNemesis, { readonly over: number }>
  | Earned<typeof AwardName.TheDoorman, { readonly opens: number; readonly games: number }>
  | Earned<typeof AwardName.NeverAsked, { readonly games: number }>
  | Earned<typeof AwardName.TheLatecomer, { readonly joinedAt: number; readonly percent: number }>
  | Earned<typeof AwardName.RevolvingDoor, { readonly missed: number; readonly games: number }>
  | Earned<typeof AwardName.TheCameo, { readonly games: number }>
  | Earned<typeof AwardName.SecondWind, { readonly burnedBy: number; readonly games: number }>
  | Earned<typeof AwardName.TheUnderstudy, { readonly seconds: number; readonly games: number }>
  | Earned<typeof AwardName.TheFlatline, { readonly band: number; readonly games: number }>
  | Earned<typeof AwardName.TheInvisible, { readonly middles: number; readonly games: number }>
  | Earned<typeof AwardName.GroundhogDay, { readonly place: number; readonly run: number }>
  | Earned<typeof AwardName.ThePendulum, { readonly run: number }>
  | Earned<typeof AwardName.TheRollercoaster, { readonly swing: number; readonly games: number }>
  | Earned<typeof AwardName.AllOrNothing, { readonly edges: number; readonly games: number }>
  | Earned<typeof AwardName.TheIrishGoodbye, { readonly leftAfter: number; readonly games: number }>
  | Earned<typeof AwardName.TheAnchor, { readonly games: number }>
  | Earned<typeof AwardName.TheSlide, { readonly run: number }>
  | Earned<typeof AwardName.FalseDawn, { readonly ledAt: number; readonly percent: number }>
  | Earned<typeof AwardName.OpenersCurse, { readonly opens: number; readonly burns: number }>
  | Earned<typeof AwardName.Encore, { readonly run: number }>
  | Earned<typeof AwardName.FirstBlood, { readonly games: number }>
  | Earned<typeof AwardName.FoolOfTheNight, { readonly fools: number; readonly games: number }>;

export const RAREST_FIRST: readonly AwardName[] = [
  AwardName.FalseDawn,
  AwardName.TheFlatline,
  AwardName.TheComeback,
  AwardName.TheCameo,
  AwardName.TheAnchor,
  AwardName.TheLadder,
  AwardName.TheSlide,
  AwardName.SweetRevenge,
  AwardName.ThePendulum,
  AwardName.TheRollercoaster,
  AwardName.SecondWind,
  AwardName.RevolvingDoor,
  AwardName.ThePacifist,
  AwardName.TheLatecomer,
  AwardName.TheUnderstudy,
  AwardName.IronSeat,
  AwardName.WireToWire,
  AwardName.NeverAsked,
  AwardName.OpenersCurse,
  AwardName.TheNemesis,
  AwardName.HomeAdvantage,
  AwardName.Teflon,
  AwardName.GroundhogDay,
  AwardName.TheDoorman,
  AwardName.HatTrick,
  AwardName.TheInvisible,
  AwardName.HotSeat,
  AwardName.TheTruce,
  AwardName.TheIrishGoodbye,
  AwardName.AllOrNothing,
  AwardName.TheFavourite,
  AwardName.Untouchable,
  AwardName.Encore,
  AwardName.FirstBlood,
  AwardName.FoolOfTheNight,
  AwardName.King,
];

export interface TableCurse {
  readonly burns: number;
  readonly games: number;
}

export interface Honours {
  readonly awards: readonly Award[];
  readonly curse: TableCurse | null;
}
