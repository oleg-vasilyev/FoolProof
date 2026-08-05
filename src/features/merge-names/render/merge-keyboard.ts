import { ActionKind, Role } from "#merge-names/domain/merge-states.ts";
import {
  MIN_TO_MERGE,
  roleOf,
  type Candidate,
  type Selection,
} from "#merge-names/domain/merge-selection.ts";
import { encodeMergeCallback } from "#merge-names/render/merge-callback-codec.ts";
import type { Copy } from "#merge-names/copy.ts";


export interface InlineButton {
  readonly text: string;
  readonly callback_data: string;
}

export type InlineKeyboardRows = readonly (readonly InlineButton[])[];

const NOTHING_PICKED = 0;

const markFor = (copy: Copy, role: Role): string | null => {
  switch (role) {
    case Role.Keeper:
      return copy.markKeeper;

    case Role.Absorbed:
      return copy.markAbsorbed;

    case Role.Free:
      return null;
  }
};

const captionFor = (copy: Copy, candidate: Candidate, role: Role): string => {
  const caption = copy.candidate(candidate.displayName, candidate.games);
  const mark = markFor(copy, role);

  return mark === null ? caption : `${mark} ${caption}`;
};

const controlRow = (copy: Copy, selection: Selection): readonly InlineButton[] => {
  if (selection.length === NOTHING_PICKED) {
    return [
      {
        text: copy.buttonCancel,
        callback_data: encodeMergeCallback({ selection, action: { kind: ActionKind.Cancel } }),
      },
    ];
  }

  const back: InlineButton = {
    text: copy.buttonBack,
    callback_data: encodeMergeCallback({ selection, action: { kind: ActionKind.Back } }),
  };

  if (selection.length < MIN_TO_MERGE) {
    return [back];
  }

  return [
    back,
    {
      text: copy.buttonConfirm,
      callback_data: encodeMergeCallback({ selection, action: { kind: ActionKind.Confirm } }),
    },
  ];
};

export const renderMergeKeyboard = (
  copy: Copy,
  roster: readonly Candidate[],
  selection: Selection
): InlineKeyboardRows => [
  ...roster.map((candidate) => [
    {
      text: captionFor(copy, candidate, roleOf(selection, candidate.playerId)),
      callback_data: encodeMergeCallback({
        selection,
        action: { kind: ActionKind.Pick, playerId: candidate.playerId },
      }),
    },
  ]),
  controlRow(copy, selection),
];
