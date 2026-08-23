import { DEBT_DOCUMENT, read } from "./the-documents.ts";


const NOTHING = 0;

const LAST = -1;

const NOT_A_DEBT = "Not debt, deliberately";

const A_TITLE_AND_ITS_BODY = 2;

const AFTER_THE_PREAMBLE = 1;

const AN_ENTRY = /^## (.+)$/gm;

const A_CONDITION =
  "when|once|if|until|as soon as|the day|the next time|the first time|the next phase|the phase that";

const A_STATED_CONDITION = new RegExp(`\\b(?:${A_CONDITION})\\b`, "i");

const SOMETHING_IN_BOLD = "**";

const A_TRIGGER_COLUMN = /\|[^|\n]*\bwhen\b[^|\n]*\|/i;

const BETWEEN_PARAGRAPHS = "\n\n";

const A_HORIZONTAL_RULE = "---";

export interface Entry {
  readonly title: string;
  readonly body: string;
}

export const lastParagraphOf = (body: string): string => {
  const paragraphs = body
    .split(BETWEEN_PARAGRAPHS)
    .map((paragraph) => paragraph.replaceAll(A_HORIZONTAL_RULE, "").trim())
    .filter((paragraph) => paragraph.length > NOTHING);

  return paragraphs.at(LAST) ?? "";
};

export const namesATrigger = (body: string): boolean => {
  const closing = lastParagraphOf(body);

  return (
    (closing.includes(SOMETHING_IN_BOLD) && A_STATED_CONDITION.test(closing)) ||
    A_TRIGGER_COLUMN.test(closing)
  );
};

export const entriesIn = (document: string): readonly Entry[] => {
  const pieces = document.split(AN_ENTRY).slice(AFTER_THE_PREAMBLE);

  return pieces.flatMap((piece, index) =>
    index % A_TITLE_AND_ITS_BODY === NOTHING
      ? [{ title: piece, body: pieces[index + AFTER_THE_PREAMBLE] ?? "" }]
      : []
  );
};

export const debtWithoutATrigger = (): readonly string[] =>
  entriesIn(read(DEBT_DOCUMENT))
    .filter((entry) => entry.title !== NOT_A_DEBT)
    .filter((entry) => !namesATrigger(entry.body))
    .map(
      (entry) =>
        `${DEBT_DOCUMENT}: "${entry.title}" ends without a trigger — this file's own first ` +
        `rule is that an entry naming no condition is a wish that will still be here in a ` +
        `year, so close it with a bold sentence saying what has to be true before the work ` +
        `is worth doing, or delete the entry. If the trigger is there and phrased in a way ` +
        `this check does not know, widen A_CONDITION rather than rewording the entry — a ` +
        `check that cries wolf is one nobody reads`
    );
