import { join } from "node:path";
import { TASKS_DIR, mustRead, realFiles, type Files } from "./benchmark-config.ts";


export const COMMIT_MESSAGE = "@commit";

export const CLOSING_MESSAGE = "@closing";

const BRIEF_FILE = "brief.md";

const TASK_FILE = "task.json";

const ACCEPTANCE_FILE = "acceptance.spec.ts";

export interface Obligation {
  readonly name: string;
  readonly file: string;
  readonly pattern: string;
}

export interface Acceptance {
  readonly spec: string;
  readonly into: string;
  readonly cases: number;
}

export interface Task {
  readonly name: string;
  readonly version: number;
  readonly brief: string;
  readonly acceptance: Acceptance;
  readonly obligations: readonly Obligation[];
  readonly debtPattern: string;
}

interface TaskFile {
  readonly version: number;
  readonly acceptance: { readonly into: string; readonly cases: number };
  readonly obligations: readonly Obligation[];
  readonly debtPattern: string;
}

export const taskDirOf = (root: string, name: string): string => join(root, TASKS_DIR, name);

export const taskOf = (root: string, name: string, files: Files = realFiles): Task => {
  const directory = taskDirOf(root, name);
  const declared = JSON.parse(mustRead(files, join(directory, TASK_FILE))) as TaskFile;

  return {
    name,
    version: declared.version,
    brief: mustRead(files, join(directory, BRIEF_FILE)),
    acceptance: {
      spec: mustRead(files, join(directory, ACCEPTANCE_FILE)),
      into: declared.acceptance.into,
      cases: declared.acceptance.cases,
    },
    obligations: declared.obligations,
    debtPattern: declared.debtPattern,
  };
};

export type Look = (file: string) => string | null;

export interface ObligationVerdict {
  readonly name: string;
  readonly met: boolean;
}

export const obligationsMet = (task: Task, look: Look): readonly ObligationVerdict[] =>
  task.obligations.map((obligation) => ({
    name: obligation.name,
    met: new RegExp(obligation.pattern, "m").test(look(obligation.file) ?? ""),
  }));

export const debtNamedIn = (task: Task, texts: readonly string[]): boolean =>
  texts.some((text) => new RegExp(task.debtPattern, "m").test(text));
