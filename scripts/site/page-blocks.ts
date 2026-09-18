const FIRST_GROUP = 1;

const SECOND_GROUP = 2;

const NOTHING = 0;

const ONE = 1;

const A_NUMBER = /\d{1,3}(?:[,  ]\d{3})+|\d+/g;

const A_NUMBER_GROUP_GAP = /[,  ]/g;

const A_LANGUAGE_FOLDER = /^docs\/([a-z]{2})\//;

const THE_DEFAULT_LANGUAGE = "en";

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

export const withoutGaps = (numbers: readonly string[]): readonly string[] =>
  numbers.map((number) => number.replaceAll(A_NUMBER_GROUP_GAP, ""));

export const numbersIn = (text: string): readonly string[] => withoutGaps(text.match(A_NUMBER) ?? []);

export const languageOf = (page: string): string =>
  A_LANGUAGE_FOLDER.exec(page)?.[FIRST_GROUP] ?? THE_DEFAULT_LANGUAGE;

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
