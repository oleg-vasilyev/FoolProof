import { describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import type { Files } from "./benchmark-config.ts";


const mustReadSpy = vi.fn();

vi.mock("./benchmark-config.ts", () => ({
  TASKS_DIR: "benchmark/tasks",
  realFiles: {},
  mustRead: (files: unknown, file: string) => mustReadSpy(files, file),
}));

const { CLOSING_MESSAGE, COMMIT_MESSAGE, debtNamedIn, obligationsMet, taskDirOf, taskOf } = await import(
  "./benchmark-task.ts"
);

type Task = ReturnType<typeof taskOf>;

const ROOT = "D:/somewhere";

const A_TASK = "flying-start";

const VERSION = 3;

const CASES = 11;

const NOTHING = 0;

const FILES = {} as Files;

const declared = JSON.stringify({
  version: VERSION,
  acceptance: { into: "src/x.spec.ts", cases: CASES },
  obligations: [{ name: "row", file: "PLAN.md", pattern: "^\\| ROW \\|" }],
  debtPattern: "TECH-DEBT",
});

const onDisk: Record<string, string> = {
  [join(taskDirOf(ROOT, A_TASK), "task.json")]: declared,
  [join(taskDirOf(ROOT, A_TASK), "brief.md")]: "# the brief",
  [join(taskDirOf(ROOT, A_TASK), "acceptance.spec.ts")]: "it('x')",
};

mustReadSpy.mockImplementation((_files: unknown, file: string): string => {
  const text = onDisk[file];

  if (text === undefined) {
    throw new Error(`${file} is missing`);
  }

  return text;
});

const TASK: Task = {
  name: A_TASK,
  version: VERSION,
  brief: "",
  acceptance: { spec: "", into: "", cases: CASES },
  obligations: [
    { name: "in a file", file: "PLAN.md", pattern: "^\\| ROW \\|" },
    { name: "in the commit", file: COMMIT_MESSAGE, pattern: "^Gates:" },
    { name: "in the closing", file: CLOSING_MESSAGE, pattern: "decided" },
  ],
  debtPattern: "TECH-DEBT|simulator",
};

describe("taskOf()", () => {
  it("should assemble the task from its three files and the declared shape", () => {
    expect(taskOf(ROOT, A_TASK, FILES)).toEqual({
      name: A_TASK,
      version: VERSION,
      brief: "# the brief",
      acceptance: { spec: "it('x')", into: "src/x.spec.ts", cases: CASES },
      obligations: [{ name: "row", file: "PLAN.md", pattern: "^\\| ROW \\|" }],
      debtPattern: "TECH-DEBT",
    });
  });

  it("should read every file through the files it was given", () => {
    mustReadSpy.mockClear();
    taskOf(ROOT, A_TASK, FILES);

    expect(mustReadSpy.mock.calls.every(([files]) => files === FILES)).toBe(true);
    expect(mustReadSpy.mock.calls.map(([, file]) => file)).toEqual(Object.keys(onDisk));
  });

  it("should read the task from benchmark/tasks/<name>/", () => {
    expect(taskDirOf(ROOT, A_TASK)).toBe(join(ROOT, "benchmark", "tasks", A_TASK));
  });

  it("should refuse a task whose folder is missing", () => {
    expect(() => taskOf(ROOT, "no-such-task", FILES)).toThrow("task.json is missing");
  });
});

describe("obligationsMet()", () => {
  const look = vi.fn((file: string): string | null => {
    switch (file) {
      case "PLAN.md":
        return "| OTHER |\n| ROW | text |";

      case COMMIT_MESSAGE:
        return "Title\n\nGates: green";

      default:
        return null;
    }
  });

  it("should test each pattern against the file it names, line by line", () => {
    expect(obligationsMet(TASK, look)).toEqual([
      { name: "in a file", met: true },
      { name: "in the commit", met: true },
      { name: "in the closing", met: false },
    ]);
  });

  it("should ask the looker for exactly the files the obligations name", () => {
    look.mockClear();
    obligationsMet(TASK, look);

    expect(look.mock.calls.map(([file]) => file)).toEqual(["PLAN.md", COMMIT_MESSAGE, CLOSING_MESSAGE]);
  });

  it("should count a missing file as an obligation not met, never as an error", () => {
    expect(obligationsMet(TASK, () => null).filter((verdict) => verdict.met)).toHaveLength(NOTHING);
  });

  it("should match a two-line pattern in a file the clone checked out with Windows line endings", () => {
    const twoLines = { ...TASK, obligations: [{ name: "pair", file: "PLAN.md", pattern: "^\\| OTHER \\|\\n\\| ROW \\|" }] };

    expect(obligationsMet(twoLines, () => "| OTHER |\r\n| ROW | text |\r\n")).toEqual([{ name: "pair", met: true }]);
    expect(obligationsMet(twoLines, () => "| OTHER |\r\n\r\n| ROW | text |")).toEqual([{ name: "pair", met: false }]);
  });
});

describe("the two places that are not files", () => {
  it("should name the commit and the closing message the way task.json spells them", () => {
    expect(COMMIT_MESSAGE).toBe("@commit");
    expect(CLOSING_MESSAGE).toBe("@closing");
  });
});

describe("debtNamedIn()", () => {
  it("should match a line-anchored pattern on any line of the text", () => {
    expect(debtNamedIn({ ...TASK, debtPattern: "^simulator" }, ["first line\nsimulator next"])).toBe(true);
  });

  it("should find the debt pattern in any of the texts", () => {
    expect(debtNamedIn(TASK, ["nothing here", "the simulator stays uncommitted"])).toBe(true);
  });

  it("should say no when none of the texts names it", () => {
    expect(debtNamedIn(TASK, ["nothing here"])).toBe(false);
  });

  it("should treat the pattern as a regular expression with alternatives", () => {
    expect(debtNamedIn(TASK, ["see TECH-DEBT.md"])).toBe(true);
    expect(debtNamedIn({ ...TASK, debtPattern: "^never$" }, ["never mind"])).toBe(false);
  });
});
