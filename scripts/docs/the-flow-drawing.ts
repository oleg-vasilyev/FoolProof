import { existsSync } from "node:fs";
import {
  AGENTS_FOLDER,
  A_LINE,
  FIRST_GROUP,
  FLOW_DOCUMENT,
  SKILLS_FOLDER,
  definedAgents,
  installedSkills,
  namesIn,
  read,
  skillFile,
  withoutFencedBlocks,
} from "./the-documents.ts";
import { packageScripts } from "./the-repository.ts";


const NOTHING = 0;

const A_NAMED_AGENT = /the ([a-z][a-z0-9-]*[a-z0-9]) agent/g;

const A_NAMED_SKILL = /the `?([a-z][a-z0-9-]*[a-z0-9])`? skill/g;

const A_NAMED_COMMAND = /npm run ([a-z][a-z:-]*[a-z])/g;

const A_STAGE = /^\s*note over [^:]+: Stage (\d+)\./gm;

const A_DECLARED_STAGE = /^> \*\*Stages? ([^*]+)\*\*/m;

const A_NUMBER = /\d+/g;

const A_REQUEST_FROM_CLAUDE = /^\s*C->>([A-Za-z][A-Za-z0-9]*):/;

const A_HANDBACK_TO_CLAUDE = /^\s*([A-Za-z][A-Za-z0-9]*)-?->>C:/;

const AN_ACTOR = /^\s*actor ([A-Za-z][A-Za-z0-9]*) as /m;

const CLAUDES_LANE = "participant C as ";

const NOBODY = "";

const CLAUDE = "C";

const NEXT_MARK = 1;

export const flowOutOfStep = (): readonly string[] => {
  const drawing = read(FLOW_DOCUMENT);
  const installed = new Set(installedSkills());
  const defined = definedAgents();
  const sentAn = new Set(namesIn(drawing, A_NAMED_AGENT));
  const scripts = packageScripts();

  return [
    ...[...sentAn]
      .filter((agent) => !defined.includes(agent))
      .map(
        (agent) =>
          `${FLOW_DOCUMENT}: sends an errand to the "${agent}" agent, ` +
          `which is not in ${AGENTS_FOLDER}`
      ),
    ...defined
      .filter((agent) => !sentAn.has(agent))
      .map(
        (agent) =>
          `${AGENTS_FOLDER}/${agent}.md: an agent the drawing never sends an errand to — ` +
          `the map is how anybody learns this agent exists, and one absent from it is one ` +
          `nobody will think to run`
      ),
    ...namesIn(drawing, A_NAMED_SKILL)
      .filter((skill) => !installed.has(skill))
      .map(
        (skill) =>
          `${FLOW_DOCUMENT}: draws a step reaching for the "${skill}" skill, ` +
          `which is not in ${SKILLS_FOLDER}`
      ),
    ...namesIn(drawing, A_NAMED_COMMAND)
      .filter((command) => !scripts.has(command))
      .map(
        (command) =>
          `${FLOW_DOCUMENT}: draws "npm run ${command}", which package.json does not have`
      ),
    ...[...installed]
      .filter((skill) => !namesIn(drawing, A_NAMED_SKILL).includes(skill))
      .map(
        (skill) =>
          `${FLOW_DOCUMENT}: never reaches for the "${skill}" skill — the drawing is the ` +
          `only description of when a skill applies, so one missing from it is a rule ` +
          `nobody arrives at`
      ),
  ];
};

const skillsByStage = (drawing: string): readonly (readonly [string, number])[] => {
  const marks = [...drawing.matchAll(A_STAGE)];

  return marks.flatMap((mark, index) => {
    const opens = mark.index ?? NOTHING;
    const closes = marks[index + NEXT_MARK]?.index ?? drawing.length;

    return namesIn(drawing.slice(opens, closes), A_NAMED_SKILL).map(
      (skill) => [skill, Number(mark[FIRST_GROUP])] as const
    );
  });
};

const stagesClaimedBy = (skill: string): readonly number[] => {
  if (!existsSync(skillFile(skill))) {
    return [];
  }

  const declared = A_DECLARED_STAGE.exec(withoutFencedBlocks(read(skillFile(skill))));

  return (declared?.[FIRST_GROUP]?.match(A_NUMBER) ?? []).map(Number);
};

export const stagesOutOfStep = (): readonly string[] => {
  const reached = skillsByStage(read(FLOW_DOCUMENT));

  const reaches = (skill: string, stage: number): boolean =>
    reached.some(([named, drawn]) => named === skill && drawn === stage);

  return [
    ...reached
      .filter(([skill, stage]) => !stagesClaimedBy(skill).includes(stage))
      .map(
        ([skill, stage]) =>
          `${skillFile(skill)}: ${FLOW_DOCUMENT} reaches for this skill in stage ` +
          `${String(stage)}, and the skill claims no such stage — say "> **Stage ` +
          `${String(stage)}**" under its title`
      ),
    ...installedSkills().flatMap((skill) =>
      stagesClaimedBy(skill)
        .filter((stage) => !reaches(skill, stage))
        .map(
          (stage) =>
            `${skillFile(skill)}: claims stage ${String(stage)}, which ${FLOW_DOCUMENT} ` +
            `does not reach for it in — a claim nobody draws is a number that drifts`
        )
    ),
  ];
};

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

export const flowRepliesLeaveTheLaneTheyWereAskedOf = (): readonly string[] => {
  const drawing = read(FLOW_DOCUMENT);

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
