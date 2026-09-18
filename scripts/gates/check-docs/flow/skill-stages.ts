import { existsSync } from "node:fs";
import { FIRST_GROUP, namesIn, withoutFencedBlocks } from "../shared/markdown-text.ts";
import { FLOW_DOCUMENT, installedSkills, read, skillFile } from "../shared/document-files.ts";
import { descriptionIn } from "../prose/frontmatter-yaml.ts";
import { A_NAMED_SKILL } from "./flow-roster.ts";


const NOTHING = 0;

const NEXT_MARK = 1;

const A_STAGE = /^\s*note over [^:]+: Stage (\d+)\./gm;

const A_DECLARED_STAGE = /^> \*\*Stages? ([^*]+)\*\*/m;

const A_NUMBER = /\d+/g;

const A_STAGE_IN_PROSE = /\bstages? [\d,\sand]+/gi;

export const skillsByStage = (drawing: string): readonly (readonly [string, number])[] => {
  const marks = [...drawing.matchAll(A_STAGE)];

  return marks.flatMap((mark, index) => {
    const opens = mark.index ?? NOTHING;
    const closes = marks[index + NEXT_MARK]?.index ?? drawing.length;

    return namesIn(drawing.slice(opens, closes), A_NAMED_SKILL).map(
      (skill) => [skill, Number(mark[FIRST_GROUP])] as const
    );
  });
};

export const stagesDeclaredIn = (skill: string): readonly number[] => {
  const declared = A_DECLARED_STAGE.exec(withoutFencedBlocks(skill));

  return (declared?.[FIRST_GROUP]?.match(A_NUMBER) ?? []).map(Number);
};

export const stagesNamedIn = (description: string): readonly number[] =>
  (description.match(A_STAGE_IN_PROSE) ?? []).flatMap((said) =>
    (said.match(A_NUMBER) ?? []).map(Number)
  );

export const descriptionComplaints = (
  claimed: ReadonlyMap<string, readonly number[]>,
  described: ReadonlyMap<string, string>
): readonly string[] =>
  [...claimed].flatMap(([skill, stages]) => {
    const named = stagesNamedIn(described.get(skill) ?? "");

    return stages
      .filter((stage) => !named.includes(stage))
      .map(
        (stage) =>
          `${skillFile(skill)}: its title claims stage ${String(stage)} and its description ` +
          `never says so. A description is the only part of a skill read before it is ` +
          `loaded, so it is the only part that decides WHEN — and one naming no stage gets ` +
          `obeyed at the owner's first message, which has cost this project a phase's whole ` +
          `sequencing. Say "stage ${String(stage)}" in it`
      );
  });

export const stageComplaints = (
  reached: readonly (readonly [string, number])[],
  claimed: ReadonlyMap<string, readonly number[]>
): readonly string[] => {
  const reaches = (skill: string, stage: number): boolean =>
    reached.some(([named, drawn]) => named === skill && drawn === stage);

  return [
    ...reached
      .filter(([skill, stage]) => !(claimed.get(skill) ?? []).includes(stage))
      .map(
        ([skill, stage]) =>
          `${skillFile(skill)}: ${FLOW_DOCUMENT} reaches for this skill in stage ` +
          `${String(stage)}, and the skill claims no such stage — say "> **Stage ` +
          `${String(stage)}**" under its title`
      ),
    ...[...claimed].flatMap(([skill, stages]) =>
      stages
        .filter((stage) => !reaches(skill, stage))
        .map(
          (stage) =>
            `${skillFile(skill)}: claims stage ${String(stage)}, which ${FLOW_DOCUMENT} ` +
            `does not reach for it in — a claim nobody draws is a number that drifts`
        )
    ),
  ];
};

const stagesEachSkillClaims = (): ReadonlyMap<string, readonly number[]> =>
  new Map(
    installedSkills().map((skill) => [
      skill,
      existsSync(skillFile(skill)) ? stagesDeclaredIn(read(skillFile(skill))) : [],
    ])
  );

const descriptionsEachSkillCarries = (): ReadonlyMap<string, string> =>
  new Map(
    installedSkills().map((skill) => [
      skill,
      existsSync(skillFile(skill)) ? descriptionIn(read(skillFile(skill))) : "",
    ])
  );

export const stagesASkillAndTheFlowDisagreeOn = (): readonly string[] =>
  stageComplaints(skillsByStage(read(FLOW_DOCUMENT)), stagesEachSkillClaims());

export const descriptionsThatNameNoStage = (): readonly string[] =>
  descriptionComplaints(stagesEachSkillClaims(), descriptionsEachSkillCarries());
