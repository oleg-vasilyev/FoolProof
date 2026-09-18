import { existsSync } from "node:fs";
import { blocksOnPage, languageOf, withoutGaps, type PageBlock, type PageText } from "../../../site/page-blocks.ts";
import { read } from "../shared/document-files.ts";
import { A_LINE, FIRST_GROUP, SECOND_GROUP } from "../shared/markdown-text.ts";


export type Granularity = "paragraph" | "section";

export type FactBlock = {
  readonly id: string;
  readonly granularity: Granularity;
  readonly facts: number;
  readonly numbers: readonly string[];
  readonly numbersIn: Readonly<Record<string, readonly string[]>>;
  readonly commits: readonly string[];
  readonly rev: string | null;
  readonly overwrittenFields: readonly string[];
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

const A_SECTION_HEADING = /^## ([a-z0-9-]+)\s*$/;

const A_BLOCK_HEADING = /^### ([a-z0-9-]+)\s*$/;

const A_HEADING = /^(#{2,3}) (.+?)\s*$/;

const AN_ID = /^[a-z0-9-]+$/;

const SECTION_LEVEL = "##";

const A_FACT = /^- \S/;

const A_FIELD = /^(granularity|numbers|numbers-[a-z]{2}|commits|rev): (.*)$/;

const A_LANGUAGE_NUMBERS = /^numbers-([a-z]{2})$/;

const BETWEEN_LISTED = /\s*,\s*/;

type DraftBlock = {
  id: string;
  granularity: Granularity;
  facts: number;
  numbers: readonly string[];
  numbersIn: Record<string, readonly string[]>;
  commits: readonly string[];
  rev: string | null;
  readonly fieldsSeen: Set<string>;
  readonly overwrittenFields: string[];
};

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
        fieldsSeen: new Set(),
        overwrittenFields: [],
      });
    } else if (last !== undefined && field !== null) {
      const value = field[SECOND_GROUP] ?? "";
      const name = field[FIRST_GROUP] ?? "";
      const language = A_LANGUAGE_NUMBERS.exec(name)?.[FIRST_GROUP];

      if (last.fieldsSeen.has(name) && !last.overwrittenFields.includes(name)) {
        last.overwrittenFields.push(name);
      }

      last.fieldsSeen.add(name);

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

  return blocks.map(({ fieldsSeen: _, ...block }) => block);
};

const sameSet = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length &&
  [...left].sort().every((item, at) => item === [...right].sort()[at]);

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

export const namesASection = (line: string): boolean => A_SECTION_HEADING.test(line);

export const strayHeadings = (tree: string, markdown: string): readonly string[] =>
  markdown.split(A_LINE).reduce<{ readonly inSection: boolean; readonly said: readonly string[] }>(
    (found, line) => {
      const heading = A_HEADING.exec(line);

      if (heading === null) {
        return found;
      }

      const named = AN_ID.test(heading[SECOND_GROUP] ?? "");

      if (named) {
        return heading[FIRST_GROUP] === SECTION_LEVEL ? { ...found, inSection: true } : found;
      }

      return found.inSection
        ? {
            ...found,
            said: [
              ...found.said,
              `${tree}: the heading "${line.trim()}" stands inside a section and names nothing — a ` +
                `section and a block are each one lowercase word, so this one is read as prose and ` +
                `whatever follows it is swallowed by the block above`,
            ],
          }
        : found;
    },
    { inSection: false, said: [] }
  ).said;

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
  const repeatedIds = ids
    .filter((id, at) => ids.indexOf(id) !== at)
    .map((id) => `${tree}: block "${id}" is declared twice — an id names one place on the page`);
  const doubled = facts.flatMap((fact) =>
    fact.overwrittenFields.map(
      (field) =>
        `${tree}: block "${fact.id}" lists "${field}:" more than once — a field is written on one ` +
          `line, and a later one silently replaces the first rather than adding to it`
    )
  );

  return [
    ...thin,
    ...repeatedIds,
    ...doubled,
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

export const pagesTheirFactTreeContradicts = (): readonly string[] =>
  SITE_TEXT_TREES.flatMap(({ tree, pages }) =>
    existsSync(tree)
      ? [
          ...strayHeadings(tree, read(tree)),
          ...textComplaints(
            tree,
            blocksInTree(read(tree)),
            pages.map((page) => [page, blocksOnPage(read(page))] as const)
          ),
        ]
      : [
          `${tree}: missing — the pages ${pages.join(" and ")} are held to one structure only ` +
            `through this tree, so write it before either page is edited`,
        ]
  );
