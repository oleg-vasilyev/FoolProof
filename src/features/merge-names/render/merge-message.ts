import { escapeHtml } from "#shared/text/html-escape.ts";
import {
  chosen,
  gamesAfterMerge,
  type Candidate,
  type Selection,
} from "#merge-names/domain/merge-selection.ts";
import { gameTally } from "#merge-names/render/game-tally.ts";
import type { Copy } from "#merge-names/copy.ts";


const BETWEEN_LINES = "\n";

const NOTHING_PICKED = 0;

const FROM_THE_START = 0;

const ALONE = 1;

const LAST = -1;

const safeNameOf = (candidate: Candidate): string => escapeHtml(candidate.displayName);

export const joinedNames = (copy: Copy, candidates: readonly Candidate[]): string => {
  const names = candidates.map((candidate) => candidate.displayName);
  const last = names.at(LAST);

  return names.length <= ALONE || last === undefined
    ? names.join(copy.betweenNames)
    : `${names.slice(FROM_THE_START, LAST).join(copy.betweenNames)}${copy.beforeLastName}${last}`;
};

const planLine = (copy: Copy, keeper: Candidate, absorbed: readonly Candidate[]): string =>
  copy.plan(absorbed.map(safeNameOf).join(copy.betweenNames), safeNameOf(keeper));

const bodyFor = (copy: Copy, picked: readonly Candidate[]): readonly string[] => {
  const [keeper, ...absorbed] = picked;

  if (keeper === undefined) {
    return [copy.askKeeper];
  }

  if (absorbed.length === NOTHING_PICKED) {
    return [copy.keeperChosen(safeNameOf(keeper))];
  }

  return [
    planLine(copy, keeper, absorbed),
    copy.willHave(safeNameOf(keeper), gameTally(copy, gamesAfterMerge(keeper, absorbed))),
  ];
};

export const renderMergeScreen = (
  copy: Copy,
  roster: readonly Candidate[],
  selection: Selection
): string => [copy.header, ...bodyFor(copy, chosen(roster, selection))].join(BETWEEN_LINES);

export const renderMerged = (
  copy: Copy,
  keeper: Candidate,
  absorbed: readonly Candidate[]
): string =>
  [
    copy.header,
    planLine(copy, keeper, absorbed),
    copy.nowHas(safeNameOf(keeper), gameTally(copy, gamesAfterMerge(keeper, absorbed))),
  ].join(BETWEEN_LINES);

export const renderCancelled = (copy: Copy): string =>
  [copy.header, copy.cancelledBody].join(BETWEEN_LINES);
