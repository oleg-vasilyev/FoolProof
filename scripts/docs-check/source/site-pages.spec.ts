import { describe, expect, it } from "vitest";
import {
  classesUsedIn,
  faqComplaints,
  faqInStructuredData,
  faqOnPage,
  spokenText,
  cssComplaints,
  imageComplaints,
  selectorFor,
  sizeOfDrawing,
} from "./site-pages.ts";


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
    expect(said[FIRST]).toContain("220KB a page of the site may spend");
    expect(said[FIRST]).toContain("rather than raising this");
  });
});

const TWO_COMPLAINTS = 2;

const shown = (question: string, answer: string): string =>
  `<dl><div><dt data-block="faq.free-q" class="x">${question}</dt>\n` +
  `<dd data-block="faq.free-a" class="y">\n  ${answer}\n</dd></div></dl>`;

const declared = (question: string, answer: string): string =>
  '<script type="application/ld+json">' +
  JSON.stringify({
    "@graph": [
      { "@type": "SoftwareApplication" },
      {
        "@type": "FAQPage",
        mainEntity: [{ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }],
      },
    ],
  }) +
  "</script>";

describe("spokenText", () => {
  it("should read the words a visitor sees through the tags and the whitespace", () => {
    expect(spokenText("\n  Type <code class=\"cmd\">/game</code>   and\n  wait.\n")).toBe("Type /game and wait.");
  });

  it("should turn an escaped ampersand back into the character", () => {
    expect(spokenText("Oleg &amp; Anya")).toBe("Oleg & Anya");
  });
});

describe("faqOnPage", () => {
  it("should pair each question with the answer that follows it", () => {
    expect(faqOnPage(shown("Is it free?", "Yes. <b>Nothing</b> to buy."))).toEqual([
      { question: "Is it free?", answer: "Yes. Nothing to buy." },
    ]);
  });

  it("should not pair a question with an answer of another key", () => {
    const html = '<dt data-block="faq.free-q">Is it free?</dt><dd data-block="faq.chat-a">No.</dd>';

    expect(faqOnPage(html)).toEqual([]);
  });
});

describe("faqInStructuredData", () => {
  it("should find the FAQ inside the graph", () => {
    expect(faqInStructuredData(declared("Is it free?", "Yes."))).toEqual([{ question: "Is it free?", answer: "Yes." }]);
  });

  it("should read a question that declares no name and no answer as two empty strings", () => {
    const html = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question"}]}</script>';

    expect(faqInStructuredData(html)).toEqual([{ question: "", answer: "" }]);
  });

  it("should read a FAQ that declares no entries as an empty list, not as none", () => {
    const html = '<script type="application/ld+json">{"@type":"FAQPage"}</script>';

    expect(faqInStructuredData(html)).toEqual([]);
  });

  it("should say there is none when the page declares no structured data", () => {
    expect(faqInStructuredData("<html></html>")).toBeNull();
  });

  it("should say there is none when the graph holds no FAQ", () => {
    const html = '<script type="application/ld+json">{"@graph":[{"@type":"SoftwareApplication"}]}</script>';

    expect(faqInStructuredData(html)).toBeNull();
  });
});

describe("faqComplaints", () => {
  it("should say nothing when the mirror repeats the page word for word", () => {
    const html = declared("Is it free?", "Yes. Nothing to buy.") + shown("Is it free?", "Yes. <b>Nothing</b> to buy.");

    expect(faqComplaints(PAGE, html)).toEqual([]);
  });

  it("should say nothing about a page with neither a FAQ nor a declaration", () => {
    expect(faqComplaints(PAGE, "<html></html>")).toEqual([]);
  });

  it("should name a question the mirror has an older wording of", () => {
    const html = declared("Which Durak does it score?", "Yes.") + shown("Which kind of Durak does it support?", "Yes.");

    const [complaint] = faqComplaints(PAGE, html);

    expect(complaint).toContain(
      `${PAGE}: FAQ question 1 reads "Which kind of Durak does it support?" on the page and "Which Durak does it score?" in the structured data`
    );
    expect(complaint).toContain("Google wants them verbatim");
  });

  it("should complain about the question and the answer each on their own", () => {
    const html = declared("Old?", "Old.") + shown("New?", "New.");

    expect(faqComplaints(PAGE, html)).toHaveLength(TWO_COMPLAINTS);
  });

  it("should refuse a FAQ shown without a declaration", () => {
    const found = faqComplaints(PAGE, shown("Is it free?", "Yes."));

    expect(found).toHaveLength(ONE_COMPLAINT);
    expect(found[FIRST]).toContain("declares none in its structured data");
  });

  it("should refuse lists of different lengths before comparing any entry", () => {
    const html = declared("Is it free?", "Yes.") + shown("Is it free?", "Yes.") + shown("Is it free?", "Yes.");

    const found = faqComplaints(PAGE, html);

    expect(found).toHaveLength(ONE_COMPLAINT);
    expect(found[FIRST]).toContain("declares 1 FAQ entries in its structured data and shows 2");
  });
});
