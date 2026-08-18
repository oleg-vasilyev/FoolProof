import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { palette } from "#scoresheet/render/palette.ts";


const BAD_NEWS: readonly CareerFactName[] = [
  CareerFactName.TheNightmare,
  CareerFactName.TheJinx,
  CareerFactName.TheBogey,
  CareerFactName.BigTableCurse,
  CareerFactName.OpenersCurse,
  CareerFactName.TheBadPatch,
  CareerFactName.LightningRod,
];

export const isBadNews = (fact: CareerFact): boolean => BAD_NEWS.includes(fact.name);

export const factInk = (fact: CareerFact, ink: string): string =>
  isBadNews(fact) ? palette.cellFool : ink;
