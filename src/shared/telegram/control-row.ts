import type { InlineButton } from "#shared/telegram/inline-keyboard.ts";


export interface Controls {
  readonly cancel: InlineButton;
  readonly back: InlineButton;
  readonly commit: InlineButton | null;
  readonly anythingToUndo: boolean;
}

export const controlRow = ({
  cancel,
  back,
  commit,
  anythingToUndo,
}: Controls): readonly InlineButton[] => [
  anythingToUndo ? back : cancel,
  ...(commit === null ? [] : [commit]),
];
