import { describe, expect, it } from "vitest";
import {
  classesUsedIn,
  cssComplaints,
  imageComplaints,
  selectorFor,
  sizeOfDrawing,
} from "./the-website.ts";


const A_HEADER = 64;

const ONE_COMPLAINT = 1;

const FIRST = 0;

const PAGE = "docs/index.html";

const KILOBYTE = 1024;

const THE_BUDGET = 220 * KILOBYTE;

const ONE_BYTE = 1;

const PAST_THE_BUDGET = 300 * KILOBYTE;

const DRAWN_WIDE = 200;

const DRAWN_TALL = 100;

const PNG_WIDTH_AT = 16;

const PNG_HEIGHT_AT = 20;

const WEBP_FOURCC_AT = 12;

const WEBP_VP8_WIDTH_AT = 26;

const WIDE = 1400;

const TALL = 2100;

const TOO_SHORT = 8;

const pngOf = (wide: number, tall: number): Buffer => {
  const bytes = Buffer.alloc(A_HEADER);

  Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(bytes);
  bytes.writeUInt32BE(wide, PNG_WIDTH_AT);
  bytes.writeUInt32BE(tall, PNG_HEIGHT_AT);

  return bytes;
};

const lossyWebpOf = (wide: number, tall: number): Buffer => {
  const bytes = Buffer.alloc(A_HEADER);

  bytes.write("RIFF", 0, "ascii");
  bytes.write("VP8 ", WEBP_FOURCC_AT, "ascii");
  bytes.writeUInt16LE(wide, WEBP_VP8_WIDTH_AT);
  bytes.writeUInt16LE(tall, WEBP_VP8_WIDTH_AT + 2);

  return bytes;
};

describe("sizeOfDrawing", () => {
  it("should read the size a PNG states in its header", () => {
    expect(sizeOfDrawing(pngOf(WIDE, TALL))).toEqual([WIDE, TALL]);
  });

  it("should read the size a lossy WebP states in its frame", () => {
    expect(sizeOfDrawing(lossyWebpOf(WIDE, TALL))).toEqual([WIDE, TALL]);
  });

  it("should refuse a file too short to hold either header rather than reading past its end", () => {
    expect(sizeOfDrawing(Buffer.alloc(TOO_SHORT))).toBeNull();
  });

  it("should refuse a shape it was never taught, rather than reporting a number it invented", () => {
    const jpeg = Buffer.alloc(A_HEADER);

    jpeg.write("JFIF", 6, "ascii");

    expect(sizeOfDrawing(jpeg)).toBeNull();
  });

  it("should refuse a lossless WebP, which states its size somewhere else entirely", () => {
    const lossless = Buffer.alloc(A_HEADER);

    lossless.write("RIFF", 0, "ascii");
    lossless.write("VP8L", WEBP_FOURCC_AT, "ascii");

    expect(sizeOfDrawing(lossless)).toBeNull();
  });

  it("should ignore the two flag bits a WebP keeps above its fourteen-bit width", () => {
    const flagged = lossyWebpOf(WIDE, TALL);

    flagged.writeUInt16LE(WIDE + 0xc000, WEBP_VP8_WIDTH_AT);

    expect(sizeOfDrawing(flagged)).toEqual([WIDE, TALL]);
  });
});

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
    expect(said[FIRST]).toContain("node scripts/tools.ts site-css");
  });

  it("should read a class whose selector needs escaping against the escaped form", () => {
    const page: readonly [string, string] = ["docs/index.html", '<div class="md:w-1/2">x</div>'];

    expect(cssComplaints(".md\\:w-1\\/2{}", [page])).toEqual([]);
  });
});

describe("imageComplaints", () => {
  const aPng = (wide: number, tall: number): Buffer => {
    const bytes = Buffer.alloc(A_HEADER);

    Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(bytes);
    bytes.writeUInt32BE(wide, PNG_WIDTH_AT);
    bytes.writeUInt32BE(tall, PNG_HEIGHT_AT);

    return bytes;
  };

  const found = (bytes: Buffer) => () => bytes;

  const missing = () => null;

  it("should pass an image drawn at the shape it actually is", () => {
    const tag = '<img src="a.png" width="200" height="100">';

    expect(imageComplaints(PAGE, tag, found(aPng(DRAWN_WIDE, DRAWN_TALL)))).toEqual([]);
  });

  it("should say what a wrong shape costs a reader, not merely that it is wrong", () => {
    const tag = '<img src="a.png" width="200" height="400">';
    const said = imageComplaints(PAGE, tag, found(aPng(DRAWN_WIDE, DRAWN_TALL)));

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("200×400");
    expect(said[FIRST]).toContain("200×100");
    expect(said[FIRST]).toContain("browser reserves the");
    expect(said[FIRST]).toContain("page jumps as it loads");
  });

  it("should refuse an image tag it cannot read rather than passing it in silence", () => {
    const said = imageComplaints(PAGE, '<img src="a.png" width="200">', found(aPng(DRAWN_WIDE, DRAWN_TALL)));

    expect(said[FIRST]).toContain("without a src, a width and a height");
    expect(said[FIRST]).toContain("pass in silence");
  });

  it("should read an image tag whose attributes come in any order", () => {
    const tag = '<img class="hero" height="100" src="a.png" width="200">';

    expect(imageComplaints(PAGE, tag, found(aPng(DRAWN_WIDE, DRAWN_TALL)))).toEqual([]);
  });

  it("should say a missing file would show as a gap on the page", () => {
    const said = imageComplaints(PAGE, '<img src="a.png" width="200" height="100">', missing);

    expect(said[FIRST]).toContain("which is not there");
    expect(said[FIRST]).toContain("show a gap");
  });

  it("should refuse a format it cannot measure rather than trusting the page", () => {
    const said = imageComplaints(
      PAGE,
      '<img src="a.gif" width="200" height="100">',
      found(Buffer.alloc(A_HEADER))
    );

    expect(said[FIRST]).toContain("neither a PNG nor the plain WebP");
    expect(said[FIRST]).toContain("trusting the page's own numbers");
  });

  const weighing = (bytes: number): Buffer =>
    Buffer.concat([aPng(DRAWN_WIDE, DRAWN_TALL), Buffer.alloc(bytes - A_HEADER)]);

  it("should let a page sitting exactly on the picture budget through", () => {
    const tag = '<img src="a.png" width="200" height="100">';

    expect(imageComplaints(PAGE, tag, found(weighing(THE_BUDGET)))).toEqual([]);
  });

  it("should complain about the very next byte, which is where the budget is", () => {
    const tag = '<img src="a.png" width="200" height="100">';
    const said = imageComplaints(PAGE, tag, found(weighing(THE_BUDGET + ONE_BYTE)));

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("KB of pictures, past the");
  });

  it("should say what to do about a page that spends past the budget", () => {
    const tag = '<img src="a.png" width="200" height="100">';
    const said = imageComplaints(PAGE, tag, found(weighing(PAST_THE_BUDGET)));

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("KB of pictures, past the");
    expect(said[FIRST]).toContain("220KB a landing page may spend");
    expect(said[FIRST]).toContain("rather than raising this");
  });
});
