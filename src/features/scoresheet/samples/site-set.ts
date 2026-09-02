import { copyIn } from "#scoresheet/copy.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { NO_PAST } from "#scoresheet/domain/awards/evening-past.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import { Locale } from "#shared/locale/locales.ts";
import { careerCard } from "#scoresheet/domain/career/career-card.ts";
import { renderPersonalCard } from "#scoresheet/render/personal/personal-svg.ts";
import { columnLookupOf } from "#scoresheet/render/personal/colour-column.ts";
import type { CareerHistory, SeriesChronology } from "#shared/repository/repository-contract.ts";
import { BOT_HANDLE } from "#scoresheet/samples/sample-handle.ts";
import {
  SAMPLE_SUBJECT,
  englishCareer,
  englishEvening,
  sampleCareer,
  sampleEvening,
} from "#scoresheet/samples/sample-table.ts";


const cardIn = (locale: Locale, evening: SeriesChronology, career: CareerHistory): string => {
  const card = careerCard(career, SAMPLE_SUBJECT);

  if (card === null) {
    throw new Error("the sample career has no games — check NAMES and EXIT_ORDERS in sample-table.ts");
  }

  return renderPersonalCard(
    copyIn(locale),
    card,
    columnLookupOf(evening, career.players),
    BOT_HANDLE
  );
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
  ...setIn(Locale.En, englishEvening(), englishCareer()),
  ...setIn(Locale.Ru, sampleEvening(), sampleCareer()),
});
