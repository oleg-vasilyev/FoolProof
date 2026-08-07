export const palette = {
  sheet: "#1c1c1c",
  cellAbsentEdge: "#4a4a4a",
  cellPlaced: "#3f3f3f",
  cellDrawn: "#46505c",
  cellDrawnEdge: "#93a3b3",
  cellFool: "#c0392b",
  cellFoolInk: "#ffffff",
  ink: "#f2f2f2",
  inkHint: "#c8c8c8",
  inkKey: "#a8a8a8",
  inkMuted: "#9a9a9a",
  inkFigure: "#8a8a8a",
  inkFaint: "#6a6a6a",
  ruling: "#2e2e2e",
  plateInk: "#1a1a1a",
  plateSoft: "#f7c9c2",
  plateCap: "#3a0e07",
} as const;

export const PLAYER_COLOURS: readonly string[] = [
  "#e8c547",
  "#9b7de0",
  "#7ba7d7",
  "#4fb3c4",
  "#e0a3c8",
  "#cfa46a",
  "#8f9bb3",
  "#b58a6a",
];

export const colourFor = (column: number): string =>
  PLAYER_COLOURS[column % PLAYER_COLOURS.length] ?? palette.ink;
