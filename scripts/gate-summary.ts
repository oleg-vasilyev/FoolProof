import { rerunCommandFor, type Battery } from "./gate-list.ts";
import { lineFor, type GateVerdict } from "./gate-verdict.ts";
import type { FamilyScore, GateNumbers, MutationScope } from "./gate-numbers.ts";
import { FAMILY_NAMES, type FamilyName } from "./mutation-families.ts";


const NO_FAILURES = 0;

const TWO_DECIMALS = 2;

const INDENTED = "  ";

const ONE_FILE = "1";

const A_NAMED_SCOPE = /^named (\d+)$/;

const percent = (value: number): string => String(Number(value.toFixed(TWO_DECIMALS)));

const scopedOver = (scope: MutationScope, family: FamilyName): string => {
  const named = A_NAMED_SCOPE.exec(scope);

  if (named !== null) {
    const count = named[1] ?? ONE_FILE;

    return `over ${count} named ${family} file${count === ONE_FILE ? "" : "s"}`;
  }

  switch (scope) {
    case "the diff":
      return `over the changed ${family}`;

    case "everything":
      return `over all the ${family}`;

    default:
      return `over the ${family} changed ${scope}`;
  }
};

const mutationPhrase = (scope: MutationScope, families: readonly FamilyScore[]): string =>
  FAMILY_NAMES.map((name) => {
    const family = families.find((scored) => scored.family === name);

    return family === undefined
      ? `nothing to run over the ${name}`
      : `${percent(family.score)}% ${scopedOver(scope, name)}`;
  }).join(" and ");

const counted = (cases: number, files: number): string =>
  `${String(cases)} cases in ${String(files)} files`;

const numbersPhrase = (numbers: GateNumbers): string | null => {
  switch (numbers.kind) {
    case "none":
      return null;

    case "harness":
      return `${counted(numbers.cases, numbers.files)} of harness units`;

    case "tests":
      return `${String(numbers.cases)} tests in ${String(numbers.files)} files, no coverage written`;

    case "coverage":
      return (
        `${String(numbers.cases)} tests in ${String(numbers.files)} files, coverage ` +
        [numbers.statements, numbers.branches, numbers.functions, numbers.lines].map(percent).join("/")
      );

    case "mutation":
      return `mutation ${mutationPhrase(numbers.scope, numbers.families)}`;

    case "e2e":
      return `e2e ${counted(numbers.cases, numbers.files)}`;

    case "missing":
      return `no numbers: ${numbers.expected} was not written`;
  }
};

const failedPhrase = (failed: number): string =>
  failed > NO_FAILURES ? `${String(failed)} failed` : "";

const redDetail = (numbers: GateNumbers): string => {
  switch (numbers.kind) {
    case "none":
    case "missing":
      return "";

    case "harness":
    case "tests":
    case "coverage":
    case "e2e":
      return failedPhrase(numbers.failed);

    case "mutation":
      return numbers.families
        .filter((family) => family.score < family.bar)
        .map((family) => `${percent(family.score)}% ${family.family} under the ${String(family.bar)}% bar`)
        .join(", ");
  }
};

const redPhrase = (verdict: GateVerdict): string => {
  const detail = verdict.kind === "ran" ? redDetail(verdict.numbers) : `skipped, ${verdict.because} was red`;

  return detail === "" ? `${verdict.gate} red` : `${verdict.gate} red (${detail})`;
};

const greenPhrases = (verdicts: readonly GateVerdict[]): readonly string[] =>
  verdicts.flatMap((verdict) => {
    const phrase = verdict.kind === "ran" && verdict.ok ? numbersPhrase(verdict.numbers) : null;

    return phrase === null ? [] : [phrase];
  });

export const gatesParagraph = (verdicts: readonly GateVerdict[], battery: Battery): string => {
  const red = verdicts.filter((verdict) => !verdict.ok);
  const phrases = greenPhrases(verdicts);
  const opening =
    red.length === NO_FAILURES
      ? `Gates: ${battery} green`
      : `Gates: ${battery} RED (${red.map(redPhrase).join(", ")})`;

  return phrases.length === NO_FAILURES ? `${opening}.` : `${opening} — ${phrases.join(", ")}.`;
};

export const summaryLines = (verdicts: readonly GateVerdict[]): readonly string[] => {
  const red = verdicts.filter((verdict) => !verdict.ok);

  return [
    ...verdicts.map(lineFor),
    ...(red.length === NO_FAILURES
      ? []
      : [
          "Re-run a red gate alone, not the whole battery:",
          ...red.map((verdict) => `${INDENTED}${rerunCommandFor(verdict.gate)}`),
        ]),
  ];
};

export const relativeTo = (root: string, file: string): string => {
  const slashed = file.replaceAll("\\", "/");
  const prefix = `${root.replaceAll("\\", "/").replace(/\/$/, "")}/`;

  return slashed.startsWith(prefix) ? slashed.slice(prefix.length) : slashed;
};

const failureLines = (numbers: GateNumbers, root: string): readonly string[] => {
  switch (numbers.kind) {
    case "harness":
    case "tests":
    case "coverage":
    case "e2e":
      return numbers.failures.map(
        (failure) => `${INDENTED}✗ ${relativeTo(root, failure.file)} › ${failure.name}: ${failure.message}`
      );

    case "none":
    case "mutation":
    case "missing":
      return [];
  }
};

export const reasonLines = (verdict: GateVerdict, root: string): readonly string[] => {
  if (verdict.kind !== "ran" || verdict.ok) {
    return [];
  }

  const failures = failureLines(verdict.numbers, root);

  return failures.length === NO_FAILURES
    ? verdict.tail.map((line) => `${INDENTED}${line}`)
    : failures;
};
