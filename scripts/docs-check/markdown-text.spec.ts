import { describe, expect, it } from "vitest";
import {
  anchorOf,
  backtickedWordsOf,
  headingsOf,
  namesIn,
  withoutFencedBlocks,
} from "./markdown-text.ts";


const NOTHING = 0;

const A_NAMED_SKILL = /the `?([a-z][a-z0-9-]*[a-z0-9])`? skill/g;

describe("headingsOf", () => {
  it("should take every heading with its hashes stripped, at any depth", () => {
    const document = "# One\n\nprose\n\n## Two\n\n### Three\n";

    expect(headingsOf(document)).toEqual(["One", "Two", "Three"]);
  });

  it("should not read a hash that is not at the start of its line", () => {
    expect(headingsOf("prose about # not a heading\n")).toEqual([]);
  });

  it("should not read a hash with no space after it, which renders as text", () => {
    expect(headingsOf("#NotAHeading\n")).toEqual([]);
  });

  it("should find nothing in a document with no headings", () => {
    expect(headingsOf("just prose\n")).toEqual([]);
  });
});

describe("anchorOf", () => {
  it("should lower a heading and join its words with hyphens, as a link does", () => {
    expect(anchorOf("What Survives A Failure")).toBe("what-survives-a-failure");
  });

  it("should drop the punctuation a heading carries, which no anchor keeps", () => {
    expect(anchorOf("Adding a feature: the layers, and why")).toBe(
      "adding-a-feature-the-layers-and-why"
    );
  });

  it("should collapse a run of spaces rather than leaving empty segments", () => {
    expect(anchorOf("One   Two")).toBe("one-two");
  });

  it("should trim what punctuation left at the ends, so no anchor starts with a hyphen", () => {
    expect(anchorOf("`code` at the edge!")).toBe("code-at-the-edge");
  });

  it("should keep a hyphen a heading already carries", () => {
    expect(anchorOf("A well-known trap")).toBe("a-well-known-trap");
  });
});

describe("withoutFencedBlocks", () => {
  it("should take out a fenced block, which is an example rather than a claim", () => {
    expect(withoutFencedBlocks("before\n```\nexample\n```\nafter")).toBe("before\n\nafter");
  });

  it("should take out both of two blocks and keep what sits between them", () => {
    const text = "```\none\n```\nmiddle\n```\ntwo\n```";

    expect(withoutFencedBlocks(text)).toBe("\nmiddle\n");
  });

  it("should leave a document that fences nothing exactly as it was", () => {
    expect(withoutFencedBlocks("plain prose")).toBe("plain prose");
  });
});

describe("backtickedWordsOf", () => {
  it("should take every backticked word a document names", () => {
    expect([...backtickedWordsOf("read `main.ts` and `PLAN.md`")].sort()).toEqual([
      "PLAN.md",
      "main.ts",
    ]);
  });

  it("should split a backticked path into its parts, so each is findable", () => {
    expect([...backtickedWordsOf("`src/main.ts`")].sort()).toEqual(["main.ts", "src"]);
  });

  it("should not read what a fenced block says, which is an example and not a claim", () => {
    expect([...backtickedWordsOf("```\n`inside.ts`\n```")]).toHaveLength(NOTHING);
  });

  it("should find nothing in prose that quotes nothing", () => {
    expect([...backtickedWordsOf("plain prose")]).toHaveLength(NOTHING);
  });
});

describe("namesIn", () => {
  it("should take the first group of every match, which is the name being looked for", () => {
    expect(namesIn("the build-it skill and the ship-it skill", A_NAMED_SKILL)).toEqual([
      "build-it",
      "ship-it",
    ]);
  });

  it("should find nothing when the pattern matches nothing", () => {
    expect(namesIn("nothing here", A_NAMED_SKILL)).toEqual([]);
  });

  it("should read the same text twice alike, so a shared pattern carries no state", () => {
    const text = "the build-it skill";

    expect(namesIn(text, A_NAMED_SKILL)).toEqual(namesIn(text, A_NAMED_SKILL));
  });
});
