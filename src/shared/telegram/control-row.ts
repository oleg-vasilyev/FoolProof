import type { InlineButton } from "#shared/telegram/inline-keyboard.ts";


export interface Controls {
  readonly cancel: InlineButton | null;
  readonly back: InlineButton;
  readonly wayOn: InlineButton | null;
  readonly anythingToUndo: boolean;
}

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
