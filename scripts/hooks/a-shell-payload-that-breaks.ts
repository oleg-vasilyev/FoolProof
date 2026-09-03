const NOT_FOUND = -1;

const NOTHING = 0;

const THE_WHOLE_MATCH = 0;

const FIRST_GROUP = 1;

const SECOND_GROUP = 2;

const NEXT_LINE = 1;

const A_BACKSLASH = "\\";

const A_NON_ASCII_CHARACTER = /[^\u0000-\u007f]/u;

const A_LINE = /\r?\n/;

const AN_INLINE_EVALUATOR =
  /(?:^|[\s;&|(])(?:node\s+(?:-e|--eval|-p|--print)|python3?\s+-c)\s+(['"])/g;

const A_HEREDOC_OPENER = /(?<!<)<<-?\s*(['"\\])?([A-Za-z_][A-Za-z0-9_]*)/;

const A_QUOTED_DELIMITER = undefined;

export const A_BACKSLASH_INSIDE = "a backslash";

export const A_NON_ASCII_INSIDE = "a non-ASCII character";

export interface Payload {
  readonly shape: string;
  readonly text: string;
  readonly verbatim: boolean;
}

const inlinePayloadsIn = (command: string): readonly Payload[] =>
  [...command.matchAll(AN_INLINE_EVALUATOR)].map((match) => {
    const quote = match[FIRST_GROUP] ?? "";
    const opens = (match.index ?? NOTHING) + match[THE_WHOLE_MATCH].length;
    const closes = command.indexOf(quote, opens);

    return {
      shape: match[THE_WHOLE_MATCH].trim(),
      text: closes === NOT_FOUND ? command.slice(opens) : command.slice(opens, closes),
      verbatim: false,
    };
  });

const heredocPayloadsIn = (command: string): readonly Payload[] => {
  const match = A_HEREDOC_OPENER.exec(command);

  if (match === null) {
    return [];
  }

  const delimiter = match[SECOND_GROUP] ?? "";
  const opened = command.slice(NOTHING, match.index).split(A_LINE).length - NEXT_LINE;
  const body = command.split(A_LINE).slice(opened + NEXT_LINE);
  const closed = body.findIndex((line) => line.trim() === delimiter);
  const bodyLines = closed === NOT_FOUND ? body : body.slice(NOTHING, closed);
  const afterTheBody = closed === NOT_FOUND ? [] : body.slice(closed + NEXT_LINE);
  const own = {
    shape: `<<${delimiter}`,
    text: bodyLines.join("\n"),
    verbatim: match[FIRST_GROUP] !== A_QUOTED_DELIMITER,
  };

  return [own, ...heredocPayloadsIn(afterTheBody.join("\n"))];
};

export const payloadsIn = (command: string): readonly Payload[] => [
  ...inlinePayloadsIn(command),
  ...heredocPayloadsIn(command),
];

export const whatBreaksIn = (text: string, verbatim: boolean): string | null => {
  if (text.includes(A_BACKSLASH)) {
    return A_BACKSLASH_INSIDE;
  }

  return !verbatim && A_NON_ASCII_CHARACTER.test(text) ? A_NON_ASCII_INSIDE : null;
};

export const shellPayloadThatBreaks = (command: string): string | null => {
  const broken = payloadsIn(command).flatMap((payload) => {
    const breaks = whatBreaksIn(payload.text, payload.verbatim);

    return breaks === null ? [] : [`${payload.shape} carries ${breaks}`];
  });

  if (broken.length === NOTHING) {
    return null;
  }

  return [
    `Refused: ${broken.join("; ")}.`,
    "A backslash or a non-ASCII character inside an inline evaluator or an unquoted",
    "heredoc is rewritten by the shell on the way in, and a backslash survives no heredoc",
    "here, quoted or not: the loss is downstream of the shell. Use Edit or Write for",
    "that content — write the payload to a file and run the file — or quote the",
    "delimiter (<<'EOF') when non-ASCII is all the body carries.",
  ].join("\n");
};
