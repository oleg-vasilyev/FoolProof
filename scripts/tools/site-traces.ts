import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";
import { read } from "../docs-check/document-files.ts";
import { LANDING_PAGES } from "./site-css.ts";


export const TRACE_TOOL = "node scripts/tools/tools.ts site-traces";

export const TRACE_LINES = 5;

export type TraceKey = readonly [down: number, centre: number, spread: number];

export type TraceSection = {
  readonly section: string;
  readonly keys: readonly TraceKey[];
};

export const TRACE_ROUTE: readonly TraceSection[] = [
  {
    section: "hero",
    keys: [
      [0, 50, 0.15], [6, 52, 0.6], [14, 58, 1], [22, 62, 1], [30, 60, 0.8], [38, 55, 0.5], [50, 55, 0.5],
      [62, 55, 0.35], [70, 56, 0.3], [78, 55, 0.5], [88, 55, 0.45], [94, 52, 0.7], [100, 50, 0.3],
    ],
  },
  {
    section: "how",
    keys: [
      [8, 66, 0.8], [14, 74, 0.7], [22, 78, 0.6], [32, 78, 0.7], [48, 76, 0.8], [60, 50, 1],
      [75, 42, 1], [88, 60, 1], [100, 55, 0.5],
    ],
  },
  {
    section: "posters",
    keys: [
      [8, 66, 0.7], [16, 82, 0.6], [26, 90, 0.6], [34, 106, 0.7], [52, 112, 0.8], [68, 104, 1],
      [78, 84, 1], [88, 90, 1], [100, 78, 0.8],
    ],
  },
  {
    section: "why",
    keys: [
      [8, 84, 0.8], [14, 104, 0.7], [22, 114, 1], [40, 122, 1], [58, 112, 1], [76, 120, 1],
      [96, 108, 1], [100, 100, 0.9],
    ],
  },
  {
    section: "faq",
    keys: [
      [8, 84, 0.9], [15, 74, 0.9], [22, 64, 0.9], [30, 70, 0.8], [38, 74, 0.7], [46, 70, 0.8],
      [52, 72, 0.7], [58, 72, 0.7], [63, 74, 0.6], [70, 70, 0.8], [78, 70, 0.9], [86, 74, 0.6], [93, 78, 0.7],
      [100, 84, 0.6],
    ],
  },
  {
    section: "cta",
    keys: [[6, 96, 0.9], [35, 108, 1], [55, 110, 1], [75, 98, 1], [100, 84, 1]],
  },
];

const SPREAD = 3;

const WEAVE = 0.5;

const WEAVE_STEPS = 9;

const WEAVE_MIDDLE = 4;

const LINE_STRIDE = 7;

const KEY_STRIDE = 5;

const ONE_DECIMAL = 1;

const FIRST = 0;

const ONE = 1;

const TOP = 0;

const CENTRE = 1;

const SPREAD_OF = 2;

const MIDDLE_LINE = (TRACE_LINES - ONE) / 2;

const A_TRACE = /<svg class="trace"[^>]*>[\s\S]*?<\/svg>/g;

export const lineX = (line: number, key: number, [, centre, spread]: TraceKey): number => {
  const offset = line - MIDDLE_LINE;
  const weave = (((line * LINE_STRIDE + key * KEY_STRIDE) % WEAVE_STEPS) - WEAVE_MIDDLE) * WEAVE;

  return centre + (offset * SPREAD + weave) * spread;
};

export const polylinesOf = (keys: readonly TraceKey[], firstKey: number): readonly string[] =>
  Array.from({ length: TRACE_LINES }, (_, line) => {
    const points = keys
      .map((key, at) => `${lineX(line, firstKey + at, key).toFixed(ONE_DECIMAL)},${String(key[FIRST])}`)
      .join(" ");

    return `<polyline class="trace-${String(line + ONE)}" points="${points}"/>`;
  });

export const traceMarkup = (polylines: readonly string[]): string =>
  `<svg class="trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${polylines.join("")}</svg>`;

const enteringFrom = (left: TraceKey | null, keys: readonly TraceKey[]): readonly TraceKey[] =>
  left === null ? keys : [[TOP, left[CENTRE], left[SPREAD_OF]], ...keys];

export const tracesOf = (route: readonly TraceSection[]): readonly string[] => {
  let firstKey = FIRST;
  let left: TraceKey | null = null;

  return route.map(({ keys }) => {
    const drawn = enteringFrom(left, keys);
    const markup = traceMarkup(polylinesOf(drawn, firstKey));

    firstKey += drawn.length - ONE;
    left = drawn[drawn.length - ONE] ?? null;

    return markup;
  });
};

export const withTraces = (html: string, traces: readonly string[]): string => {
  let at = FIRST;

  const replaced = html.replace(A_TRACE, () => traces[at++] ?? "");

  if (at !== traces.length) {
    throw new Error(
      `the page carries ${String(at)} trace drawings where the route has ${String(traces.length)} sections`
    );
  }

  return replaced;
};

export const writeSiteTraces = (say: (line: string) => void): void => {
  const traces = tracesOf(TRACE_ROUTE);

  for (const page of LANDING_PAGES) {
    writeFileSync(resolve(rootDir, page), withTraces(read(page), traces), "utf8");
    say(`${page} — ${String(traces.length)} traces redrawn`);
  }
};
