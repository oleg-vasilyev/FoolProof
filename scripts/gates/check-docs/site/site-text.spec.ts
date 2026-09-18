import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blocksOnPage, languageOf, type PageText } from "../../../site/page-blocks.ts";
import {
  SITE_TEXT_TREES,
  blocksInTree,
  pagesTheirFactTreeContradicts,
  strayHeadings,
  textComplaints,
  type FactBlock,
} from "./site-text.ts";


const TREE = "docs/text/landing.facts.md";

const PAGE = "docs/index.html";

const OTHER_PAGE = "docs/ru/index.html";

const NONE = 0;

const ONE = 1;

const TWO = 2;

const FIRST = 0;

const SECOND = 1;

const aTree = (body: string): string => `# A page\n\nIntro.\n\n${body}`;

const aBlock = (overrides: Partial<FactBlock> = {}): FactBlock => ({
  id: "hero.title",
  granularity: "paragraph",
  facts: ONE,
  numbers: [],
  numbersIn: {},
  commits: [],
  rev: null,
  overwrittenFields: [],
  ...overrides,
});

const aPage = (html: string): PageText => blocksOnPage(html);

describe("blocksInTree", () => {
  it("should name a block after its section and its heading", () => {
    const [block] = blocksInTree(aTree("## hero\n\n### title\n- The line.\n"));

    expect(block?.id).toBe("hero.title");
  });

  it("should count the fact bullets under a block", () => {
    const [block] = blocksInTree(aTree("## hero\n\n### lead\n- One.\n- Two.\n"));

    expect(block?.facts).toBe(TWO);
  });

  it("should read the numbers a block may print, with their gaps removed", () => {
    const [block] = blocksInTree(aTree("## tiles\n\n### tests\n- Tests.\nnumbers: 0, 5 043\n"));

    expect(block?.numbers).toEqual(["0", "5043"]);
  });

  it("should read the numbers only one language prints as digits, under that language", () => {
    const [block] = blocksInTree(aTree("## era\n\n### lead\n- A.\nnumbers: 7\nnumbers-en: 2\n"));

    expect(block?.numbers).toEqual(["7"]);
    expect(block?.numbersIn).toEqual({ en: ["2"] });
  });

  it("should name a field the tree wrote twice under one block", () => {
    const [block] = blocksInTree(aTree("## era\n\n### lead\n- A.\nnumbers: 7\nnumbers: 9\n"));

    expect(block?.overwrittenFields).toEqual(["numbers"]);
    expect(block?.numbers).toEqual(["9"]);
  });

  it("should leave a block under the last section named, not under a heading of prose after it", () => {
    const blocks = blocksInTree(aTree("## era\n\n## Notes\n\n### p1\n- A.\n"));

    expect(blocks.map((block) => block.id)).toEqual(["era.p1"]);
  });

  it("should keep a block under its own heading when the heading before it is one lowercase word", () => {
    const blocks = blocksInTree(aTree("## era\n\n### tile-2\n- A.\n"));

    expect(blocks.map((block) => block.id)).toEqual(["era.tile-2"]);
  });

  it("should name a field written on three lines once, not once per extra line", () => {
    const [block] = blocksInTree(aTree("## era\n\n### lead\n- A.\nnumbers: 7\nnumbers: 9\nnumbers: 4\n"));

    expect(block?.overwrittenFields).toEqual(["numbers"]);
  });

  it("should leave a field written once unreported, in every block", () => {
    const blocks = blocksInTree(aTree("## era\n\n### lead\n- A.\nnumbers: 7\n\n### p1\n- B.\nnumbers: 9\n"));

    expect(blocks.map((block) => block.overwrittenFields)).toEqual([[], []]);
  });

  it("should read the commits a block may cite", () => {
    const [block] = blocksInTree(aTree("## era\n\n### p1\n- A.\ncommits: af08fc5, d49d590\n"));

    expect(block?.commits).toEqual(["af08fc5", "d49d590"]);
  });

  it("should default a block to paragraph granularity", () => {
    const [block] = blocksInTree(aTree("## era\n\n### p1\n- A.\n"));

    expect(block?.granularity).toBe("paragraph");
  });

  it("should read section granularity when a block declares it", () => {
    const [block] = blocksInTree(aTree("## era\n\n### story\n- A.\ngranularity: section\n"));

    expect(block?.granularity).toBe("section");
  });

  it("should read a rev when a block carries one", () => {
    const [block] = blocksInTree(aTree("## era\n\n### p1\n- A.\nrev: 3\n"));

    expect(block?.rev).toBe("3");
  });

  it("should keep the blocks in file order across sections", () => {
    const blocks = blocksInTree(aTree("## a\n\n### x\n- A.\n\n## b\n\n### y\n- B.\n"));

    expect(blocks.map((block) => block.id)).toEqual(["a.x", "b.y"]);
  });

  it("should ignore a field line that comes before any block", () => {
    expect(blocksInTree(aTree("numbers: 5\n\n## a\n\n### x\n- A.\n"))[FIRST]?.numbers).toEqual([]);
  });

  it("should ignore a fact bullet that comes before any block", () => {
    expect(blocksInTree(aTree("- stray\n\n## a\n\n### x\n- A.\n"))[FIRST]?.facts).toBe(ONE);
  });

  it("should give a block before any section an empty section", () => {
    expect(blocksInTree(aTree("### x\n- A.\n"))[FIRST]?.id).toBe(".x");
  });

  it("should return a block carrying only what a reader of it is promised", () => {
    const [block] = blocksInTree(aTree("## a\n\n### x\n- A.\nnumbers: 5\n"));

    expect(Object.keys(block ?? {}).sort()).toEqual([
      "commits",
      "facts",
      "granularity",
      "id",
      "numbers",
      "numbersIn",
      "overwrittenFields",
      "rev",
    ]);
  });

  it("should start a block with no commits, no numbers and no rev", () => {
    const [block] = blocksInTree(aTree("## a\n\n### x\n- A.\n"));

    expect(block).toMatchObject({ commits: [], numbers: [], numbersIn: {}, rev: null });
  });

  it("should trim the items of a list and drop an empty list", () => {
    const [block] = blocksInTree(aTree("## a\n\n### x\n- A.\ncommits: a1b2c3d , e4f5a6b\nnumbers:   \n"));

    expect(block?.commits).toEqual(["a1b2c3d", "e4f5a6b"]);
    expect(block?.numbers).toEqual([]);
  });

  it("should read a granularity or a rev with the spaces around it trimmed", () => {
    const [block] = blocksInTree(aTree("## a\n\n### x\n- A.\ngranularity:  section \nrev:  3 \n"));

    expect(block?.granularity).toBe("section");
    expect(block?.rev).toBe("3");
  });

  it("should not take a heading with a space in it for a section or a block", () => {
    const blocks = blocksInTree(aTree("## a b\n\n### x y\n- A.\n\n### x\n- A.\n"));

    expect(blocks.map((block) => block.id)).toEqual([".x"]);
  });

  it("should not take a dash inside a line for a fact bullet", () => {
    expect(blocksInTree(aTree("## a\n\n### x\n- A.\ntext - not a fact\n"))[FIRST]?.facts).toBe(ONE);
  });

  it("should not take a field name inside a line for a field", () => {
    expect(blocksInTree(aTree("## a\n\n### x\n- A.\nsee numbers: 5\n"))[FIRST]?.numbers).toEqual([]);
  });

  it("should split a list at a comma with no space after it", () => {
    expect(blocksInTree(aTree("## a\n\n### x\n- A.\ncommits: a1b2c3d,e4f5a6b\n"))[FIRST]?.commits).toEqual([
      "a1b2c3d",
      "e4f5a6b",
    ]);
  });

  it("should read an explicit paragraph granularity as paragraph", () => {
    expect(blocksInTree(aTree("## a\n\n### x\n- A.\ngranularity: paragraph\n"))[FIRST]?.granularity).toBe(
      "paragraph"
    );
  });
});

describe("strayHeadings", () => {
  it("should refuse a block heading inside a section that is not one lowercase word", () => {
    const [complaint] = strayHeadings(TREE, aTree("## era\n\n### p1\n- A.\n\n### Tile-2\n- B.\n"));

    expect(complaint).toContain('the heading "### Tile-2" stands inside a section and names nothing');
  });

  it("should refuse a section heading of prose once a real section has opened", () => {
    const [complaint] = strayHeadings(TREE, aTree("## era\n\n### p1\n- A.\n\n## Notes\n"));

    expect(complaint).toContain('the heading "## Notes" stands inside a section');
  });

  it("should leave a heading of prose before the first section alone", () => {
    expect(strayHeadings(TREE, aTree("## The page's job\n\n## era\n\n### p1\n- A.\n"))).toEqual([]);
  });

  it("should leave the repository's own trees without a stray heading", () => {
    expect(SITE_TEXT_TREES.flatMap(({ tree }) => strayHeadings(tree, readFileSync(tree, "utf8")))).toEqual([]);
  });
});

describe("textComplaints", () => {
  const green = (facts: readonly FactBlock[], html: string): readonly string[] =>
    textComplaints(TREE, facts, [[PAGE, aPage(html)]]);

  it("should say nothing when the page carries the tree's blocks in order", () => {
    expect(
      green(
        [aBlock({ id: "a.x" }), aBlock({ id: "b.y" })],
        '<h1 data-block="a.x">A</h1><p data-block="b.y">B</p>'
      )
    ).toEqual([]);
  });

  it("should name the block a page lacks", () => {
    const [complaint] = green([aBlock({ id: "a.x" }), aBlock({ id: "b.y" })], '<p data-block="a.x">A</p>');

    expect(complaint).toContain(`${PAGE}: has no block "b.y"`);
  });

  it("should name a block the tree does not list, and nothing else about it", () => {
    const complaints = green([aBlock({ id: "a.x" })], '<p data-block="a.x">A</p><p data-block="a.z">Z</p>');

    expect(complaints).toEqual([
      `${PAGE}: carries a block "a.z" that ${TREE} does not list — add it to the tree first, so the ` +
        `other language owes the same paragraph`,
    ]);
  });

  it("should not complain about order when a block is unknown, since that complaint already says it", () => {
    const complaints = green(
      [aBlock({ id: "a.x" }), aBlock({ id: "b.y" })],
      '<p data-block="b.y">B</p><p data-block="a.z">Z</p><p data-block="a.x">A</p>'
    );

    expect(complaints).toHaveLength(ONE);
    expect(complaints[FIRST]).toContain("does not list");
  });

  it("should say when one block of three is out of place", () => {
    const [complaint] = green(
      [aBlock({ id: "a.x" }), aBlock({ id: "b.y" }), aBlock({ id: "c.z" })],
      '<p data-block="a.x">A</p><p data-block="c.z">C</p><p data-block="b.y">B</p>'
    );

    expect(complaint).toBe(`${PAGE}: its blocks run in a different order from ${TREE} — the pages keep the tree's order`);
  });

  it("should hold each block to its own facts and not the first block's", () => {
    const [complaint] = green(
      [aBlock({ id: "a.x" }), aBlock({ id: "b.y", numbers: ["3"] })],
      '<p data-block="a.x">A</p><p data-block="b.y">B</p>'
    );

    expect(complaint).toContain('block "b.y" carries the numbers []');
  });

  it("should say the whole of a stray-text complaint", () => {
    const [complaint] = green([aBlock({ id: "a.x" })], '<p data-block="a.x">A</p><p>Lost</p>');

    expect(complaint).toBe(
      `${PAGE}: the text "Lost" sits outside any data-block — every line a person reads belongs ` +
        `to a block of ${TREE}, or the other language never owes it`
    );
  });

  it("should say the whole of a thin-block complaint", () => {
    const [complaint] = green([aBlock({ id: "a.x", facts: NONE })], '<p data-block="a.x">A</p>');

    expect(complaint).toBe(
      `${TREE}: block "a.x" lists no fact — a slot in the structure has to say what the paragraph ` +
        `is there to tell, or the writer fills it with whatever the other language said`
    );
  });

  it("should say when the blocks run out of order", () => {
    const [complaint] = green(
      [aBlock({ id: "a.x" }), aBlock({ id: "b.y" })],
      '<p data-block="b.y">B</p><p data-block="a.x">A</p>'
    );

    expect(complaint).toContain("different order");
  });

  it("should not complain about order when a block is missing, since that complaint already says it", () => {
    const complaints = green([aBlock({ id: "a.x" }), aBlock({ id: "b.y" })], '<p data-block="b.y">B</p>');

    expect(complaints).toHaveLength(ONE);
    expect(complaints[FIRST]).toContain("has no block");
  });

  it("should quote text that sits outside any block", () => {
    const [complaint] = green([aBlock({ id: "a.x" })], '<p data-block="a.x">A</p><p>Lost line</p>');

    expect(complaint).toContain('the text "Lost line" sits outside any data-block');
  });

  it("should refuse an empty block", () => {
    const [complaint] = green([aBlock({ id: "a.x" })], '<p data-block="a.x"></p>');

    expect(complaint).toContain('block "a.x" says nothing');
  });

  it("should refuse a paragraph block holding two paragraphs, and say how to allow it", () => {
    const [complaint] = green([aBlock({ id: "a.x" })], '<li data-block="a.x"><h3>T</h3><p>B</p></li>');

    expect(complaint).toBe(
      `${PAGE}: block "a.x" holds 2 paragraphs where ${TREE} allows one — split it into one ` +
        `block per paragraph, or mark the block "granularity: section" in the tree if this ` +
        `stretch may be paced differently per language`
    );
  });

  it("should say the whole of a number complaint", () => {
    const [complaint] = green([aBlock({ id: "a.x", numbers: ["3", "4"] })], '<p data-block="a.x">3 of 5</p>');

    expect(complaint).toBe(
      `${PAGE}: block "a.x" carries the numbers [3, 5] and ${TREE} says [3, 4] — a number the two ` +
        `pages could disagree on is listed in the tree first, and the text follows it; one only ` +
        `this language prints as digits goes under "numbers-en:"`
    );
  });

  it("should say the whole of a commit complaint", () => {
    const [complaint] = green(
      [aBlock({ id: "a.x", commits: ["af08fc5", "d49d590"] })],
      '<p data-block="a.x"><a class="hash" href="#">af08fc5</a> <a class="hash" href="#">1234567</a></p>'
    );

    expect(complaint).toBe(
      `${PAGE}: block "a.x" cites the commits [af08fc5, 1234567] and ${TREE} says [af08fc5, d49d590] ` +
        `— every hash a reader can follow is a fact of the tree`
    );
  });

  it("should accept the tree's numbers when the page prints them in the reverse order", () => {
    expect(green([aBlock({ id: "a.x", numbers: ["0", "5043"] })], '<p data-block="a.x">5 043 → 0</p>')).toEqual([]);
  });

  it("should allow one inner paragraph in a paragraph block", () => {
    expect(green([aBlock({ id: "a.x" })], '<li data-block="a.x"><p>B</p></li>')).toEqual([]);
  });

  it("should allow many paragraphs in a section block", () => {
    expect(
      green([aBlock({ id: "a.x", granularity: "section" })], '<div data-block="a.x"><p>B</p><p>C</p></div>')
    ).toEqual([]);
  });

  it("should refuse a number the tree does not list", () => {
    const [complaint] = green([aBlock({ id: "a.x" })], '<p data-block="a.x">Game 3</p>');

    expect(complaint).toContain(`carries the numbers [3] and ${TREE} says []`);
  });

  it("should refuse a number the tree lists and the text lacks", () => {
    const [complaint] = green([aBlock({ id: "a.x", numbers: ["3"] })], '<p data-block="a.x">Game</p>');

    expect(complaint).toContain("carries the numbers [] and");
  });

  it("should accept the tree's numbers in any order", () => {
    expect(
      green([aBlock({ id: "a.x", numbers: ["5043", "0"] })], '<p data-block="a.x">0 → 5 043</p>')
    ).toEqual([]);
  });

  it("should ask a page only for the numbers listed under its own language", () => {
    const facts = [aBlock({ id: "a.x", numbers: ["7"], numbersIn: { en: ["2"] } })];

    expect(
      textComplaints(TREE, facts, [
        [PAGE, aPage('<p data-block="a.x">era 2, 7 gates</p>')],
        [OTHER_PAGE, aPage('<p data-block="a.x">во второй эпохе, 7 гейтов</p>')],
      ])
    ).toEqual([]);
  });

  it("should name the language field a page's extra number would go under", () => {
    const [complaint] = textComplaints(TREE, [aBlock({ id: "a.x" })], [
      [OTHER_PAGE, aPage('<p data-block="a.x">эпоха 2</p>')],
    ]);

    expect(complaint).toContain('"numbers-ru:"');
  });

  it("should refuse a stranger hiding behind a number the tree repeats", () => {
    const [complaint] = green(
      [aBlock({ id: "a.x", numbers: ["2", "2", "2"] })],
      '<p data-block="a.x">2 and 2 and 9</p>'
    );

    expect(complaint).toContain("carries the numbers [2, 2, 9]");
  });

  it("should refuse a number repeated where the tree lists it once", () => {
    const [complaint] = green([aBlock({ id: "a.x", numbers: ["3"] })], '<p data-block="a.x">3 of 3</p>');

    expect(complaint).toContain("carries the numbers [3, 3]");
  });

  it("should refuse a commit the tree does not list", () => {
    const [complaint] = green(
      [aBlock({ id: "a.x" })],
      '<p data-block="a.x">A <a class="hash" href="#">af08fc5</a></p>'
    );

    expect(complaint).toContain(`cites the commits [af08fc5] and ${TREE} says []`);
  });

  it("should refuse a commit the tree lists and the text does not cite", () => {
    const [complaint] = green([aBlock({ id: "a.x", commits: ["af08fc5"] })], '<p data-block="a.x">A</p>');

    expect(complaint).toContain("cites the commits [] and");
  });

  it("should refuse a block whose rev is behind the tree's", () => {
    const [complaint] = green([aBlock({ id: "a.x", rev: "2" })], '<p data-block="a.x" data-rev="1">A</p>');

    expect(complaint).toContain("is at rev 1 and");
    expect(complaint).toContain('set data-rev="2"');
  });

  it("should refuse a block with no rev when the tree has one", () => {
    const [complaint] = green([aBlock({ id: "a.x", rev: "2" })], '<p data-block="a.x">A</p>');

    expect(complaint).toContain("is at rev none");
  });

  it("should accept a block at the tree's rev", () => {
    expect(green([aBlock({ id: "a.x", rev: "2" })], '<p data-block="a.x" data-rev="2">A</p>')).toEqual([]);
  });

  it("should not ask for a rev the tree never set", () => {
    expect(green([aBlock({ id: "a.x" })], '<p data-block="a.x" data-rev="7">A</p>')).toEqual([]);
  });

  it("should refuse a tree block with no fact", () => {
    const [complaint] = green([aBlock({ id: "a.x", facts: NONE })], '<p data-block="a.x">A</p>');

    expect(complaint).toContain(`${TREE}: block "a.x" lists no fact`);
  });

  it("should refuse a block the tree declares twice", () => {
    const [complaint] = green([aBlock({ id: "a.x" }), aBlock({ id: "a.x" })], '<p data-block="a.x">A</p>');

    expect(complaint).toContain('block "a.x" is declared twice');
  });

  it("should refuse a block whose field is written on two lines, since the second replaces the first", () => {
    const complaints = green([aBlock({ id: "a.x", overwrittenFields: ["numbers"] })], '<p data-block="a.x">A</p>');

    expect(complaints).toEqual([
      `${TREE}: block "a.x" lists "numbers:" more than once — a field is written on one line, and ` +
        `a later one silently replaces the first rather than adding to it`,
    ]);
  });

  it("should find the repository's own pages in step with their trees", () => {
    expect(pagesTheirFactTreeContradicts()).toEqual([]);
  });

  it("should hold each tree to an English page and its Russian twin", () => {
    for (const { tree, pages } of SITE_TEXT_TREES) {
      expect(tree.startsWith("docs/text/")).toBe(true);
      expect(pages.map(languageOf)).toEqual(["en", "ru"]);
    }
  });

  it("should hold every page to the tree, naming each", () => {
    const complaints = textComplaints(
      TREE,
      [aBlock({ id: "a.x" })],
      [
        [PAGE, aPage('<p data-block="a.x">A</p>')],
        [OTHER_PAGE, aPage("<p>Б</p>")],
      ]
    );

    expect(complaints).toHaveLength(TWO);
    expect(complaints.every((complaint) => complaint.startsWith(OTHER_PAGE))).toBe(true);
  });
});
