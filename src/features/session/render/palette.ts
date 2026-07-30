export const palette = {
  sheet: "#1c1c1c",
  cellAbsent: "#000000",
  cellPlaced: "#3a3a3a",
  cellDrawn: "#2f5d52",
  cellFool: "#c0392b",
  ink: "#f2f2f2",
  inkMuted: "#9a9a9a",
  inkFaint: "#6a6a6a",
  ruling: "#2e2e2e",
} as const;

export const PLAYER_COLOURS: readonly string[] = [
  "#e8c547",
  "#e05c5c",
  "#7ba7d7",
  "#5cc9a7",
  "#c07bd7",
  "#d78f5c",
  "#8fd75c",
  "#d75c9a",
];

export const colourFor = (column: number): string =>
  PLAYER_COLOURS[column % PLAYER_COLOURS.length] ?? palette.ink;
