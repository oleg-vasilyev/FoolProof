import { existsSync } from "node:fs";
import { SITE_CSS, SITE_PAGES } from "../../../tools/site-css.ts";
import { read } from "../shared/document-files.ts";
import { FIRST_GROUP } from "../shared/markdown-text.ts";


const NOTHING = 0;

const A_CLASS_ATTRIBUTE = /class="([^"]+)"/g;

const BETWEEN_CLASSES = /\s+/;

const ESCAPED_IN_A_SELECTOR = /[^\w-]/g;

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

export const classesTheStylesheetHasNoRuleFor = (): readonly string[] =>
  existsSync(SITE_CSS)
    ? cssComplaints(
        read(SITE_CSS),
        SITE_PAGES.map((page) => [page, read(page)] as const)
      )
    : [`${SITE_CSS}: never built — run "node scripts/tools/tools.ts site-css"`];
