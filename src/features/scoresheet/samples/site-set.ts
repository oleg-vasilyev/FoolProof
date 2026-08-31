import { copyIn } from "#scoresheet/copy.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { NO_PAST } from "#scoresheet/domain/awards/evening-past.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import { Locale } from "#shared/locale/locales.ts";
import { careerCard } from "#scoresheet/domain/career/career-card.ts";
import { renderPersonalCard } from "#scoresheet/render/personal/personal-svg.ts";
import { colourColumnOf } from "#scoresheet/render/personal/colour-column.ts";
import type { CareerHistory, PlayerColumn, SeriesChronology } from "#shared/repository/repository-contract.ts";
import { BOT_HANDLE } from "#scoresheet/samples/sample-handle.ts";
import { SAMPLE_SUBJECT, sampleCareer, sampleEvening } from "#scoresheet/samples/sample-table.ts";


const LATIN_NAMES = ["Oleg", "Anya", "Roma", "Dima", "Veronika"];

interface Seated {
  readonly players: readonly PlayerColumn[];
}

const renamed = <T extends Seated>(subject: T, names: readonly string[]): T => {
  if (names.length !== subject.players.length) {
    throw new Error(
      `LATIN_NAMES has ${String(names.length)} names for ` +
        `${String(subject.players.length)} players — the English poster would keep a Cyrillic one`
    );
  }

  return {
    ...subject,
    players: subject.players.map((player, index) => ({
      ...player,
      displayName: names[index] ?? player.displayName,
    })),
  };
};

const cardIn = (locale: Locale, evening: SeriesChronology, career: CareerHistory): string => {
  const card = careerCard(career, SAMPLE_SUBJECT);

  if (card === null) {
    throw new Error("the sample career has no games — check NAMES and EXIT_ORDERS in sample-table.ts");
  }

  const column = colourColumnOf(evening, career.players, SAMPLE_SUBJECT);

  return renderPersonalCard(copyIn(locale), card, column, BOT_HANDLE);
};

const pairIn = (
  locale: Locale,
  evening: SeriesChronology
): Readonly<Record<string, string>> => {
  const copy = copyIn(locale);
  const honours = honoursFor(evening, NO_PAST);

  if (honours === null) {
    throw new Error("the sample evening earns no awards — lengthen EXIT_ORDERS in sample-table.ts");
  }

  return {
    [`chronology-${locale}`]: renderScoresheet(copy, evening, BOT_HANDLE),
    [`awards-${locale}`]: renderAwards(copy, evening, honours, BOT_HANDLE),
  };
};

const setIn = (
  locale: Locale,
  evening: SeriesChronology,
  career: CareerHistory
): Readonly<Record<string, string>> => ({
  ...pairIn(locale, evening),
  [`personal-${locale}`]: cardIn(locale, evening, career),
});

export const sitePosters = (): Readonly<Record<string, string>> => ({
  ...setIn(Locale.En, renamed(sampleEvening(), LATIN_NAMES), renamed(sampleCareer(), LATIN_NAMES)),
  ...setIn(Locale.Ru, sampleEvening(), sampleCareer()),
});
