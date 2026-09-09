import { MOST_FINDINGS, type Finding } from "./finding.ts";


export const A_PARSE_ERROR = "parse";

const AN_ERROR = 2;

const NOTHING = 0;

interface LintMessage {
  readonly ruleId: string | null;
  readonly severity: number;
  readonly line?: number;
  readonly column?: number;
  readonly message: string;
}

interface LintResult {
  readonly filePath: string;
  readonly messages: readonly LintMessage[];
}

const byFileThenLine = (a: Finding, b: Finding): number =>
  a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column;

export const lintFindingsIn = (json: string): readonly Finding[] => {
  let results: unknown;

  try {
    results = JSON.parse(json);
  } catch {
    return [];
  }

  if (!Array.isArray(results)) {
    return [];
  }

  return (results as readonly LintResult[])
      .flatMap((result) =>
        result.messages
          .filter((message) => message.severity === AN_ERROR)
          .map((message) => ({
            file: result.filePath,
            line: message.line ?? NOTHING,
            column: message.column ?? NOTHING,
            rule: message.ruleId ?? A_PARSE_ERROR,
            message: message.message,
          }))
      )
      .sort(byFileThenLine)
    .slice(NOTHING, MOST_FINDINGS);
};
