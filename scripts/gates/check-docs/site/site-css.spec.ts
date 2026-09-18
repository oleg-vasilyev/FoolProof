import { describe, expect, it } from "vitest";
import { classesUsedIn, cssComplaints, selectorFor } from "./site-css.ts";


const ONE_COMPLAINT = 1;

const FIRST = 0;

describe("classesUsedIn", () => {
  it("should take every class a page names, across attributes", () => {
    const html = '<div class="a b"><p class="c">x</p></div>';

    expect([...classesUsedIn(html)].sort()).toEqual(["a", "b", "c"]);
  });

  it("should not invent a class from an empty attribute", () => {
    expect([...classesUsedIn('<div class="  ">x</div>')]).toEqual([]);
  });

  it("should find nothing on a page that names no class", () => {
    expect([...classesUsedIn("<p>plain</p>")]).toEqual([]);
  });
});

describe("selectorFor", () => {
  it("should escape what a Tailwind class puts in a selector", () => {
    expect(selectorFor("md:w-1/2")).toBe(".md\\:w-1\\/2");
  });

  it("should escape the brackets and commas an arbitrary value brings", () => {
    expect(selectorFor("lg:h-[clamp(480px,78vh,820px)]")).toBe(
      ".lg\\:h-\\[clamp\\(480px\\,78vh\\,820px\\)\\]"
    );
  });

  it("should leave a plain class alone but for its dot", () => {
    expect(selectorFor("card")).toBe(".card");
  });
});

describe("cssComplaints", () => {
  it("should say nothing when the stylesheet carries a rule for every class", () => {
    expect(cssComplaints(".card{}", [["docs/index.html", '<div class="card">x</div>']])).toEqual([]);
  });

  it("should name the class, the page, and the command that fixes it", () => {
    const said = cssComplaints("", [["docs/index.html", '<div class="card">x</div>']]);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('carries no rule for "card"');
    expect(said[FIRST]).toContain("docs/index.html uses");
    expect(said[FIRST]).toContain("node scripts/tools/tools.ts site-css");
  });

  it("should read a class whose selector needs escaping against the escaped form", () => {
    const page: readonly [string, string] = ["docs/index.html", '<div class="md:w-1/2">x</div>'];

    expect(cssComplaints(".md\\:w-1\\/2{}", [page])).toEqual([]);
  });
});
