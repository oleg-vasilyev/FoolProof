import {
  MIN_TO_MERGE,
  roleOf,
  type Candidate,
  type Role,
  type Selection,
} from "#merge-names/domain/merge-selection.ts";
import { encodeMergeCallback } from "#merge-names/render/merge-callback-codec.ts";
import { copy } from "#merge-names/copy.en.ts";


export interface InlineButton {
  readonly text: string;
  readonly callback_data: string;
}

export type InlineKeyboardRows = readonly (readonly InlineButton[])[];

const NOTHING_PICKED = 0;

const markFor = (role: Role): string | null => {
  switch (role) {
    case "keeper":
      return copy.markKeeper;

    case "absorbed":
      return copy.markAbsorbed;

    case "free":
      return null;
  }
};

const captionFor = (candidate: Candidate, role: Role): string => {
  const caption = copy.candidate(candidate.displayName, candidate.games);
  const mark = markFor(role);

  return mark === null ? caption : `${mark} ${caption}`;
};

const controlRow = (selection: Selection): readonly InlineButton[] => {
  if (selection.length === NOTHING_PICKED) {
    return [
      {
        text: copy.buttonCancel,
        callback_data: encodeMergeCallback({ selection, action: { kind: "cancel" } }),
      },
    ];
  }

  const back: InlineButton = {
    text: copy.buttonBack,
    callback_data: encodeMergeCallback({ selection, action: { kind: "back" } }),
  };

  if (selection.length < MIN_TO_MERGE) {
    return [back];
  }

  return [
    back,
    {
      text: copy.buttonConfirm,
      callback_data: encodeMergeCallback({ selection, action: { kind: "confirm" } }),
    },
  ];
};

export const renderMergeKeyboard = (
  roster: readonly Candidate[],
  selection: Selection
): InlineKeyboardRows => [
  ...roster.map((candidate) => [
    {
      text: captionFor(candidate, roleOf(selection, candidate.playerId)),
      callback_data: encodeMergeCallback({
        selection,
        action: { kind: "pick", playerId: candidate.playerId },
      }),
    },
  ]),
  controlRow(selection),
];
