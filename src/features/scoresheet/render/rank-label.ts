const FROM_ONE = 1;

const TWO_DIGITS = 2;

export const rankLabel = (rank: number): string =>
  String(rank + FROM_ONE).padStart(TWO_DIGITS, "0");
