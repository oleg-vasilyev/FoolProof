import { LANDING_PAGES } from "../../../tools/site-css.ts";
import { TRACE_ROUTE, TRACE_TOOL, tracesOf } from "../../../tools/site-traces.ts";
import { read } from "../shared/document-files.ts";
import { FIRST_GROUP } from "../shared/markdown-text.ts";


const ONE = 1;

const A_TRACE = /<svg class="trace"[^>]*>[\s\S]*?<\/svg>/g;

const A_POLYLINE = /<polyline [^>]*points="([^"]*)"/g;

export const tracesOn = (html: string): readonly string[] => html.match(A_TRACE) ?? [];

export const polylinesIn = (trace: string): readonly string[] =>
  [...trace.matchAll(A_POLYLINE)].map((match) => match[FIRST_GROUP] ?? "");

export const traceComplaints = (
  pages: readonly (readonly [string, string])[],
  expected: readonly string[]
): readonly string[] =>
  pages.flatMap(([page, html]) => {
    const drawn = tracesOn(html);

    if (drawn.length !== expected.length) {
      return [
        `${page}: carries ${String(drawn.length)} trace drawings where the route has ` +
          `${String(expected.length)} sections — a section was added or a drawing lost, and the ` +
          `chart behind the page is not what the route says; run "${TRACE_TOOL}"`,
      ];
    }

    return drawn.flatMap((trace, at) =>
      trace === expected[at]
        ? []
        : [
            `${page}: trace ${String(at + ONE)} is not what the route draws today — ` +
              `${String(polylinesIn(trace).length)} lines on the page against ` +
              `${String(polylinesIn(expected[at] ?? "").length)} in the route, or the same lines through ` +
              `other points; the route changed and the page did not, so run "${TRACE_TOOL}"`,
          ]
    );
  });

export const tracesTheRouteNoLongerDraws = (): readonly string[] =>
  traceComplaints(
    LANDING_PAGES.map((page) => [page, read(page)] as const),
    tracesOf(TRACE_ROUTE)
  );
