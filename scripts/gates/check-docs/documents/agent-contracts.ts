import { join } from "node:path";
import { AGENTS_FOLDER, definedAgents, read } from "../document-files.ts";


const NOWHERE = -1;

const FROM_THE_HEADING = 0;

const THE_BRIEF = "## What the brief must carry";

const THE_HANDBACK = "## What comes back";

const A_VERDICT_LINE = /^[ \t]*Verdict:/m;

const A_LATER_SECTION = /\n## /;

const asAHeading = (heading: string): RegExp => new RegExp(`^${heading}$`, "m");

const sectionAt = (text: string, heading: number): string => {
  const rest = text.slice(heading);
  const next = rest.search(A_LATER_SECTION);

  return next === NOWHERE ? rest : rest.slice(FROM_THE_HEADING, next);
};

export const agentFile = (agent: string): string => join(AGENTS_FOLDER, `${agent}.md`);

export const contractComplaints = (agent: string, text: string): readonly string[] => {
  const file = agentFile(agent);
  const brief = text.search(asAHeading(THE_BRIEF));
  const handback = text.search(asAHeading(THE_HANDBACK));

  if (brief === NOWHERE) {
    return [
      `${file}: no "${THE_BRIEF}" section — an agent that does not say what a brief ` +
        `owes it cannot refuse a thin one, and answers the question it was able to ` +
        `assemble instead of the one it was sent`,
    ];
  }

  if (handback === NOWHERE) {
    return [
      `${file}: no "${THE_HANDBACK}" section — whoever runs it then compares the ` +
        `report against what they hoped for, and a missing part of it reads as a ` +
        `part with nothing to say`,
    ];
  }

  return [
    ...(handback < brief
      ? [
          `${file}: "${THE_HANDBACK}" comes before "${THE_BRIEF}" — a contract is ` +
            `read in the order the errand runs, so the brief opens the file and the ` +
            `handback closes it`,
        ]
      : []),
    ...(A_VERDICT_LINE.test(sectionAt(text, handback))
      ? []
      : [
          `${file}: "${THE_HANDBACK}" names no "Verdict:" line — that one line is ` +
            `what carries the coverage beside the findings, and without it a pass ` +
            `that looked at nothing reports exactly like a pass that found nothing`,
        ]),
  ];
};

export const agentsWithoutAContract = (): readonly string[] =>
  definedAgents().flatMap((agent) => contractComplaints(agent, read(agentFile(agent))));
