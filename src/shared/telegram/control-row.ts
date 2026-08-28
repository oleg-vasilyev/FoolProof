import type { InlineButton } from "#shared/telegram/inline-keyboard.ts";


export interface Controls {
  readonly cancel: InlineButton;
  readonly back: InlineButton;
  readonly wayOn: InlineButton | null;
  readonly anythingToUndo: boolean;
}

export const controlRow = ({
  cancel,
  back,
  wayOn,
  anythingToUndo,
}: Controls): readonly InlineButton[] => [
  anythingToUndo ? back : cancel,
  ...(wayOn === null ? [] : [wayOn]),
];
