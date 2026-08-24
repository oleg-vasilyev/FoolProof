export const FIRST_GROUP = 1;

export const SECOND_GROUP = 2;

export const A_LINE = /\r?\n/;

const A_HEADING = /^#+ .+$/gm;

const ITS_HASHES = /^#+ /;

const NOT_IN_AN_ANCHOR = /[^a-z0-9 -]/g;

const SPACES_IN_AN_ANCHOR = / +/g;

const A_FENCED_BLOCK = /```[\s\S]*?```/g;

const A_BACKTICKED_WORD = /`([^`]+)`/g;

const BETWEEN_BACKTICKED_WORDS = /[\s/]+/;

export const headingsOf = (text: string): readonly string[] =>
  (text.match(A_HEADING) ?? []).map((heading) => heading.replace(ITS_HASHES, ""));

export const anchorOf = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(NOT_IN_AN_ANCHOR, "")
    .trim()
    .replace(SPACES_IN_AN_ANCHOR, "-");

export const withoutFencedBlocks = (text: string): string => text.replace(A_FENCED_BLOCK, "");

export const backtickedWordsOf = (text: string): ReadonlySet<string> =>
  new Set(
    [...withoutFencedBlocks(text).matchAll(A_BACKTICKED_WORD)].flatMap((match) =>
      (match[FIRST_GROUP] ?? "").split(BETWEEN_BACKTICKED_WORDS)
    )
  );

export const namesIn = (text: string, pattern: RegExp): readonly string[] =>
  [...text.matchAll(pattern)].map((match) => match[FIRST_GROUP] ?? "");
