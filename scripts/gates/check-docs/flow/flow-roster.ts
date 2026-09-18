import { namesIn } from "../shared/markdown-text.ts";
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

export const theRosterTheFlowDisagreesWith = (): readonly string[] =>
  rosterComplaints(read(FLOW_DOCUMENT), {
    agents: definedAgents(),
    skills: new Set(installedSkills()),
    scripts: packageScripts(),
  });
