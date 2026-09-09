import { MOST_FINDINGS, type Finding } from "./finding.ts";


export const A_TSC_LINE = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

const A_CONTINUATION = /^\s+\S/;

const FILE = 1;

const LINE = 2;

const COLUMN = 3;

const CODE = 4;

const MESSAGE = 5;

const NOTHING = 0;

const continued = (finding: Finding, line: string): Finding => ({
  ...finding,
  message: `${finding.message}\n${line.trim()}`,
});

export const typecheckFindingsIn = (output: readonly string[]): readonly Finding[] => {
  const findings: Finding[] = [];

  for (const line of output) {
    const match = A_TSC_LINE.exec(line);

    if (match !== null) {
      findings.push({
        file: match[FILE] ?? "",
        line: Number(match[LINE]),
        column: Number(match[COLUMN]),
        rule: match[CODE] ?? "",
        message: match[MESSAGE] ?? "",
      });
      continue;
    }

    const last = findings.at(-1);

    if (last !== undefined && A_CONTINUATION.test(line)) {
      findings[findings.length - 1] = continued(last, line);
    }
  }

  return findings.slice(NOTHING, MOST_FINDINGS);
};
