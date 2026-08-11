import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerColumn, SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { Award, Honours, TableCurse } from "#scoresheet/domain/awards/award-catalogue.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import { PAD } from "#scoresheet/render/card-metrics.ts";


const CROWDED_ABOVE = 5;

const FIRST_WINNER = 0;

const BASELINE_RATIO = 0.8;

const PLATE_INSET = 24;

export const ROWS_TOP = 360;

export const TICK_WIDTH = 8;

export const RANK_WIDTH = 52;

export const COLUMN_GAP = 40;

export const CAP_WIDTH = 52;

export const CAP_HEIGHT = 44;

export const CAP_GAP = 24;

export const RANK_FONT = 26;

export const RANK_LEFT = PAD + TICK_WIDTH + COLUMN_GAP;

export const TEXT_LEFT = RANK_LEFT + RANK_WIDTH + COLUMN_GAP;

export const PLATE_TEXT_LEFT = PAD + RANK_WIDTH + PLATE_INSET;

export const PLATE_TITLE_LEFT = PLATE_TEXT_LEFT + CAP_WIDTH + CAP_GAP;

export const ROW_TITLE_TRACKING = 2.2;

export const PLATE_TITLE_TRACKING = 2.8;

export const WINNER_TRACKING = 0.8;

export const CURSE_TRACKING = 4;

export const baselineOf = (boxTop: number, font: number): number =>
  boxTop + Math.round(font * BASELINE_RATIO);

export const CURSE_LABEL_FONT = 24;

export const CURSE_FACT_FONT = 30;

export const CURSE_RULE_LIFT = 32;

export const CURSE_BASELINE_DROP = 34;

export const CARD_BOTTOM = 56;

export interface Density {
  readonly rowPad: number;
  readonly titleFont: number;
  readonly winnerFont: number;
  readonly reasonFont: number;
  readonly titleLine: number;
  readonly winnerLine: number;
  readonly reasonLine: number;
  readonly titleGap: number;
  readonly winnerGap: number;
  readonly rankLift: number;
  readonly plateFont: number;
  readonly plateWinnerFont: number;
  readonly plateGap: number;
  readonly plateTop: number;
  readonly plateBottom: number;
  readonly plateMargin: number;
  readonly plateRankLift: number;
}

export const CROWDED: Density = {
  rowPad: 24,
  titleFont: 58,
  winnerFont: 42,
  reasonFont: 31,
  titleLine: 64,
  winnerLine: 50,
  reasonLine: 40,
  titleGap: 6,
  winnerGap: 8,
  rankLift: 36,
  plateFont: 74,
  plateWinnerFont: 50,
  plateGap: 16,
  plateTop: 36,
  plateBottom: 40,
  plateMargin: 40,
  plateRankLift: 96,
};

export const ROOMY: Density = {
  rowPad: 52,
  titleFont: 72,
  winnerFont: 48,
  reasonFont: 34,
  titleLine: 79,
  winnerLine: 58,
  reasonLine: 44,
  titleGap: 10,
  winnerGap: 12,
  rankLift: 44,
  plateFont: 84,
  plateWinnerFont: 56,
  plateGap: 20,
  plateTop: 52,
  plateBottom: 56,
  plateMargin: 60,
  plateRankLift: 112,
};

export interface Placed {
  readonly award: Award;
  readonly names: readonly string[];
  readonly wholeTable: boolean;
  readonly colour: string;
  readonly rank: number;
  readonly top: number;
  readonly height: number;
}

export interface PlacedCurse {
  readonly fact: TableCurse;
  readonly top: number;
}

export interface AwardsSheet {
  readonly startedOn: string;
  readonly games: number;
  readonly players: number;
  readonly rows: readonly Placed[];
  readonly fool: Placed | null;
  readonly curse: PlacedCurse | null;
  readonly density: Density;
  readonly height: number;
}

const rowHeightOf = (density: Density): number =>
  density.rowPad +
  density.titleLine +
  density.titleGap +
  density.winnerLine +
  density.winnerGap +
  density.reasonLine +
  density.rowPad;

export interface PlateBox {
  readonly headTop: number;
  readonly winnerTop: number;
  readonly reasonTop: number;
  readonly height: number;
}

export const plateBoxOf = (density: Density): PlateBox => {
  const winnerTop = density.plateTop + density.plateFont + density.plateGap;
  const reasonTop = winnerTop + density.winnerLine + density.winnerGap;

  return {
    headTop: density.plateTop,
    winnerTop,
    reasonTop,
    height: reasonTop + density.reasonLine + density.plateBottom,
  };
};

const seatOf = (players: readonly PlayerColumn[], award: Award): number =>
  players.findIndex((player) => player.playerId === award.winners[FIRST_WINNER]);

const namesOf = (players: readonly PlayerColumn[], award: Award): readonly string[] =>
  award.winners.flatMap((winner) => {
    const seated = players.find((player) => player.playerId === winner);

    return seated === undefined ? [] : [seated.displayName];
  });

const place = (
  players: readonly PlayerColumn[],
  award: Award,
  rank: number,
  top: number,
  height: number
): Placed => {
  const names = namesOf(players, award);
  const wholeTable = names.length === players.length;

  return {
    award,
    names,
    wholeTable,
    colour: wholeTable ? palette.inkHint : colourFor(seatOf(players, award)),
    rank,
    top,
    height,
  };
};

const isFool = (award: Award): boolean => award.name === AwardName.FoolOfTheNight;

export const awardsLayoutOf = (chronology: SeriesChronology, honours: Honours): AwardsSheet => {
  const density = honours.awards.length > CROWDED_ABOVE ? CROWDED : ROOMY;
  const rowHeight = rowHeightOf(density);
  const listed = honours.awards.filter((award) => !isFool(award));
  const crowned = honours.awards.find(isFool) ?? null;

  const rows = listed.map((award, at) =>
    place(chronology.players, award, at, ROWS_TOP + at * rowHeight, rowHeight)
  );
  const afterRows = ROWS_TOP + listed.length * rowHeight;
  const fool =
    crowned === null
      ? null
      : place(
          chronology.players,
          crowned,
          listed.length,
          afterRows + density.plateMargin,
          plateBoxOf(density).height
        );
  const afterFool = fool === null ? afterRows : fool.top + fool.height;
  const curse =
    honours.curse === null
      ? null
      : { fact: honours.curse, top: afterFool + CURSE_RULE_LIFT };

  return {
    startedOn: chronology.startedOn,
    games: chronology.games.length,
    players: chronology.players.length,
    rows,
    fool,
    curse,
    density,
    height: (curse === null ? afterFool : curse.top + CURSE_BASELINE_DROP) + CARD_BOTTOM,
  };
};
