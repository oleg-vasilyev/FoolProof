import { describe, expect, it } from "vitest";
import { faqComplaints, faqInStructuredData, faqOnPage, spokenText } from "./site-faq.ts";


const ONE_COMPLAINT = 1;

const TWO_COMPLAINTS = 2;

const FIRST = 0;

const PAGE = "docs/index.html";

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
