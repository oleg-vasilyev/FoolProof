export interface Finding {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly rule: string;
  readonly message: string;
}

export const MOST_FINDINGS = 30;

const NOTHING = 0;

const isAFinding = (written: unknown): written is Finding => {
  const { file, line, column, rule, message } = (written ?? {}) as Partial<Finding>;

  return (
    typeof file === "string" &&
    typeof line === "number" &&
    typeof column === "number" &&
    typeof rule === "string" &&
    typeof message === "string"
  );
};

export const savedFindingsIn = (json: string): readonly Finding[] | null => {
  let written: unknown;

  try {
    written = JSON.parse(json);
  } catch {
    return null;
  }

  return Array.isArray(written)
    ? (written as readonly unknown[]).filter(isAFinding).slice(NOTHING, MOST_FINDINGS)
    : null;
};
