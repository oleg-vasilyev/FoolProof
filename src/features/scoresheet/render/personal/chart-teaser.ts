import { eveningsShortOfChart } from "#scoresheet/domain/career/career-evenings.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { eveningTally } from "#scoresheet/render/tally-phrases.ts";


export const chartTeaser = (copy: Copy, nights: number): string =>
  copy.personalChartProgress(eveningTally(copy, eveningsShortOfChart(nights)));
