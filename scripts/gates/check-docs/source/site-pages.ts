import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { LANDING_PAGES, SITE_CSS, SITE_PAGES } from "../../../tools/site-css.ts";
import { read } from "../document-files.ts";
import { FIRST_GROUP, SECOND_GROUP } from "../markdown-text.ts";


const NOTHING = 0;

const A_CLASS_ATTRIBUTE = /class="([^"]+)"/g;

const BETWEEN_CLASSES = /\s+/;

const ESCAPED_IN_A_SELECTOR = /[^\w-]/g;

const A_DRAWN_IMAGE = /<img\s[^>]*>/g;

const AN_ATTRIBUTE = (name: string): RegExp => new RegExp(`\\s${name}="([^"]*)"`);

const KILOBYTE = 1024;

const A_ROUNDING = 0.005;

const A_PAGE_BUDGET = 220 * KILOBYTE;

const PNG_WIDTH_AT = 16;

const PNG_HEIGHT_AT = 20;

const WEBP_FOURCC_AT = 12;

const WEBP_VP8_WIDTH_AT = 26;

const FOURTEEN_BITS = 0x3fff;

const NEXT_TWO_BYTES = 2;

const A_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const FOURCC_LENGTH = 4;

const SHORTEST_HEADER = 30;

const A_LOSSY_WEBP = "VP8 ";

export const classesUsedIn = (html: string): ReadonlySet<string> =>
  new Set(
    [...html.matchAll(A_CLASS_ATTRIBUTE)]
      .flatMap((match) => (match[FIRST_GROUP] ?? "").split(BETWEEN_CLASSES))
      .filter((token) => token.length > NOTHING)
  );

export const selectorFor = (token: string): string =>
  `.${token.replaceAll(ESCAPED_IN_A_SELECTOR, (character) => `\\${character}`)}`;

export const cssComplaints = (
  css: string,
  pages: readonly (readonly [string, string])[]
): readonly string[] =>
  pages.flatMap(([page, html]) =>
    [...classesUsedIn(html)]
      .filter((token) => !css.includes(selectorFor(token)))
      .map(
        (token) =>
          `${SITE_CSS}: carries no rule for "${token}", which ${page} uses — ` +
          `run "node scripts/tools/tools.ts site-css"`
      )
  );

export const siteCssOutOfStep = (): readonly string[] =>
  existsSync(SITE_CSS)
    ? cssComplaints(
        read(SITE_CSS),
        SITE_PAGES.map((page) => [page, read(page)] as const)
      )
    : [`${SITE_CSS}: never built — run "node scripts/tools/tools.ts site-css"`];

export const sizeOfDrawing = (bytes: Buffer): readonly [number, number] | null => {
  if (bytes.length < SHORTEST_HEADER) {
    return null;
  }

  if (bytes.subarray(NOTHING, A_PNG.length).equals(A_PNG)) {
    return [bytes.readUInt32BE(PNG_WIDTH_AT), bytes.readUInt32BE(PNG_HEIGHT_AT)];
  }

  if (bytes.toString("ascii", WEBP_FOURCC_AT, WEBP_FOURCC_AT + FOURCC_LENGTH) === A_LOSSY_WEBP) {
    return [
      bytes.readUInt16LE(WEBP_VP8_WIDTH_AT) & FOURTEEN_BITS,
      bytes.readUInt16LE(WEBP_VP8_WIDTH_AT + NEXT_TWO_BYTES) & FOURTEEN_BITS,
    ];
  }

  return null;
};

export type DrawingLookup = (source: string) => Buffer | null;

const imageOnA = (page: string, tag: string, bytesOf: DrawingLookup): readonly [string[], number] => {
  const source = AN_ATTRIBUTE("src").exec(tag)?.[FIRST_GROUP];
  const width = AN_ATTRIBUTE("width").exec(tag)?.[FIRST_GROUP];
  const height = AN_ATTRIBUTE("height").exec(tag)?.[FIRST_GROUP];

  if (source === undefined || width === undefined || height === undefined) {
    return [
      [
        `${page}: draws ${tag} without a src, a width and a height between them — an ` +
          `image this check cannot read is one it cannot weigh either, and it would ` +
          `pass in silence`,
      ],
      NOTHING,
    ];
  }

  const bytes = bytesOf(source);

  if (bytes === null) {
    return [[`${page}: draws ${source}, which is not there — the page would show a gap`], NOTHING];
  }

  const size = sizeOfDrawing(bytes);

  if (size === null) {
    return [
      [
        `${page}: draws ${source}, which is neither a PNG nor the plain WebP this check ` +
          `can measure — teach it that shape rather than trusting the page's own numbers`,
      ],
      bytes.length,
    ];
  }

  const [wide, tall] = size;
  const declared = Number(width) / Number(height);
  const drawnAs = wide / tall;

  return [
    Math.abs(declared - drawnAs) / drawnAs <= A_ROUNDING
      ? []
      : [
          `${page}: says ${source} is ${width}×${height}, which is not the shape of the ` +
            `${String(wide)}×${String(tall)} it actually is — the browser reserves the ` +
            `wrong room and the page jumps as it loads`,
        ],
    bytes.length,
  ];
};

export const imageComplaints = (
  page: string,
  html: string,
  bytesOf: DrawingLookup
): readonly string[] => {
  const weighed = (html.match(A_DRAWN_IMAGE) ?? []).map((tag) => imageOnA(page, tag, bytesOf));
  const complaints = weighed.flatMap(([said]) => said);
  const served = weighed.reduce((weight, [, bytes]) => weight + bytes, NOTHING);

  return served <= A_PAGE_BUDGET
    ? complaints
    : [
        ...complaints,
        `${page}: serves ${String(Math.round(served / KILOBYTE))}KB of pictures, past the ` +
          `${String(A_PAGE_BUDGET / KILOBYTE)}KB a page of the site may spend — draw them ` +
          `smaller or in a leaner format rather than raising this`,
      ];
};

const bytesBeside = (page: string): DrawingLookup => {
  const folder = dirname(page);

  return (source) => {
    const file = join(folder, source);

    return existsSync(file) ? readFileSync(file) : null;
  };
};

export const imagesOutOfStep = (): readonly string[] =>
  SITE_PAGES.flatMap((page) => imageComplaints(page, read(page), bytesBeside(page)));

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

export const faqOutOfStep = (): readonly string[] =>
  LANDING_PAGES.flatMap((page) => faqComplaints(page, read(page)));
