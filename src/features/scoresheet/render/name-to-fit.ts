const NOTHING = 0;

const ELLIPSIS = "…";

export const widthOf = (name: string, size: number, advance: number): number =>
  name.length * size * advance;

export const nameToFit = (
  name: string,
  width: number,
  size: number,
  advance: number
): string => {
  const fits = Math.floor(width / (size * advance));

  return name.length <= fits
    ? name
    : `${name.slice(NOTHING, Math.max(fits - ELLIPSIS.length, NOTHING))}${ELLIPSIS}`;
};
