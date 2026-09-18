import { A_LINE, FIRST_GROUP } from "../shared/markdown-text.ts";
import { FLOW_DOCUMENT, read } from "../shared/document-files.ts";


const A_REQUEST_FROM_CLAUDE = /^\s*C->>([A-Za-z][A-Za-z0-9]*):/;

const A_HANDBACK_TO_CLAUDE = /^\s*([A-Za-z][A-Za-z0-9]*)-?->>C:/;

const AN_ACTOR = /^\s*actor ([A-Za-z][A-Za-z0-9]*) as /m;

const CLAUDES_LANE = "participant C as ";

const NOBODY = "";

const CLAUDE = "C";

interface Errand {
  readonly asked: string;
  readonly complaints: readonly string[];
}

const NOTHING_ASKED: Errand = { asked: NOBODY, complaints: [] };

export const afterFlowLine = (errand: Errand, line: string, owner: string): Errand => {
  const asked = A_REQUEST_FROM_CLAUDE.exec(line)?.[FIRST_GROUP];

  if (asked !== undefined) {
    return asked === CLAUDE ? errand : { ...errand, asked };
  }

  const answering = A_HANDBACK_TO_CLAUDE.exec(line)?.[FIRST_GROUP];

  if (
    answering === undefined ||
    answering === owner ||
    errand.asked === NOBODY ||
    answering === errand.asked
  ) {
    return errand;
  }

  return {
    asked: NOBODY,
    complaints: [
      ...errand.complaints,
      `${FLOW_DOCUMENT}: the errand went to ${errand.asked} and ${answering} answered it — a ` +
        `reader follows a lane down the page, so a scene that changes lanes halfway shows a ` +
        `participant handing back work it was never given. Both scenes that did this were made ` +
        `by generalising a participant and moving only the arrows that named it — ${line.trim()}`,
    ],
  };
};

export const laneComplaints = (drawing: string): readonly string[] => {
  if (!drawing.includes(CLAUDES_LANE)) {
    return [
      `${FLOW_DOCUMENT}: this check follows the errands leaving "${CLAUDES_LANE}", which the ` +
        `drawing no longer declares — a check matching nothing reads exactly like one with ` +
        `nothing to report, so teach it the new id rather than leaving it quiet`,
    ];
  }

  const owner = AN_ACTOR.exec(drawing)?.[FIRST_GROUP] ?? NOBODY;

  return drawing
    .split(A_LINE)
    .reduce((errand, line) => afterFlowLine(errand, line, owner), NOTHING_ASKED).complaints;
};

export const repliesLeavingTheLaneTheyWereAskedOf = (): readonly string[] =>
  laneComplaints(read(FLOW_DOCUMENT));
