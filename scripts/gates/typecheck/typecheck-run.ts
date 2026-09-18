import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { TSC } from "../shared/tool-binaries.ts";
import { say } from "../shared/say.ts";
import type { Finding } from "../shared/finding.ts";
import { typecheckFindingsIn } from "./typecheck-findings.ts";


const PASSED = 0;

const FAILED = 1;

const NOTHING_SAID = 0;

const JSON_INDENT = 2;

const A_LINE = /\r?\n/;

export interface ProjectRun {
  readonly output: readonly string[];
  readonly status: number;
}

export const findingsOf = (runs: readonly ProjectRun[]): readonly Finding[] =>
  typecheckFindingsIn(runs.flatMap((run) => [...run.output]));

export const worstStatusOf = (runs: readonly ProjectRun[]): number =>
  runs.some((run) => run.status !== PASSED) ? FAILED : PASSED;

const linesOf = (text: string | null): readonly string[] =>
  text === null ? [] : text.split(A_LINE);

const checked = (project: string): ProjectRun => {
  const run = spawnSync(
    process.execPath,
    [TSC, "-p", project, "--noEmit", "--pretty", "false"],
    { encoding: "utf8" }
  );
  const output = [...linesOf(run.stdout), ...linesOf(run.stderr)];

  for (const line of output.filter((said) => said.trim().length > NOTHING_SAID)) {
    say(line);
  }

  return { output, status: run.status ?? FAILED };
};

export const runTypecheck = (projects: readonly string[], findingsPath: string): number => {
  const runs = projects.map(checked);

  mkdirSync(dirname(findingsPath), { recursive: true });
  writeFileSync(findingsPath, JSON.stringify(findingsOf(runs), null, JSON_INDENT));

  return worstStatusOf(runs);
};
