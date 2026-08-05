const ENOUGH_TO_RECOGNISE = 20;

const ELLIPSIS = "…";

export const namePreview = (name: string): string => {
  const letters = [...name];

  return letters.length <= ENOUGH_TO_RECOGNISE
    ? name
    : letters.slice(0, ENOUGH_TO_RECOGNISE).join("") + ELLIPSIS;
};

export const namePreviews = (names: readonly string[]): readonly string[] =>
  names.map(namePreview);
