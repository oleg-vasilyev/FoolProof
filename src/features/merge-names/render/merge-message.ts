import { escapeHtml } from "#shared/text/html-escape.ts";
import {
  chosen,
  gamesAfterMerge,
  type Candidate,
  type Selection,
} from "#merge-names/domain/merge-selection.ts";
import { gameTally } from "#merge-names/render/game-tally.ts";
import { copy } from "#merge-names/copy.en.ts";


const BETWEEN_NAMES = ", ";

const BETWEEN_LINES = "\n";

const NOTHING_PICKED = 0;

const safeNameOf = (candidate: Candidate): string => escapeHtml(candidate.displayName);

export const joinedNames = (candidates: readonly Candidate[]): string =>
  candidates.map((candidate) => candidate.displayName).join(BETWEEN_NAMES);

const planLine = (keeper: Candidate, absorbed: readonly Candidate[]): string =>
  copy.plan(absorbed.map(safeNameOf).join(BETWEEN_NAMES), safeNameOf(keeper));

const bodyFor = (picked: readonly Candidate[]): readonly string[] => {
  const [keeper, ...absorbed] = picked;

  if (keeper === undefined) {
    return [copy.askKeeper];
  }

  if (absorbed.length === NOTHING_PICKED) {
    return [copy.keeperChosen(safeNameOf(keeper))];
  }

  return [
    planLine(keeper, absorbed),
    copy.willHave(safeNameOf(keeper), gameTally(gamesAfterMerge(keeper, absorbed))),
  ];
};

export const renderMergeScreen = (roster: readonly Candidate[], selection: Selection): string =>
  [copy.header, ...bodyFor(chosen(roster, selection))].join(BETWEEN_LINES);

export const renderMerged = (keeper: Candidate, absorbed: readonly Candidate[]): string =>
  [
    copy.header,
    planLine(keeper, absorbed),
    copy.nowHas(safeNameOf(keeper), gameTally(gamesAfterMerge(keeper, absorbed))),
  ].join(BETWEEN_LINES);

export const renderCancelled = (): string => [copy.header, copy.cancelledBody].join(BETWEEN_LINES);
