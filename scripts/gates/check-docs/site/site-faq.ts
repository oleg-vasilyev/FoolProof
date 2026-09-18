import { LANDING_PAGES } from "../../../tools/site-css.ts";
import { read } from "../shared/document-files.ts";
import { FIRST_GROUP, SECOND_GROUP } from "../shared/markdown-text.ts";


const NOTHING = 0;

const ONE = 1;

const A_STRUCTURED_DATA = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;

const A_QUESTION_BLOCK = /<dt data-block="faq\.([a-z]+)-q"[^>]*>([\s\S]*?)<\/dt>\s*<dd data-block="faq\.\1-a"[^>]*>([\s\S]*?)<\/dd>/g;

const ANSWER_GROUP = 3;

const A_TAG = /<[^>]+>/g;

const WHITESPACE = /\s+/g;

const AN_ENTITY: Readonly<Record<string, string>> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"' };

const ANY_ENTITY = /&(?:amp|lt|gt|quot);/g;

export type FaqPair = {
  readonly question: string;
  readonly answer: string;
};

type Structured = {
  readonly "@type"?: string;
  readonly "@graph"?: readonly Structured[];
  readonly mainEntity?: readonly { name?: string; acceptedAnswer?: { text?: string } }[];
};

export const spokenText = (html: string): string =>
  html
    .replace(A_TAG, "")
    .replace(ANY_ENTITY, (entity) => AN_ENTITY[entity] ?? entity)
    .replace(WHITESPACE, " ")
    .trim();

export const faqOnPage = (html: string): readonly FaqPair[] =>
  [...html.matchAll(A_QUESTION_BLOCK)].map((match) => ({
    question: spokenText(match[SECOND_GROUP] ?? ""),
    answer: spokenText(match[ANSWER_GROUP] ?? ""),
  }));

const faqNodes = (node: Structured): readonly Structured[] =>
  node["@type"] === "FAQPage" ? [node] : (node["@graph"] ?? []).flatMap(faqNodes);

export const faqInStructuredData = (html: string): readonly FaqPair[] | null => {
  const script = A_STRUCTURED_DATA.exec(html)?.[FIRST_GROUP];

  if (script === undefined) {
    return null;
  }

  const [faq] = faqNodes(JSON.parse(script) as Structured);

  return faq === undefined
    ? null
    : (faq.mainEntity ?? []).map((entry) => ({
        question: entry.name ?? "",
        answer: entry.acceptedAnswer?.text ?? "",
      }));
};

export const faqComplaints = (page: string, html: string): readonly string[] => {
  const shown = faqOnPage(html);
  const declared = faqInStructuredData(html);

  if (declared === null) {
    return shown.length === NOTHING
      ? []
      : [`${page}: shows a FAQ and declares none in its structured data — search engines read the declaration`];
  }

  if (declared.length !== shown.length) {
    return [
      `${page}: declares ${String(declared.length)} FAQ entries in its structured data and shows ` +
        `${String(shown.length)} — the two lists are one FAQ, edited in one place and forgotten in the other`,
    ];
  }

  return shown.flatMap((pair, at) => {
    const mirrored = declared[at];

    return (["question", "answer"] as const).flatMap((part) =>
      mirrored?.[part] === pair[part]
        ? []
        : [
            `${page}: FAQ ${part} ${String(at + ONE)} reads "${pair[part]}" on the page and ` +
              `"${mirrored?.[part] ?? ""}" in the structured data — Google wants them verbatim, so the ` +
              `mirror is edited with the text, never after it`,
          ]
    );
  });
};

export const faqTheStructuredDataContradicts = (): readonly string[] =>
  LANDING_PAGES.flatMap((page) => faqComplaints(page, read(page)));
