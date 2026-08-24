import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { SITE_CSS, SITE_PAGES } from "../../site-css.ts";
import { read } from "../document-files.ts";
import { FIRST_GROUP } from "../markdown-text.ts";


const NOTHING = 0;

const A_CLASS_ATTRIBUTE = /class="([^"]+)"/g;

const BETWEEN_CLASSES = /\s+/;

const ESCAPED_IN_A_SELECTOR = /[.:[\]/]/g;

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
          `run "node scripts/tools.ts site-css"`
      )
  );

export const siteCssOutOfStep = (): readonly string[] =>
  existsSync(SITE_CSS)
    ? cssComplaints(
        read(SITE_CSS),
        SITE_PAGES.map((page) => [page, read(page)] as const)
      )
    : [`${SITE_CSS}: never built — run "node scripts/tools.ts site-css"`];

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
          `${String(A_PAGE_BUDGET / KILOBYTE)}KB a landing page may spend — draw them ` +
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
