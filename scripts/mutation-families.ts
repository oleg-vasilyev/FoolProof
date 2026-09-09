export type FamilyName = "source" | "tooling";

export interface Family {
  readonly family: FamilyName;
  readonly config: string;
  readonly report: string;
}

export const FAMILIES: readonly Family[] = [
  { family: "source", config: "stryker.config.json", report: "reports/mutation/mutation.json" },
  {
    family: "tooling",
    config: "stryker.scripts.json",
    report: "reports/mutation-scripts/mutation.json",
  },
];

export const FAMILY_NAMES: readonly FamilyName[] = FAMILIES.map((family) => family.family);
