import { existsSync } from "node:fs";
import { read } from "../document-files.ts";
import { A_LINE, FIRST_GROUP, SECOND_GROUP } from "../markdown-text.ts";


export type Granularity = "paragraph" | "section";

export type FactBlock = {
  readonly id: string;
  readonly granularity: Granularity;
  readonly facts: number;
  readonly numbers: readonly string[];
  readonly numbersIn: Readonly<Record<string, readonly string[]>>;
  readonly commits: readonly string[];
  readonly rev: string | null;
};

export type PageBlock = {
  readonly id: string;
  readonly text: string;
  readonly elements: number;
  readonly numbers: readonly string[];
  readonly commits: readonly string[];
  readonly rev: string | null;
};

export type PageText = {
  readonly blocks: readonly PageBlock[];
  readonly stray: readonly string[];
};

export type SiteTextTree = {
  readonly tree: string;
  readonly pages: readonly string[];
};

export const SITE_TEXT_TREES: readonly SiteTextTree[] = [
  { tree: "docs/text/landing.facts.md", pages: ["docs/index.html", "docs/ru/index.html"] },
  {
    tree: "docs/text/case-study.facts.md",
    pages: ["docs/case-study/index.html", "docs/ru/case-study/index.html"],
  },
];

const NOTHING = 0;

const ONE = 1;

const A_SECTION_HEADING = /^## (\S+)\s*$/;

const A_BLOCK_HEADING = /^### (\S+)\s*$/;

const A_FACT = /^- \S/;

const A_FIELD = /^(granularity|numbers|numbers-[a-z]{2}|commits|rev): (.*)$/;

const A_LANGUAGE_NUMBERS = /^numbers-([a-z]{2})$/;

const A_LANGUAGE_FOLDER = /^docs\/([a-z]{2})\//;

const THE_DEFAULT_LANGUAGE = "en";

const BETWEEN_LISTED = /\s*,\s*/;

const A_NUMBER = /\d{1,3}(?:[,  ]\d{3})+|\d+/g;

const A_NUMBER_GROUP_GAP = /[,  ]/g;

const A_COMMIT_HASH = /^[0-9a-f]{7,}$/;

const A_TAG = /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;

const A_BLOCK_ATTRIBUTE = /\sdata-block="([^"]*)"/;

const A_REV_ATTRIBUTE = /\sdata-rev="([^"]*)"/;

const A_CLASS_ATTRIBUTE = /\sclass="([^"]*)"/;

const A_HASH_CLASS = /(?:^|\s)hash(?:\s|$)/;

const SELF_CLOSED = /\/\s*$/;

const AN_ENTITY = /&(nbsp|amp|lt|gt|quot|#\d+);/g;

const ENTITY_VALUES: Readonly<Record<string, string>> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
};

const NUMERIC_ENTITY = "#";

const A_BLANK = /^\s*$/;

const WHITESPACE = /\s+/g;

const A_QUOTE_LENGTH = 48;

const VOID_ELEMENTS = new Set(["img", "meta", "link", "br", "hr", "input", "source", "wbr"]);

const UNREAD_ELEMENTS = new Set(["script", "style", "svg", "head", "noscript", "template"]);

const TEXT_ELEMENTS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "dt",
  "dd",
  "figcaption",
  "summary",
  "blockquote",
  "td",
  "th",
  "pre",
]);

export const numbersIn = (text: string): readonly string[] =>
  (text.match(A_NUMBER) ?? []).map((number) => number.replaceAll(A_NUMBER_GROUP_GAP, ""));

const decoded = (text: string): string =>
  text.replaceAll(AN_ENTITY, (entity, name: string) =>
    name.startsWith(NUMERIC_ENTITY)
      ? String.fromCodePoint(Number(name.slice(NUMERIC_ENTITY.length)))
      : (ENTITY_VALUES[name] ?? entity)
  );

const quoted = (text: string): string => {
  const flat = text.replaceAll(WHITESPACE, " ").trim();

  return flat.length > A_QUOTE_LENGTH ? `${flat.slice(NOTHING, A_QUOTE_LENGTH)}…` : flat;
};

type OpenBlock = {
  readonly id: string;
  readonly rev: string | null;
  readonly depth: number;
  text: string;
  elements: number;
  prose: string;
  readonly commits: string[];
};

type Walk = {
  readonly stack: string[];
  readonly blocks: PageBlock[];
  readonly stray: string[];
  open: OpenBlock | null;
  unread: number;
  hashDepth: number | null;
  hashText: string;
};

const closedBlock = (open: OpenBlock): PageBlock => ({
  id: open.id,
  text: open.text.replaceAll(WHITESPACE, " ").trim(),
  elements: open.elements,
  numbers: numbersIn(open.prose),
  commits: open.commits,
  rev: open.rev,
});

const readText = (walk: Walk, raw: string): void => {
  if (walk.unread > NOTHING || A_BLANK.test(raw)) {
    return;
  }

  const text = decoded(raw);

  if (walk.open === null) {
    walk.stray.push(quoted(text));

    return;
  }

  walk.open.text += text;

  if (walk.hashDepth === null) {
    walk.open.prose += text;
  } else {
    walk.hashText += text;
  }
};

const openTag = (walk: Walk, tag: string, attributes: string): void => {
  if (UNREAD_ELEMENTS.has(tag)) {
    walk.unread += ONE;
  }

  if (VOID_ELEMENTS.has(tag) || SELF_CLOSED.test(attributes)) {
    if (UNREAD_ELEMENTS.has(tag)) {
      walk.unread -= ONE;
    }

    return;
  }

  walk.stack.push(tag);

  const block = A_BLOCK_ATTRIBUTE.exec(attributes)?.[FIRST_GROUP];

  if (block !== undefined && walk.open === null) {
    walk.open = {
      id: block,
      rev: A_REV_ATTRIBUTE.exec(attributes)?.[FIRST_GROUP] ?? null,
      depth: walk.stack.length,
      text: "",
      elements: NOTHING,
      prose: "",
      commits: [],
    };

    return;
  }

  if (walk.open !== null && TEXT_ELEMENTS.has(tag)) {
    walk.open.elements += ONE;
  }

  const classes = A_CLASS_ATTRIBUTE.exec(attributes)?.[FIRST_GROUP] ?? "";

  if (walk.open !== null && tag === "a" && A_HASH_CLASS.test(classes) && walk.hashDepth === null) {
    walk.hashDepth = walk.stack.length;
    walk.hashText = "";
  }
};

const closeTag = (walk: Walk, tag: string): void => {
  if (UNREAD_ELEMENTS.has(tag) && walk.unread > NOTHING) {
    walk.unread -= ONE;
  }

  const depth = walk.stack.lastIndexOf(tag) + ONE;

  if (depth === NOTHING) {
    return;
  }

  if (walk.hashDepth !== null && walk.hashDepth >= depth && walk.open !== null) {
    const hash = walk.hashText.trim();

    if (A_COMMIT_HASH.test(hash)) {
      walk.open.commits.push(hash);
    }

    walk.hashDepth = null;
  }

  if (walk.open !== null && walk.open.depth >= depth) {
    walk.blocks.push(closedBlock(walk.open));
    walk.open = null;
  }

  walk.stack.length = depth - ONE;
};

export const blocksOnPage = (html: string): PageText => {
  const walk: Walk = {
    stack: [],
    blocks: [],
    stray: [],
    open: null,
    unread: NOTHING,
    hashDepth: null,
    hashText: "",
  };
  let at = NOTHING;

  for (const match of html.matchAll(A_TAG)) {
    readText(walk, html.slice(at, match.index));
    at = match.index + match[NOTHING].length;

    const tag = match[FIRST_GROUP]?.toLowerCase();

    if (tag === undefined) {
      continue;
    }

    if (match[NOTHING].startsWith("</")) {
      closeTag(walk, tag);
    } else {
      openTag(walk, tag, match[SECOND_GROUP] ?? "");
    }
  }

  readText(walk, html.slice(at));

  return { blocks: walk.blocks, stray: walk.stray };
};

type DraftBlock = {
  id: string;
  granularity: Granularity;
  facts: number;
  numbers: readonly string[];
  numbersIn: Record<string, readonly string[]>;
  commits: readonly string[];
  rev: string | null;
};

const withoutGaps = (numbers: readonly string[]): readonly string[] =>
  numbers.map((number) => number.replaceAll(A_NUMBER_GROUP_GAP, ""));

const listed = (value: string): readonly string[] =>
  value.trim().length === NOTHING ? [] : value.trim().split(BETWEEN_LISTED);

export const blocksInTree = (markdown: string): readonly FactBlock[] => {
  const blocks: DraftBlock[] = [];
  let section = "";

  for (const line of markdown.split(A_LINE)) {
    const heading = A_SECTION_HEADING.exec(line);
    const block = A_BLOCK_HEADING.exec(line);
    const field = A_FIELD.exec(line);
    const last = blocks.at(-ONE);

    if (heading !== null) {
      section = heading[FIRST_GROUP] ?? "";
    } else if (block !== null) {
      blocks.push({
        id: `${section}.${block[FIRST_GROUP] ?? ""}`,
        granularity: "paragraph",
        facts: NOTHING,
        numbers: [],
        numbersIn: {},
        commits: [],
        rev: null,
      });
    } else if (last !== undefined && field !== null) {
      const value = field[SECOND_GROUP] ?? "";
      const name = field[FIRST_GROUP] ?? "";
      const language = A_LANGUAGE_NUMBERS.exec(name)?.[FIRST_GROUP];

      switch (name) {
        case "granularity":
          last.granularity = value.trim() === "section" ? "section" : "paragraph";
          break;
        case "numbers":
          last.numbers = withoutGaps(listed(value));
          break;
        case "commits":
          last.commits = listed(value);
          break;
        case "rev":
          last.rev = value.trim();
          break;
        default:
          last.numbersIn[language ?? name] = withoutGaps(listed(value));
      }
    } else if (last !== undefined && A_FACT.test(line)) {
      last.facts += ONE;
    }
  }

  return blocks;
};

const sameSet = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length &&
  [...left].sort().every((item, at) => item === [...right].sort()[at]);

export const languageOf = (page: string): string =>
  A_LANGUAGE_FOLDER.exec(page)?.[FIRST_GROUP] ?? THE_DEFAULT_LANGUAGE;

const blockComplaints = (
  tree: string,
  page: string,
  fact: FactBlock,
  drawn: PageBlock
): readonly string[] => {
  const expected = [...fact.numbers, ...(fact.numbersIn[languageOf(page)] ?? [])];

  return [
  ...(drawn.text.length === NOTHING
    ? [`${page}: block "${fact.id}" says nothing — a slot with no text is a fact the reader never gets`]
    : []),
  ...(fact.granularity === "paragraph" && drawn.elements > ONE
    ? [
        `${page}: block "${fact.id}" holds ${String(drawn.elements)} paragraphs where ${tree} ` +
          `allows one — split it into one block per paragraph, or mark the block ` +
          `"granularity: section" in the tree if this stretch may be paced differently per language`,
      ]
    : []),
  ...(sameSet(expected, drawn.numbers)
    ? []
    : [
        `${page}: block "${fact.id}" carries the numbers [${drawn.numbers.join(", ")}] and ${tree} ` +
          `says [${expected.join(", ")}] — a number the two pages could disagree on is ` +
          `listed in the tree first, and the text follows it; one only this language prints ` +
          `as digits goes under "numbers-${languageOf(page)}:"`,
      ]),
  ...(sameSet(fact.commits, drawn.commits)
    ? []
    : [
        `${page}: block "${fact.id}" cites the commits [${drawn.commits.join(", ")}] and ${tree} ` +
          `says [${fact.commits.join(", ")}] — every hash a reader can follow is a fact of the tree`,
      ]),
  ...(fact.rev !== null && drawn.rev !== fact.rev
    ? [
        `${page}: block "${fact.id}" is at rev ${drawn.rev ?? "none"} and ${tree} is at rev ` +
          `${fact.rev} — the facts changed under this text, so rewrite it and set data-rev="${fact.rev}"`,
      ]
    : []),
  ];
};

export const textComplaints = (
  tree: string,
  facts: readonly FactBlock[],
  pages: readonly (readonly [string, PageText])[]
): readonly string[] => {
  const ids = facts.map((fact) => fact.id);
  const thin = facts
    .filter((fact) => fact.facts === NOTHING)
    .map(
      (fact) =>
        `${tree}: block "${fact.id}" lists no fact — a slot in the structure has to say what ` +
          `the paragraph is there to tell, or the writer fills it with whatever the other language said`
    );
  const repeated = ids
    .filter((id, at) => ids.indexOf(id) !== at)
    .map((id) => `${tree}: block "${id}" is declared twice — an id names one place on the page`);

  return [
    ...thin,
    ...repeated,
    ...pages.flatMap(([page, { blocks, stray }]) => {
      const drawnIds = blocks.map((block) => block.id);
      const missing = ids.filter((id) => !drawnIds.includes(id));
      const unknown = drawnIds.filter((id) => !ids.includes(id));
      const inOrder = missing.length === NOTHING && unknown.length === NOTHING;
      const ordered = drawnIds.every((id, at) => id === ids[at]);

      return [
        ...missing.map(
          (id) => `${page}: has no block "${id}", which ${tree} lists — the other language has it, so this one is short a paragraph`
        ),
        ...unknown.map(
          (id) =>
            `${page}: carries a block "${id}" that ${tree} does not list — add it to the tree first, ` +
              `so the other language owes the same paragraph`
        ),
        ...(inOrder && !ordered
          ? [`${page}: its blocks run in a different order from ${tree} — the pages keep the tree's order`]
          : []),
        ...stray.map(
          (text) =>
            `${page}: the text "${text}" sits outside any data-block — every line a person reads ` +
              `belongs to a block of ${tree}, or the other language never owes it`
        ),
        ...blocks.flatMap((drawn) => {
          const fact = facts.find((candidate) => candidate.id === drawn.id);

          return fact === undefined ? [] : blockComplaints(tree, page, fact, drawn);
        }),
      ];
    }),
  ];
};

export const siteTextOutOfStep = (): readonly string[] =>
  SITE_TEXT_TREES.flatMap(({ tree, pages }) =>
    existsSync(tree)
      ? textComplaints(
          tree,
          blocksInTree(read(tree)),
          pages.map((page) => [page, blocksOnPage(read(page))] as const)
        )
      : [
          `${tree}: missing — the pages ${pages.join(" and ")} are held to one structure only ` +
            `through this tree, so write it before either page is edited`,
        ]
  );
