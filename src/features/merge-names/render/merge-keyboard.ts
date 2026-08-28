import { ActionKind, Role } from "#merge-names/domain/merge-states.ts";
import {
  MIN_TO_MERGE,
  roleOf,
  type Action,
  type Candidate,
  type Selection,
} from "#merge-names/domain/merge-selection.ts";
import { encodeMergeCallback } from "#merge-names/render/merge-callback-codec.ts";
import { controlRow } from "#shared/telegram/control-row.ts";
import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { Copy } from "#merge-names/copy.ts";


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

const buttonFor = (selection: Selection, text: string, action: Action): InlineButton => ({
  text,
  callback_data: encodeMergeCallback({ selection, action }),
});

const controlsFor = (copy: Copy, selection: Selection): readonly InlineButton[] =>
  controlRow({
    cancel: buttonFor(selection, copy.buttonCancel, { kind: ActionKind.Cancel }),
    back: buttonFor(selection, copy.buttonBack, { kind: ActionKind.Back }),
    wayOn:
      selection.length >= MIN_TO_MERGE
        ? buttonFor(selection, copy.buttonConfirm, { kind: ActionKind.Confirm })
        : null,
    anythingToUndo: selection.length > NOTHING_PICKED,
  });

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
  controlsFor(copy, selection),
];
