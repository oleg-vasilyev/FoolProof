import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";


const env = new EnvStub({});

const writeFileSpy = vi.fn();

const readSpy = vi.fn();

vi.mock("#shared/config/env.ts", () => env.module);

vi.mock("node:fs", () => ({
  writeFileSync: (...args: unknown[]) => writeFileSpy(...args),
}));

vi.mock("../gates/check-docs/document-files.ts", () => ({
  read: (path: string) => readSpy(path),
}));

const LANDING_PAGES = ["site/one.html", "site/two.html"];

vi.mock("./site-css.ts", () => ({
  LANDING_PAGES,
}));

const {
  TRACE_LINES,
  TRACE_ROUTE,
  lineX,
  polylinesOf,
  traceMarkup,
  tracesOf,
  withTraces,
  writeSiteTraces,
} = await import("./site-traces.ts");

const FIRST = 0;

const ONE = 1;

const TWO = 2;

const TOP = 0;

const BOTTOM = 100;

const CENTRE = 50;

const NO_SPREAD = 0;

const FULL_SPREAD = 1;

const AT_CENTRE_LINE = 2;

const A_LATER_KEY = 3;

const A_TRACE = '<svg class="trace" viewBox="0 0 100 100"><polyline points="0,0"/></svg>';

const ANOTHER_TRACE = '<svg class="trace" viewBox="0 0 100 100"><polyline points="1,1"/></svg>';

const A_PAGE = `<section>${A_TRACE}</section><section>${ANOTHER_TRACE}</section>`;

const xOf = (point: string): number => Number(point.split(",")[FIRST]);

describe("lineX", () => {
  it("should put every line at the centre when the route has no spread", () => {
    const xs = Array.from({ length: TRACE_LINES }, (_, line) => lineX(line, FIRST, [TOP, CENTRE, NO_SPREAD]));

    expect(xs).toEqual(Array.from({ length: TRACE_LINES }, () => CENTRE));
  });

  it("should fan the lines out on both sides of the centre at full spread", () => {
    const xs = Array.from({ length: TRACE_LINES }, (_, line) => lineX(line, FIRST, [TOP, CENTRE, FULL_SPREAD]));

    expect(Math.min(...xs)).toBeLessThan(CENTRE);
    expect(Math.max(...xs)).toBeGreaterThan(CENTRE);
  });

  it("should weave a line differently from one key to the next, so no two segments run parallel", () => {
    const here = lineX(AT_CENTRE_LINE, FIRST, [TOP, CENTRE, FULL_SPREAD]);
    const later = lineX(AT_CENTRE_LINE, A_LATER_KEY, [TOP, CENTRE, FULL_SPREAD]);

    expect(here).not.toBe(later);
  });
});

describe("polylinesOf", () => {
  it("should draw one polyline per line, numbered from one", () => {
    const drawn = polylinesOf([[TOP, CENTRE, NO_SPREAD], [BOTTOM, CENTRE, NO_SPREAD]], FIRST);

    expect(drawn).toHaveLength(TRACE_LINES);
    expect(drawn[FIRST]).toContain('class="trace-1"');
    expect(drawn[TRACE_LINES - ONE]).toContain(`class="trace-${String(TRACE_LINES)}"`);
  });

  it("should write each key as an x to one decimal and the key's own height", () => {
    const [line] = polylinesOf([[TOP, CENTRE, NO_SPREAD], [BOTTOM, CENTRE, NO_SPREAD]], FIRST);

    expect(line).toContain('points="50.0,0 50.0,100"');
  });
});

describe("traceMarkup", () => {
  it("should wrap the lines in a stretched, decorative svg", () => {
    const markup = traceMarkup(["<polyline/>"]);

    expect(markup).toContain('class="trace"');
    expect(markup).toContain('preserveAspectRatio="none"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("<polyline/>");
  });
});

describe("tracesOf", () => {
  it("should draw one trace per section of the route", () => {
    expect(tracesOf(TRACE_ROUTE)).toHaveLength(TRACE_ROUTE.length);
  });

  it("should end each line where it starts in the next section, so the seam does not show", () => {
    const traces = tracesOf(TRACE_ROUTE);
    const pointsOf = (trace: string): readonly string[] =>
      [...trace.matchAll(/points="([^"]*)"/g)].map((match) => match[ONE] ?? "");

    traces.slice(FIRST, traces.length - ONE).forEach((trace, at) => {
      const above = pointsOf(trace);
      const below = pointsOf(traces[at + ONE] ?? "");

      above.forEach((points, line) => {
        const leaves = points.split(" ").at(-ONE) ?? "";
        const enters = below[line]?.split(" ")[FIRST] ?? "";

        expect(xOf(leaves)).toBe(xOf(enters));
      });
    });
  });

  it("should begin the route under the header and end it on the footer line", () => {
    const [firstSection] = TRACE_ROUTE;
    const lastSection = TRACE_ROUTE.at(-ONE);

    expect(firstSection?.keys[FIRST]?.[FIRST]).toBe(TOP);
    expect(lastSection?.keys.at(-ONE)?.[FIRST]).toBe(BOTTOM);
  });
});

describe("withTraces", () => {
  it("should replace each trace drawing on the page in order", () => {
    const replaced = withTraces(A_PAGE, ["<svg class=\"trace\">one</svg>", "<svg class=\"trace\">two</svg>"]);

    expect(replaced).toBe(
      '<section><svg class="trace">one</svg></section><section><svg class="trace">two</svg></section>'
    );
  });

  it("should refuse a page carrying a different number of traces than the route has sections", () => {
    expect(() => withTraces(A_PAGE, ["<svg class=\"trace\">one</svg>"])).toThrow(
      "the page carries 2 trace drawings where the route has 1 sections"
    );
    expect(() => withTraces(A_PAGE, [])).toThrow("carries 2 trace drawings where the route has 0");
  });

  it("should refuse a page with fewer traces than sections", () => {
    expect(() => withTraces(A_TRACE, ["<svg/>", "<svg/>", "<svg/>"])).toThrow(
      "the page carries 1 trace drawings where the route has 3 sections"
    );
  });
});

describe("writeSiteTraces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readSpy.mockReturnValue(Array.from({ length: TRACE_ROUTE.length }, () => A_TRACE).join("\n"));
  });

  it("should redraw both landing pages under the project root", () => {
    const say = vi.fn();

    writeSiteTraces(say);

    expect(readSpy.mock.calls.map(([page]) => page)).toEqual(LANDING_PAGES);
    expect(writeFileSpy).toHaveBeenCalledTimes(LANDING_PAGES.length);
    expect(writeFileSpy.mock.calls[FIRST]?.[FIRST]).toBe(resolve(env.rootDir, LANDING_PAGES[FIRST] ?? ""));
    expect(String(writeFileSpy.mock.calls[FIRST]?.[ONE])).toContain('class="trace-1"');
    expect(writeFileSpy.mock.calls[FIRST]?.[TWO]).toBe("utf8");
  });

  it("should say what it redrew, page by page", () => {
    const say = vi.fn();

    writeSiteTraces(say);

    expect(say).toHaveBeenCalledWith(`${LANDING_PAGES[FIRST] ?? ""} — ${String(TRACE_ROUTE.length)} traces redrawn`);
  });
});
