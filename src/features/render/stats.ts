import type { SeriesStats } from "../../shared/repository/types.ts";
import { escapeHtml } from "./html.ts";
import { strings } from "./strings.ts";


const LONGEST_BAR = 12;

const BAR_CELL = "█";

interface Tally {
  readonly name: string;
  readonly value: number;
}

const barOf = (value: number, largest: number): string =>
  BAR_CELL.repeat(
    largest <= LONGEST_BAR ? value : Math.max(1, Math.round((value / largest) * LONGEST_BAR))
  );

const section = (title: string, tallies: readonly Tally[]): readonly string[] => {
  const scored = tallies
    .filter((tally) => tally.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const largest = scored[0]?.value;

  if (largest === undefined) {
    return [];
  }

  return [
    "",
    title,
    ...scored.map((tally) => strings.statsRow(barOf(tally.value, largest), tally.value, tally.name)),
  ];
};

export const renderStats = (stats: SeriesStats): string => {
  if (stats.games === 0) {
    return strings.statsEmpty;
  }

  const named = stats.players.map((player) => ({
    name: escapeHtml(player.displayName),
    wins: player.wins,
    fools: player.fools,
  }));

  const fools = section(
    strings.statsFools,
    named.map(({ name, fools: value }) => ({ name, value }))
  );

  const wins = section(
    strings.statsWins,
    named.map(({ name, wins: value }) => ({ name, value }))
  );

  const body = [...fools, ...wins];

  return [strings.statsHeader(stats.games), ...(body.length === 0 ? ["", strings.statsAllDrawn] : body)].join("\n");
};
