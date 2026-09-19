import { execFileSync } from "node:child_process";
import { DEBT_DOCUMENT, read } from "../gates/check-docs/shared/document-files.ts";
import { entriesIn, lastParagraphOf } from "../gates/check-docs/handbook/debt-entry-triggers.ts";


const NOTHING = 0;

const NOT_A_DEBT = "Not debt, deliberately";

const A_SOURCE_PATH = /`[\w.-]+(?:\/[\w.-]+)+\.(?:ts|sh|json|css)`/g;

const A_BACKTICK = /`/g;

const NOT_A_PATH: readonly string[] = [];

const A_ROW = "|";

const BETWEEN_CELLS = "|";

const LAST_CELL = -1;

const A_BOLD_SENTENCE = /\*\*([\s\S]+?)\*\*/;

const THE_SENTENCE = 1;

const AGAINST_MAIN = "origin/main";

export interface Trigger {
  readonly file: string;
  readonly says: string;
}

export interface TouchedEntry {
  readonly title: string;
  readonly triggers: readonly Trigger[];
}

const asOneLine = (text: string): string =>
  text
    .split("\n")
    .map((line) => line.trim())
    .join(" ")
    .trim();

const cellsOf = (row: string): readonly string[] =>
  row
    .split(BETWEEN_CELLS)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > NOTHING);

export const triggerFor = (paragraph: string, file: string): string => {
  const row = paragraph
    .split("\n")
    .find((line) => line.startsWith(A_ROW) && line.includes(`\`${file}\``));

  if (row !== undefined) {
    return cellsOf(row).slice(LAST_CELL).join("");
  }

  const bold = A_BOLD_SENTENCE.exec(paragraph);

  return asOneLine(bold === null ? paragraph : (bold[THE_SENTENCE] ?? paragraph));
};

export const pathsNamedIn = (body: string): readonly string[] => [
  ...new Set(
    (body.match(A_SOURCE_PATH) ?? NOT_A_PATH).map((found) => found.replaceAll(A_BACKTICK, ""))
  ),
];

const touches = (changed: string, named: string): boolean =>
  changed === named || changed.endsWith(`/${named}`);

export const entriesTouchedBy = (
  document: string,
  changed: readonly string[]
): readonly TouchedEntry[] =>
  entriesIn(document)
    .filter((entry) => entry.title !== NOT_A_DEBT)
    .flatMap((entry) => {
      const closing = lastParagraphOf(entry.body);
      const triggers = pathsNamedIn(entry.body)
        .filter((named) => changed.some((file) => touches(file, named)))
        .map((file) => ({ file, says: triggerFor(closing, file) }));

      return triggers.length === NOTHING ? [] : [{ title: entry.title, triggers }];
    });

const gitLines = (...args: readonly string[]): readonly string[] =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > NOTHING);

export const changedFiles = (): readonly string[] => {
  const baseline = process.env.DEBT_AGAINST ?? AGAINST_MAIN;

  return [
    ...gitLines("diff", "--name-only", baseline),
    ...gitLines("ls-files", "--others", "--exclude-standard"),
  ];
};

export const linesFor = (touched: readonly TouchedEntry[]): readonly string[] =>
  touched.length === NOTHING
    ? ["no entry names a file this asks about"]
    : touched.flatMap((entry) => [
        entry.title,
        ...entry.triggers.map((trigger) => `    ${trigger.file} — ${trigger.says}`),
      ]);

const ONE_ENTRY = 1;

export const debtForTheDiff = (asked: readonly string[], say: (line: string) => void): void => {
  const files = asked.length === NOTHING ? changedFiles() : asked;
  const touched = entriesTouchedBy(read(DEBT_DOCUMENT), files);
  const entries = touched.length === ONE_ENTRY ? "entry" : "entries";

  for (const line of linesFor(touched)) {
    say(line);
  }

  say(
    `${DEBT_DOCUMENT} — ${String(touched.length)} ${entries} over ${String(files.length)} files`
  );
};
