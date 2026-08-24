import {
  A_LINE,
  DOCUMENTS,
  FIRST_GROUP,
  FLOW_DOCUMENT,
  SECOND_GROUP,
  read,
} from "./the-documents.ts";


const NOTHING = 0;

const A_MERMAID_FENCE = /```mermaid\n([\s\S]*?)```/g;

const A_STATEMENT_SEPARATOR = ";";

const A_DECLARED_LANE = /^\s*(?:participant|actor)\s+([A-Za-z][A-Za-z0-9]*)\s+as\s/;

const AN_ARROW = /^\s*([A-Za-z][A-Za-z0-9]*)\s*-{1,2}[>)x]{1,2}\s*[+-]?([A-Za-z][A-Za-z0-9]*)\s*:/;

const A_NOTE = /^\s*note\s+(?:over|right of|left of)\s+([^:]+):/i;

const AN_OPENING_BLOCK = /^\s*(?:rect|opt|alt|loop|par|critical|break)\b/;

const A_CLOSING_BLOCK = /^\s*end\s*$/;

const A_COLOURED_BAND = /^\s*rect\b/;

const A_STAGE_NOTE = /^\s*note over [^:]+: Stage \d+\./;

const BETWEEN_LANES = ",";

const ONE_STEP = 1;

export const drawingsIn = (document: string): string =>
  [...document.matchAll(A_MERMAID_FENCE)].map((fence) => fence[FIRST_GROUP] ?? "").join("");

export const lanesUsedIn = (line: string): readonly string[] => {
  const arrow = AN_ARROW.exec(line);

  if (arrow !== null) {
    return [arrow[FIRST_GROUP] ?? "", arrow[SECOND_GROUP] ?? ""];
  }

  const note = A_NOTE.exec(line);

  return note === null
    ? []
    : (note[FIRST_GROUP] ?? "").split(BETWEEN_LANES).map((lane) => lane.trim());
};

export const depthsWalking = (lines: readonly string[]): readonly number[] =>
  lines.reduce<readonly number[]>((depths, line) => {
    const was = depths[depths.length - ONE_STEP] ?? NOTHING;

    if (AN_OPENING_BLOCK.test(line)) {
      return [...depths, was + ONE_STEP];
    }

    return A_CLOSING_BLOCK.test(line) ? [...depths, was - ONE_STEP] : depths;
  }, []);

const lanesNobodyDeclared = (file: string, lines: readonly string[]): readonly string[] => {
  const declared = new Set(
    lines.flatMap((line) => {
      const lane = A_DECLARED_LANE.exec(line)?.[FIRST_GROUP];

      return lane === undefined ? [] : [lane];
    })
  );

  return lines
    .flatMap((line) => lanesUsedIn(line).map((lane) => ({ lane, line })))
    .filter((use) => use.lane.length > NOTHING && !declared.has(use.lane))
    .map(
      (use) =>
        `${file}: uses a lane called "${use.lane}" that no participant declares — ` +
        `mermaid invents one silently and draws it at the right-hand edge, so the page ` +
        `renders a drawing nobody wrote — ${use.line.trim()}`
    );
};

export const renderComplaints = (file: string, drawing: string): readonly string[] => {
  const lines = drawing.split(A_LINE);
  const opened = lines.filter((line) => AN_OPENING_BLOCK.test(line)).length;
  const closed = lines.filter((line) => A_CLOSING_BLOCK.test(line)).length;
  const bands = lines.filter((line) => A_COLOURED_BAND.test(line)).length;
  const stages = lines.filter((line) => A_STAGE_NOTE.test(line)).length;

  return [
    ...lanesNobodyDeclared(file, lines),
    ...(opened === closed
      ? []
      : [
          `${file}: ${String(opened)} blocks opened and ${String(closed)} closed — ` +
            `an unbalanced rect, opt, alt, loop or par prints a parse error where the drawing ` +
            `should be, and nothing else here reads the diagram as a diagram`,
        ]),
    ...(bands === stages
      ? []
      : [
          `${file}: ${String(bands)} coloured bands and ${String(stages)} stage ` +
            `notes — a band closed early and reopened later keeps the "end" count balanced ` +
            `and still splits one stage across two, so the count of bands is what says the ` +
            `drawing still has the shape it claims`,
        ]),
    ...(depthsWalking(lines).some((depth) => depth < NOTHING)
      ? [
          `${file}: an "end" closes a block that was never opened — the counts can ` +
            `still balance when one block is closed early and another late, so the drawing ` +
            `would render a structure nobody wrote`,
        ]
      : []),
  ];
};

export const separatorComplaints = (file: string, drawing: string): readonly string[] =>
  drawing
    .split(A_LINE)
    .filter((line) => line.includes(A_STATEMENT_SEPARATOR))
    .map(
      (line) =>
        `${file}: a mermaid line carries a ";", which the diagram reads as the end ` +
        `of a statement rather than as punctuation — in a sequence diagram that leaves ` +
        `half a sentence where an arrow should be, and the page prints a parse error ` +
        `instead of the drawing — ${line.trim()}`
    );

export const flowWouldNotRender = (): readonly string[] =>
  renderComplaints(FLOW_DOCUMENT, drawingsIn(read(FLOW_DOCUMENT)));

export const mermaidLinesCarryingASeparator = (): readonly string[] =>
  [...DOCUMENTS, FLOW_DOCUMENT].flatMap((document) =>
    separatorComplaints(document, drawingsIn(read(document)))
  );
