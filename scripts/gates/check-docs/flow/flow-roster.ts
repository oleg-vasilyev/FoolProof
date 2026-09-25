import { A_LINE, FIRST_GROUP, SECOND_GROUP, namesIn } from "../shared/markdown-text.ts";
import {
  AGENTS_FOLDER,
  FLOW_DOCUMENT,
  SKILLS_FOLDER,
  definedAgents,
  installedSkills,
  read,
} from "../shared/document-files.ts";
import { packageScripts } from "../shared/source-files.ts";
import { A_NAMED_COMMAND } from "../prose/named-commands.ts";


const A_NAMED_AGENT = /the ([a-z][a-z0-9-]*[a-z0-9]) agent/g;

const A_PARTICIPANT = /^\s*participant ([A-Za-z][A-Za-z0-9]*) as (.*)$/;

const AN_ERRAND_TO_AN_AGENT = /^\s*C->>([A-Za-z][A-Za-z0-9]*):.*?the ([a-z][a-z0-9-]*[a-z0-9]) agent/;

export const A_NAMED_SKILL = /the `?([a-z][a-z0-9-]*[a-z0-9])`? skill/g;

export interface FlowTargets {
  readonly agents: readonly string[];
  readonly skills: ReadonlySet<string>;
  readonly scripts: ReadonlySet<string>;
}

export const rosterComplaints = (drawing: string, targets: FlowTargets): readonly string[] => {
  const sentAn = new Set(namesIn(drawing, A_NAMED_AGENT));
  const reachedFor = namesIn(drawing, A_NAMED_SKILL);

  return [
    ...[...sentAn]
      .filter((agent) => !targets.agents.includes(agent))
      .map(
        (agent) =>
          `${FLOW_DOCUMENT}: sends an errand to the "${agent}" agent, ` +
          `which is not in ${AGENTS_FOLDER}`
      ),
    ...targets.agents
      .filter((agent) => !sentAn.has(agent))
      .map(
        (agent) =>
          `${AGENTS_FOLDER}/${agent}.md: an agent the drawing never sends an errand to — ` +
          `the map is how anybody learns this agent exists, and one absent from it is one ` +
          `nobody will think to run`
      ),
    ...reachedFor
      .filter((skill) => !targets.skills.has(skill))
      .map(
        (skill) =>
          `${FLOW_DOCUMENT}: draws a step reaching for the "${skill}" skill, ` +
          `which is not in ${SKILLS_FOLDER}`
      ),
    ...namesIn(drawing, A_NAMED_COMMAND)
      .filter((command) => !targets.scripts.has(command))
      .map(
        (command) =>
          `${FLOW_DOCUMENT}: draws "npm run ${command}", which package.json does not have`
      ),
    ...[...targets.skills]
      .filter((skill) => !reachedFor.includes(skill))
      .map(
        (skill) =>
          `${FLOW_DOCUMENT}: never reaches for the "${skill}" skill — the drawing is the ` +
          `only description of when a skill applies, so one missing from it is a rule ` +
          `nobody arrives at`
      ),
  ];
};

const laneOfTheNamedAgents = (lines: readonly string[]): string | undefined =>
  lines
    .map((line) => A_PARTICIPANT.exec(line))
    .find((participant) => participant?.[SECOND_GROUP]?.includes(AGENTS_FOLDER) === true)?.[FIRST_GROUP];

export const agentErrandsOffTheirLane = (drawing: string, agents: readonly string[]): readonly string[] => {
  const lines = drawing.split(A_LINE);
  const lane = laneOfTheNamedAgents(lines);

  if (lane === undefined) {
    return [
      `${FLOW_DOCUMENT}: no participant is labelled ${AGENTS_FOLDER}, so the errands sent to ` +
        `named agents have no lane to be held to — a check matching nothing reads exactly like ` +
        `one with nothing to report`,
    ];
  }

  return lines.flatMap((line) => {
    const errand = AN_ERRAND_TO_AN_AGENT.exec(line);
    const to = errand?.[FIRST_GROUP];
    const agent = errand?.[SECOND_GROUP];

    return to === undefined || agent === undefined || to === lane || !agents.includes(agent)
      ? []
      : [
          `${FLOW_DOCUMENT}: the ${agent} agent is sent its errand on lane ${to}, not on ${lane} ` +
            `where ${AGENTS_FOLDER} is drawn — a reader takes the lane for what kind of helper ` +
            `answers, so a named agent on another lane reads as one briefed by hand — ${line.trim()}`,
        ];
  });
};

export const theRosterTheFlowDisagreesWith = (): readonly string[] => {
  const drawing = read(FLOW_DOCUMENT);
  const agents = definedAgents();

  return [
    ...rosterComplaints(drawing, { agents, skills: new Set(installedSkills()), scripts: packageScripts() }),
    ...agentErrandsOffTheirLane(drawing, agents),
  ];
};
