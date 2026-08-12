import { copyIn } from "#scoresheet/copy.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import { Locale } from "#shared/locale/locales.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import { sampleEvening } from "./mockups.ts";


export const SITE_POSTER_DIR = "docs/posters";

const LATIN_NAMES = ["Oleg", "Anya", "Roma", "Dima", "Veronika"];

const renamed = (
  evening: SeriesChronology,
  names: readonly string[]
): SeriesChronology => {
  if (names.length !== evening.players.length) {
    throw new Error(
      `LATIN_NAMES has ${String(names.length)} names for ` +
        `${String(evening.players.length)} players — the English poster would keep a Cyrillic one`
    );
  }

  return {
    ...evening,
    players: evening.players.map((player, index) => ({
      ...player,
      displayName: names[index] ?? player.displayName,
    })),
  };
};

const pairIn = (
  locale: Locale,
  evening: SeriesChronology
): Readonly<Record<string, string>> => {
  const copy = copyIn(locale);
  const honours = honoursFor(evening);

  if (honours === null) {
    throw new Error("the sample evening earns no awards — lengthen EXIT_ORDERS in mockups.ts");
  }

  return {
    [`chronology-${locale}`]: renderScoresheet(copy, evening),
    [`awards-${locale}`]: renderAwards(copy, evening, honours),
  };
};

export const sitePosters = (): Readonly<Record<string, string>> => ({
  ...pairIn(Locale.En, renamed(sampleEvening(), LATIN_NAMES)),
  ...pairIn(Locale.Ru, sampleEvening()),
});
