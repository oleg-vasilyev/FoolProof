import {
  SOURCE_MUTATION_REPORT,
  SOURCE_STRYKER_CONFIG,
  TOOLING_MUTATION_REPORT,
  TOOLING_STRYKER_CONFIG,
} from "../shared/gate-paths.ts";


export type FamilyName = "source" | "tooling";

export interface Family {
  readonly family: FamilyName;
  readonly config: string;
  readonly report: string;
}

export const FAMILIES: readonly [Family, ...Family[]] = [
  {
    family: "source",
    config: SOURCE_STRYKER_CONFIG,
    report: SOURCE_MUTATION_REPORT,
  },
  {
    family: "tooling",
    config: TOOLING_STRYKER_CONFIG,
    report: TOOLING_MUTATION_REPORT,
  },
];

export const FAMILY_NAMES: readonly FamilyName[] = FAMILIES.map((family) => family.family);
