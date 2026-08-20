import { eveningsShortOfChart } from "#scoresheet/domain/career/career-evenings.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { eveningsOwedTally } from "#scoresheet/render/tally-phrases.ts";


export const chartTeaser = (copy: Copy, nights: number): string =>
  copy.personalChartArrives(eveningsOwedTally(copy, eveningsShortOfChart(nights)));
