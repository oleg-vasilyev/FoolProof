import { describe, expect, it } from "vitest";
import { polylinesIn, traceComplaints, tracesOn } from "./site-traces.ts";


const ENGLISH = "docs/index.html";

const RUSSIAN = "docs/ru/index.html";

const ONE_COMPLAINT = 1;

const TWO_COMPLAINTS = 2;

const TWO_TRACES = 2;

const FIRST = 0;

const trace = (...polylines: readonly string[]): string =>
  `<svg class="trace" viewBox="0 0 100 100" aria-hidden="true">${polylines
    .map((points) => `<polyline class="trace-1" points="${points}"/>`)
    .join("")}</svg>`;

const page = (...traces: readonly string[]): string => `<main>${traces.join("<section></section>")}</main>`;

const HERO = trace("50.0,0 52.5,50 55.0,100");

const HOW = trace("55.0,0 60.0,100");

const ROUTE = [HERO, HOW];

describe("tracesOn", () => {
  it("should find every trace drawing on the page in order, whole", () => {
    expect(tracesOn(page(HERO, HOW))).toEqual([HERO, HOW]);
  });

  it("should not take an ordinary svg for a trace", () => {
    expect(tracesOn('<svg class="lang-caret"><path d="m6 9 6 6"/></svg>')).toEqual([]);
  });
});

describe("polylinesIn", () => {
  it("should read the points off each line", () => {
    expect(polylinesIn(trace("1,0 2,100", "3,0 4,100"))).toEqual(["1,0 2,100", "3,0 4,100"]);
  });

  it("should count no lines in a trace with none", () => {
    expect(polylinesIn(trace())).toEqual([]);
  });
});

describe("traceComplaints", () => {
  it("should say nothing when both pages carry exactly what the route draws", () => {
    expect(traceComplaints([[ENGLISH, page(HERO, HOW)], [RUSSIAN, page(HERO, HOW)]], ROUTE)).toEqual([]);
  });

  it("should say nothing about no pages", () => {
    expect(traceComplaints([], ROUTE)).toEqual([]);
  });

  it("should refuse a page with fewer traces than the route has sections", () => {
    const found = traceComplaints([[ENGLISH, page(HERO)]], ROUTE);

    expect(found).toHaveLength(ONE_COMPLAINT);
    expect(found[FIRST]).toContain(`${ENGLISH}: carries 1 trace drawings where the route has 2 sections`);
    expect(found[FIRST]).toContain('run "node scripts/tools/tools.ts site-traces"');
  });

  it("should refuse a page with no traces at all, rather than passing it in silence", () => {
    expect(traceComplaints([[ENGLISH, "<main></main>"]], ROUTE)).toHaveLength(ONE_COMPLAINT);
  });

  it("should name the trace whose points differ from the route", () => {
    const moved = trace("55.0,0 61.0,100");

    const [complaint] = traceComplaints([[ENGLISH, page(HERO, moved)]], ROUTE);

    expect(complaint).toContain(`${ENGLISH}: trace 2 is not what the route draws today`);
    expect(complaint).toContain("the route changed and the page did not");
  });

  it("should say how many lines each side draws when a trace lost one", () => {
    const thinned = trace();

    const [complaint] = traceComplaints([[ENGLISH, page(HERO, thinned)]], ROUTE);

    expect(complaint).toContain("0 lines on the page against 1 in the route");
  });

  it("should judge each page on its own, so one stale language does not hide behind the other", () => {
    const found = traceComplaints([[ENGLISH, page(HERO, HOW)], [RUSSIAN, page(HOW, HERO)]], ROUTE);

    expect(found).toHaveLength(TWO_COMPLAINTS);
    expect(found.every((complaint) => complaint.startsWith(RUSSIAN))).toBe(true);
  });

  it("should read exactly two traces off a two-section page", () => {
    expect(tracesOn(page(HERO, HOW))).toHaveLength(TWO_TRACES);
  });
});
