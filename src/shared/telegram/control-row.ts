import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";


export interface Controls {
  readonly cancel: InlineButton | null;
  readonly back: InlineButton;
  readonly wayOn: InlineButton | null;
  readonly anythingToUndo: boolean;
}

const NO_CONTROLS = 0;

const present = (button: InlineButton | null): readonly InlineButton[] =>
  button === null ? [] : [button];

export const controlRow = ({
  cancel,
  back,
  wayOn,
  anythingToUndo,
}: Controls): readonly InlineButton[] => [
  ...present(anythingToUndo ? back : cancel),
  ...present(wayOn),
];

export const withControlRow = (
  rows: InlineKeyboardRows,
  controls: readonly InlineButton[]
): InlineKeyboardRows => (controls.length === NO_CONTROLS ? rows : [...rows, controls]);
