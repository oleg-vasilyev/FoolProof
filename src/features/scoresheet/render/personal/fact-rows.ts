import { FONT_FAMILY, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { percentLabel } from "#scoresheet/render/percent-label.ts";
import { gameTally } from "#scoresheet/render/tally-phrases.ts";
import { sessionDate } from "#scoresheet/render/session-date.ts";
import { rect, text } from "#scoresheet/render/svg-tags.ts";
import {
  FACT_HEIGHT,
  FACT_HOLDER_DROP,
  FACT_INDEX_INDENT,
  FACT_REASON_DROP,
  FACT_SPINE_INSET,
  FACT_SPINE_WIDTH,
  FACT_TEXT_INDENT,
  FACT_TITLE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { FactName, type PlacedFact } from "#scoresheet/render/personal/personal-layout.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { Copy } from "#scoresheet/copy.ts";


const ONE_PLACE = 1;

const INDEX_DIGITS = 2;

const BOTH_ENDS = 2;

const INDEX_FILL = "0";

interface Told {
  readonly title: string;
  readonly holder: string;
  readonly reason: string;
  readonly ink: string;
}

const bestTold = (copy: Copy, card: CareerCard, ink: string): readonly Told[] =>
  card.best === null
    ? []
    : [
        {
          title: copy.factBest,
          holder: sessionDate(copy, card.best.playedOn),
          reason: copy.bestReason(
            gameTally(copy, card.best.games),
            percentLabel(card.best.share)
          ),
          ink,
        },
      ];

const worstTold = (copy: Copy, card: CareerCard): readonly Told[] =>
  card.worst === null
    ? []
    : [
        {
          title: copy.factWorst,
          holder: sessionDate(copy, card.worst.playedOn),
          reason: copy.worstReason(
            gameTally(copy, card.worst.games),
            percentLabel(card.worst.share)
          ),
          ink: palette.cellFool,
        },
      ];

const streakTold = (copy: Copy, card: CareerCard, ink: string): readonly Told[] =>
  card.streak === null
    ? []
    : [
        {
          title: copy.factStreak,
          holder: copy.streakHolder(gameTally(copy, card.streak.games)),
          reason: copy.streakReason(
            sessionDate(copy, card.streak.from),
            sessionDate(copy, card.streak.until)
          ),
          ink,
        },
      ];

const toldOf = (copy: Copy, card: CareerCard, fact: PlacedFact, ink: string): readonly Told[] => {
  switch (fact.name) {
    case FactName.Best:
      return bestTold(copy, card, ink);

    case FactName.Worst:
      return worstTold(copy, card);

    case FactName.Streak:
      return streakTold(copy, card, ink);
  }
};

const drawn = (told: Told, top: number, place: number): readonly string[] => [
  rect({
    x: PAD,
    y: top + FACT_SPINE_INSET,
    width: FACT_SPINE_WIDTH,
    height: FACT_HEIGHT - FACT_SPINE_INSET * BOTH_ENDS,
    fill: told.ink,
  }),
  text(String(place).padStart(INDEX_DIGITS, INDEX_FILL), {
    x: PAD + FACT_INDEX_INDENT,
    y: top + FACT_TITLE_DROP,
    fill: palette.inkFigure,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.factIndex,
  }),
  text(told.title, {
    x: PAD + FACT_TEXT_INDENT,
    y: top + FACT_TITLE_DROP,
    fill: palette.ink,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": personalFont.factTitle,
  }),
  text(told.holder, {
    x: PAD + FACT_TEXT_INDENT,
    y: top + FACT_HOLDER_DROP,
    fill: told.ink,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": personalFont.factHolder,
  }),
  text(told.reason, {
    x: PAD + FACT_TEXT_INDENT,
    y: top + FACT_REASON_DROP,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.factReason,
  }),
];

export const factRows = (
  copy: Copy,
  card: CareerCard,
  facts: readonly PlacedFact[],
  ink: string
): readonly string[] =>
  facts.flatMap((fact, index) =>
    toldOf(copy, card, fact, ink).flatMap((told) => drawn(told, fact.top, index + ONE_PLACE))
  );
