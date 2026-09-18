import { describe, expect, it } from "vitest";
import { blocksOnPage, languageOf, numbersIn, type PageText } from "./page-blocks.ts";


const PAGE = "docs/index.html";

const NONE = 0;

const ONE = 1;

const TWO = 2;

const FIRST = 0;

const SECOND = 1;

const aPage = (html: string): PageText => blocksOnPage(html);

describe("numbersIn", () => {
  it("should read a number printed with a thousands gap as one number", () => {
    expect(numbersIn("15 829 lines and 11 332 more")).toEqual(["15829", "11332"]);
  });

  it("should read a lone digit", () => {
    expect(numbersIn("Game 3")).toEqual(["3"]);
  });

  it("should read an English thousands comma as a gap and not as a list", () => {
    expect(numbersIn("15,829 lines; games 1, 2 and 3")).toEqual(["15829", "1", "2", "3"]);
  });

  it("should not join two numbers that a comma and a space separate", () => {
    expect(numbersIn("17 of 263, 5 of them")).toEqual(["17", "263", "5"]);
  });

  it("should read a four-digit year whole", () => {
    expect(numbersIn("in 2026")).toEqual(["2026"]);
  });

  it("should read nothing from prose without digits", () => {
    expect(numbersIn("two to ten players")).toEqual([]);
  });
});

describe("languageOf", () => {
  it("should read the language from the page's folder", () => {
    expect(languageOf("docs/ru/case-study/index.html")).toBe("ru");
  });

  it("should take a page outside a language folder as English", () => {
    expect(languageOf("docs/index.html")).toBe("en");
  });
});

describe("blocksOnPage", () => {
  it("should read the text of a marked element", () => {
    const { blocks } = aPage('<p data-block="hero.title">You play.</p>');

    expect(blocks[FIRST]?.text).toBe("You play.");
  });

  it("should keep blocks in page order", () => {
    const { blocks } = aPage('<h1 data-block="a.x">A</h1><p data-block="b.y">B</p>');

    expect(blocks.map((block) => block.id)).toEqual(["a.x", "b.y"]);
  });

  it("should flatten the whitespace a page wraps a paragraph with", () => {
    const { blocks } = aPage('<p data-block="a.x">\n  One\n  two.\n</p>');

    expect(blocks[FIRST]?.text).toBe("One two.");
  });

  it("should report text that sits outside any block", () => {
    const { stray } = aPage('<div><p data-block="a.x">In.</p><p>Out.</p></div>');

    expect(stray).toEqual(["Out."]);
  });

  it("should not report whitespace between tags as stray text", () => {
    const { stray } = aPage('<div>\n  <p data-block="a.x">In.</p>\n</div>');

    expect(stray).toEqual([]);
  });

  it("should not read what a script, a style or an svg holds", () => {
    const { stray } = aPage(
      "<script>const x = 1;</script><style>p{}</style><svg><title>Icon</title></svg>"
    );

    expect(stray).toEqual([]);
  });

  it("should not read the head or the doctype", () => {
    const { stray } = aPage("<!DOCTYPE html><html><head><title>T</title></head><body></body></html>");

    expect(stray).toEqual([]);
  });

  it("should not read an html comment", () => {
    const { stray } = aPage("<body><!-- a note --></body>");

    expect(stray).toEqual([]);
  });

  it("should count the block-level text elements inside a block", () => {
    const { blocks } = aPage('<li data-block="a.x"><h3>T</h3><p>B</p></li>');

    expect(blocks[FIRST]?.elements).toBe(TWO);
  });

  it("should count no inner element for a block that is itself the paragraph", () => {
    const { blocks } = aPage('<p data-block="a.x">B <code>x</code></p>');

    expect(blocks[FIRST]?.elements).toBe(NONE);
  });

  it("should read the numbers a block prints", () => {
    const { blocks } = aPage('<p data-block="a.x">0 → 5 043 tests</p>');

    expect(blocks[FIRST]?.numbers).toEqual(["0", "5043"]);
  });

  it("should read a number written as an entity gap as one number", () => {
    const { blocks } = aPage('<p data-block="a.x">15&nbsp;829 lines</p>');

    expect(blocks[FIRST]?.numbers).toEqual(["15829"]);
  });

  it("should read a cited commit from a hash link and keep its digits out of the numbers", () => {
    const { blocks } = aPage(
      '<p data-block="a.x">Then <a class="hash" href="#">af08fc5</a> landed 3 files.</p>'
    );

    expect(blocks[FIRST]?.commits).toEqual(["af08fc5"]);
    expect(blocks[FIRST]?.numbers).toEqual(["3"]);
  });

  it("should not take a link that is not a hash for a commit", () => {
    const { blocks } = aPage('<p data-block="a.x"><a class="link" href="#">af08fc5</a></p>');

    expect(blocks[FIRST]?.commits).toEqual([]);
  });

  it("should not take a hash link whose text is not a hash for a commit", () => {
    const { blocks } = aPage('<p data-block="a.x"><a class="hash" href="#">the commit</a></p>');

    expect(blocks[FIRST]?.commits).toEqual([]);
  });

  it("should read the rev a block carries", () => {
    const { blocks } = aPage('<p data-block="a.x" data-rev="2">B</p>');

    expect(blocks[FIRST]?.rev).toBe("2");
  });

  it("should read no rev when a block carries none", () => {
    const { blocks } = aPage('<p data-block="a.x">B</p>');

    expect(blocks[FIRST]?.rev).toBeNull();
  });

  it("should close a block at its own end tag and not at an inner one", () => {
    const { blocks } = aPage('<div data-block="a.x"><p>One</p><p>Two</p></div><p data-block="b.y">Three</p>');

    expect(blocks[FIRST]?.text).toBe("OneTwo");
    expect(blocks[SECOND]?.id).toBe("b.y");
  });

  it("should step over a void element without waiting for its end tag", () => {
    const { blocks } = aPage('<p data-block="a.x">A<br>B<img src="x.png">C</p>');

    expect(blocks[FIRST]?.text).toBe("ABC");
  });

  it("should step over a self-closed element", () => {
    const { blocks } = aPage('<p data-block="a.x">A<path d="M1"/>B</p>');

    expect(blocks[FIRST]?.text).toBe("AB");
  });

  it("should not open a second block inside an open one", () => {
    const { blocks } = aPage('<div data-block="a.x"><p data-block="a.y">In</p></div>');

    expect(blocks.map((block) => block.id)).toEqual(["a.x"]);
  });

  it("should read a decoded entity as its character", () => {
    const { blocks } = aPage('<p data-block="a.x">Tom &amp; Jerry &#8212; &quot;x&quot;</p>');

    expect(blocks[FIRST]?.text).toBe('Tom & Jerry — "x"');
  });

  it("should keep an entity it was never taught as written", () => {
    const { blocks } = aPage('<p data-block="a.x">a &hellip; b</p>');

    expect(blocks[FIRST]?.text).toBe("a &hellip; b");
  });

  it("should read a tag name whatever its case", () => {
    const { blocks } = aPage('<P data-block="a.x">A</P>');

    expect(blocks[FIRST]?.text).toBe("A");
  });

  it("should shorten a long stray line to a quote", () => {
    const { stray } = aPage(`<p>${"x".repeat(60)}</p>`);

    expect(stray[FIRST]).toHaveLength(49);
    expect(stray[FIRST]?.endsWith("…")).toBe(true);
  });

  it("should ignore a stray end tag", () => {
    const { blocks } = aPage('</div><p data-block="a.x">A</p>');

    expect(blocks[FIRST]?.text).toBe("A");
  });

  it("should reopen reading after an unread element closes", () => {
    const { stray } = aPage("<script>x</script><p>Read me</p>");

    expect(stray).toEqual(["Read me"]);
  });

  it("should not stay unread after a self-closed unread element", () => {
    const { stray } = aPage("<svg/><p>Read me</p>");

    expect(stray).toEqual(["Read me"]);
  });

  it("should stay unread past a self-closed element inside an unread one", () => {
    const { stray } = aPage('<svg><path d="M1"/>Icon text</svg>');

    expect(stray).toEqual([]);
  });

  it("should stay unread inside an unread element nested in another", () => {
    const { stray } = aPage("<svg><svg></svg><title>Hidden</title></svg>");

    expect(stray).toEqual([]);
  });

  it("should not let a stray unread end tag open reading of the next unread element", () => {
    const { stray } = aPage("</svg><svg>Hidden</svg>");

    expect(stray).toEqual([]);
  });

  it("should trim the stray text it quotes", () => {
    const { stray } = aPage("<p>  Lost  </p>");

    expect(stray).toEqual(["Lost"]);
  });

  it("should quote a stray line of exactly the quote length whole", () => {
    const { stray } = aPage(`<p>${"x".repeat(48)}</p>`);

    expect(stray).toEqual(["x".repeat(48)]);
  });

  it("should not take a hash link outside any block for a commit", () => {
    const { blocks, stray } = aPage('<a class="hash" href="#">af08fc5</a><p data-block="a.x">A</p>');

    expect(blocks[FIRST]?.commits).toEqual([]);
    expect(stray).toEqual(["af08fc5"]);
  });

  it("should not take a hash-classed element that is not a link for a commit", () => {
    const { blocks } = aPage('<p data-block="a.x"><span class="hash">af08fc5</span></p>');

    expect(blocks[FIRST]?.commits).toEqual([]);
  });

  it("should read a hash link whole when an inner tag splits its text", () => {
    const { blocks } = aPage('<p data-block="a.x"><a class="hash" href="#"><b>af0</b>8fc5</a></p>');

    expect(blocks[FIRST]?.commits).toEqual(["af08fc5"]);
  });

  it("should trim the spaces a hash link wraps its text in", () => {
    const { blocks } = aPage('<p data-block="a.x"><a class="hash" href="#"> af08fc5 </a></p>');

    expect(blocks[FIRST]?.commits).toEqual(["af08fc5"]);
  });

  it("should read two blocks that are siblings in a list and the text after the list as stray", () => {
    const { blocks, stray } = aPage('<ul><li data-block="a.x">A</li><li data-block="a.y">B</li></ul><p>C</p>');

    expect(blocks.map((block) => block.id)).toEqual(["a.x", "a.y"]);
    expect(stray).toEqual(["C"]);
  });

  it("should still read a hash link inside a block after one sat outside any block", () => {
    const { blocks } = aPage(
      '<a class="hash" href="#">1111111</a><p data-block="a.x"><a class="hash" href="#">af08fc5</a></p>'
    );

    expect(blocks[FIRST]?.commits).toEqual(["af08fc5"]);
  });

  it("should not take a class that merely contains the word hash for a hash link", () => {
    const { blocks } = aPage(
      '<p data-block="a.x"><a class="xhash" href="#">af08fc5</a><a class="hashx" href="#">d49d590</a></p>'
    );

    expect(blocks[FIRST]?.commits).toEqual([]);
  });

  it("should not take a hash link whose text has a letter on either side of the hash", () => {
    const { blocks } = aPage(
      '<p data-block="a.x"><a class="hash" href="#">xaf08fc5</a><a class="hash" href="#">af08fc5x</a></p>'
    );

    expect(blocks[FIRST]?.commits).toEqual([]);
  });

  it("should not take a slash inside an attribute for a self-closing tag", () => {
    const { blocks } = aPage('<p data-block="a.x"><a href="https://x/">L</a>ink</p>');

    expect(blocks[FIRST]?.text).toBe("Link");
  });

  it("should read a rev of more than one character", () => {
    const { blocks } = aPage('<p data-block="a.x" data-rev="12">B</p>');

    expect(blocks[FIRST]?.rev).toBe("12");
  });

  it("should read a non-breaking space as a space and angle-bracket entities as brackets", () => {
    const { blocks } = aPage('<p data-block="a.x">a&nbsp;b &lt;i&gt;</p>');

    expect(blocks[FIRST]?.text).toBe("a b <i>");
  });

  it("should not read a comment that carries an angle bracket", () => {
    const { stray } = aPage("<body><!-- a > b --></body>");

    expect(stray).toEqual([]);
  });

  it("should read a number of three gaps as one number", () => {
    const { blocks } = aPage('<p data-block="a.x">1 234 567</p>');

    expect(blocks[FIRST]?.numbers).toEqual(["1234567"]);
  });

  it("should read a block that follows a closed one at a shallower depth", () => {
    const { blocks } = aPage('<div><div data-block="a.x">A</div></div><p data-block="b.y">B</p>');

    expect(blocks.map((block) => block.text)).toEqual(["A", "B"]);
  });
});
