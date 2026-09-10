import { beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import { GATE } from "../gates/gate-names.ts";
import type { Files } from "./benchmark-config.ts";
import type { Task } from "./benchmark-task.ts";
import type { RunRecord } from "./benchmark-record.ts";
import type { BenchmarkRun } from "./benchmark-run.ts";


const spawnSyncSpy = vi.fn();

vi.mock("node:child_process", () => ({
  spawnSync: (command: unknown, options: unknown) => spawnSyncSpy(command, options),
}));

const verdictPathOfSpy = vi.fn(
  (gate: string, named?: boolean) => `reports/gates/${gate}${named === true ? ".named" : ""}.json`
);

vi.mock("../gates/gate-paths.ts", () => ({
  verdictPathOf: (gate: string, named?: boolean) => verdictPathOfSpy(gate, named),
}));

const benchmarkConfigOfSpy = vi.fn();

vi.mock("./benchmark-config.ts", () => ({
  BENCHMARK_DIR: "benchmark",
  RUNS_DIR: "benchmark/runs",
  RUNS_LOG: "benchmark/RUNS.md",
  benchmarkConfigOf: (root: string, files: unknown) => benchmarkConfigOfSpy(root, files),
}));

const taskOfSpy = vi.fn();

const obligationsMetSpy = vi.fn();

const debtNamedInSpy = vi.fn();

vi.mock("./benchmark-task.ts", () => ({
  COMMIT_MESSAGE: "@commit",
  CLOSING_MESSAGE: "@closing",
  taskOf: (root: string, name: string, files: unknown) => taskOfSpy(root, name, files),
  obligationsMet: (task: unknown, look: unknown) => obligationsMetSpy(task, look),
  debtNamedIn: (task: unknown, texts: unknown) => debtNamedInSpy(task, texts),
}));

const agentOutcomeOfSpy = vi.fn();

const rowOfSpy = vi.fn((_record: unknown) => "| row |\n");

const headlineOfSpy = vi.fn((_record: unknown) => "the headline");

const recordJsonOfSpy = vi.fn((_record: unknown) => "{record}\n");

vi.mock("./benchmark-record.ts", () => ({
  RUNS_LOG_HEADER: "| header |\n",
  agentOutcomeOf: (stdout: string, ms: number) => agentOutcomeOfSpy(stdout, ms),
  headlineOf: (record: unknown) => headlineOfSpy(record),
  recordJsonOf: (record: unknown) => recordJsonOfSpy(record),
  recordNameOf: () => "stamp-task-model",
  rowOf: (record: unknown) => rowOfSpy(record),
  stampOf: () => "STAMP",
}));

const { realShell, runBenchmark } = await import("./benchmark-run.ts");

const ROOT = "D:/repo";

const A_MODEL = "claude-opus-5";

const NOTHING = 0;

const ONCE = 1;

const PASSED = 0;

const FAILED = 1;

const CASES = 11;

const FAILED_CASES = 2;

const COMMITS_WITH_SNAPSHOT = 3;

const TASK: Task = {
  name: "flying-start",
  version: 1,
  brief: "# do the thing",
  acceptance: { spec: "it()", into: "src/x.spec.ts", cases: CASES },
  obligations: [],
  debtPattern: "TECH-DEBT",
};

const CONFIG = { checkupModel: A_MODEL, checkupEffort: null, checkupTask: "flying-start", maxTurns: 5, maxBudgetUsd: 2 };

const AGENT = { finished: true, turns: 3, costUsd: 1, inputTokens: 1, outputTokens: 1, durationMs: 1, closing: "Decided: nothing.", sessionId: "s" };

const testVerdict = (cases: number, failed: number): string =>
  JSON.stringify({ kind: "ran", gate: "test", ok: failed === NOTHING, numbers: { kind: "tests", cases, failed, files: ONCE, failures: [] } });

const gateVerdict = (gate: string, ok: boolean): string => JSON.stringify({ kind: "ran", gate, ok });

class FilesStub {
  public readonly onDisk = new Map<string, string>();

  public readonly removed: string[] = [];

  public readonly made: string[] = [];

  public readonly files: Files = {
    read: (file) => this.onDisk.get(file) ?? null,
    write: (file, text) => {
      this.onDisk.set(file, text);
    },
    remove: (path) => {
      this.removed.push(path);
      this.onDisk.delete(path);
    },
    mkdir: (path) => {
      this.made.push(path);
    },
  };
}

const workDir = join(ROOT, "reports/benchmark", "STAMP-flying-start");

const clone = join(workDir, "clone");

const commandsRun: { command: string; cwd: string; input?: string }[] = [];

const answering = (command: string, cwd: string, input?: string) => {
  commandsRun.push({ command, cwd, input });

  if (command.startsWith("git rev-parse")) {
    return { code: PASSED, stdout: "9510df8\n", stderr: "" };
  }

  if (command.startsWith("git rev-list")) {
    return { code: PASSED, stdout: `${String(COMMITS_WITH_SNAPSHOT)}\n`, stderr: "" };
  }

  if (command.startsWith("git log")) {
    return { code: PASSED, stdout: "Title\n\nGates: check:phase green\n", stderr: "" };
  }

  if (command.startsWith("claude")) {
    return { code: PASSED, stdout: "{json}", stderr: "" };
  }

  return { code: PASSED, stdout: "", stderr: "" };
};

const shell = vi.fn(answering);

const said: string[] = [];

let disk: FilesStub;

const runOf = (): BenchmarkRun => ({
  root: ROOT,
  taskName: TASK.name,
  model: A_MODEL,
  effort: null,
  shell,
  files: disk.files,
  say: (line) => {
    said.push(line);
  },
  now: () => new Date("2026-09-10T13:00:00.000Z"),
});

const commandsMatching = (prefix: string) => commandsRun.filter((ran) => ran.command.startsWith(prefix));

const verdictAt = (gate: string, named = false): string =>
  join(clone, `reports/gates/${gate}${named ? ".named" : ""}.json`);

beforeEach(() => {
  vi.clearAllMocks();
  shell.mockImplementation(answering);
  commandsRun.length = NOTHING;
  said.length = NOTHING;
  disk = new FilesStub();
  taskOfSpy.mockReturnValue(TASK);
  benchmarkConfigOfSpy.mockReturnValue(CONFIG);
  agentOutcomeOfSpy.mockReturnValue(AGENT);
  obligationsMetSpy.mockReturnValue([{ name: "a", met: true }]);
  debtNamedInSpy.mockReturnValue(true);
  disk.onDisk.set(verdictAt(GATE.test, true), testVerdict(CASES, FAILED_CASES));

  for (const gate of [GATE.lint, GATE.typecheck, GATE.docsCheck, GATE.coverage]) {
    disk.onDisk.set(verdictAt(gate), gateVerdict(gate, gate !== GATE.docsCheck));
  }
});

describe("runBenchmark()", () => {
  describe("the clone", () => {
    it("should read the config and the task through the files it was given", () => {
      runBenchmark(runOf());

      expect(benchmarkConfigOfSpy).toHaveBeenCalledWith(ROOT, disk.files);
      expect(taskOfSpy).toHaveBeenCalledWith(ROOT, TASK.name, disk.files);
    });

    it("should clone HEAD without history into the run's folder under reports/", () => {
      runBenchmark(runOf());

      expect(commandsMatching("git clone")[NOTHING]).toEqual(
        expect.objectContaining({ command: expect.stringContaining("--depth 1"), cwd: workDir })
      );
      expect(commandsMatching("git clone")[NOTHING]?.command).toContain("file:///D:/repo");
    });

    it("should run exactly the clone, init, add and commit commands, and say where the clone is", () => {
      runBenchmark(runOf());

      expect(commandsRun.slice(ONCE, ONCE + ONCE + ONCE + ONCE + ONCE).map((ran) => ran.command)).toEqual([
        'git clone -q --depth 1 "file:///D:/repo" clone',
        "git init -q",
        "git add -A",
        "git -c user.name=benchmark -c user.email=benchmark@local commit -q -m " +
          '"Snapshot for the benchmark, history and benchmark/ removed"',
      ]);
      expect(disk.made).toContain(workDir);
      expect(disk.removed[NOTHING]).toBe(workDir);
      expect(said).toEqual([
        `clone: ${clone}`,
        "dependencies installed",
        "agent: finished in 3 turns, $1.00",
        "acceptance: 9/11",
        "gates: lint green, typecheck green, docs-check red, test:coverage green",
        "the headline",
      ]);
    });

    it("should strip the history and the benchmark folder before the snapshot commit", () => {
      runBenchmark(runOf());

      expect(disk.removed).toContain(join(clone, ".git"));
      expect(disk.removed).toContain(join(clone, "benchmark"));
      expect(commandsMatching("git init")[NOTHING]?.cwd).toBe(clone);
      expect(commandsMatching("git -c user.name=benchmark")[NOTHING]?.command).toContain("commit");
    });

    it("should install the clone's dependencies before the agent starts", () => {
      runBenchmark(runOf());

      const order = commandsRun.map((ran) => ran.command.split(" ")[NOTHING]);

      expect(order.indexOf("npm")).toBeLessThan(order.indexOf("claude"));
      expect(commandsMatching("npm ci")[NOTHING]?.cwd).toBe(clone);
    });

    it("should stop when the clone cannot be made", () => {
      shell.mockImplementationOnce(() => ({ code: PASSED, stdout: "9510df8", stderr: "" }));
      shell.mockImplementationOnce(() => ({ code: FAILED, stdout: "", stderr: "no git" }));

      expect(() => runBenchmark(runOf())).toThrow("cloning failed (1): no git");
    });
  });

  describe("the agent", () => {
    it("should hand the brief to claude on stdin, headless, in the clone, with the caps", () => {
      runBenchmark(runOf());
      const ran = commandsMatching("claude")[NOTHING];

      expect(ran?.cwd).toBe(clone);
      expect(ran?.input).toBe(TASK.brief);
      expect(ran?.command).toContain(`--model ${A_MODEL}`);
      expect(ran?.command).toContain("--output-format json");
      expect(ran?.command).toContain("--dangerously-skip-permissions");
      expect(ran?.command).toContain("--disallowedTools WebSearch WebFetch");
      expect(ran?.command).toContain("--max-turns 5");
      expect(ran?.command).toContain("--max-budget-usd 2");
      expect(ran?.command).not.toContain("--effort");
    });

    it("should pass the effort through when one was asked for, in one exact command", () => {
      runBenchmark({ ...runOf(), effort: "low" });

      expect(commandsMatching("claude")[NOTHING]?.command).toBe(
        `claude -p --model ${A_MODEL} --effort low --output-format json --dangerously-skip-permissions ` +
          "--disallowedTools WebSearch WebFetch --max-turns 5 --max-budget-usd 2"
      );
    });

    it("should install with npm ci, quietly", () => {
      runBenchmark(runOf());

      expect(commandsMatching("npm ci")[NOTHING]?.command).toBe("npm ci --silent");
    });

    it("should refuse a model or an effort that is not a plain token", () => {
      expect(() => runBenchmark({ ...runOf(), model: "sonnet; rm -rf /" })).toThrow("not plain enough");
      expect(() => runBenchmark({ ...runOf(), effort: "$(x)" })).toThrow("not plain enough");
    });

    it("should keep the raw output and the closing message beside the clone", () => {
      runBenchmark(runOf());

      expect(disk.onDisk.get(join(workDir, "agent.json"))).toBe("{json}");
      expect(disk.onDisk.get(join(workDir, "closing.md"))).toBe(AGENT.closing);
      expect(agentOutcomeOfSpy).toHaveBeenCalledWith("{json}", NOTHING);
    });

    it("should carry on to the scoring when the agent did not finish, and say so", () => {
      agentOutcomeOfSpy.mockReturnValue({ ...AGENT, finished: false });
      const record = runBenchmark(runOf());

      expect(record.agent.finished).toBe(false);
      expect(said).toContain("agent: did not finish in 3 turns, $1.00");
      expect(commandsMatching("npm run check:quick")).toHaveLength(ONCE);
    });
  });

  describe("the acceptance", () => {
    it("should copy the hidden spec in, run it through the clone's own runner, and take it out again", () => {
      runBenchmark(runOf());
      const into = join(clone, TASK.acceptance.into);

      expect(commandsMatching("node scripts/gates/gate-runner.ts test")[NOTHING]).toEqual({
        command: `node scripts/gates/gate-runner.ts test "${TASK.acceptance.into}"`,
        cwd: clone,
        input: undefined,
      });
      expect(disk.removed).toContain(into);
      expect(disk.onDisk.has(into)).toBe(false);
    });

    it("should read the verdict of the named run, not of the agent's last full suite", () => {
      disk.onDisk.set(verdictAt(GATE.test), testVerdict(CASES, NOTHING));
      runBenchmark(runOf());

      expect(verdictPathOfSpy).toHaveBeenCalledWith(GATE.test, true);
      expect(runBenchmark(runOf()).acceptance.passed).toBe(CASES - FAILED_CASES);
    });

    it("should count passed cases off the runner's verdict", () => {
      expect(runBenchmark(runOf()).acceptance).toEqual({ passed: CASES - FAILED_CASES, total: CASES });
    });

    it("should score a spec that did not compile as nothing passed", () => {
      disk.onDisk.set(verdictAt(GATE.test, true), testVerdict(NOTHING, NOTHING));

      expect(runBenchmark(runOf()).acceptance).toEqual({ passed: NOTHING, total: CASES });
    });

    it("should score a missing verdict as nothing passed", () => {
      disk.onDisk.delete(verdictAt(GATE.test, true));

      expect(runBenchmark(runOf()).acceptance.passed).toBe(NOTHING);
    });

    it("should refuse an acceptance path that is not a plain path", () => {
      taskOfSpy.mockReturnValue({ ...TASK, acceptance: { ...TASK.acceptance, into: "a b; rm" } });

      expect(() => runBenchmark(runOf())).toThrow("not plain enough");
    });
  });

  describe("the gates and the record", () => {
    it("should run the quick battery in the clone and read each gate's own verdict", () => {
      const record = runBenchmark(runOf());

      expect(commandsMatching("npm run check:quick")[NOTHING]?.cwd).toBe(clone);
      expect(record.gates).toEqual([
        { gate: GATE.lint, ok: true },
        { gate: GATE.typecheck, ok: true },
        { gate: GATE.docsCheck, ok: false },
        { gate: GATE.coverage, ok: true },
      ]);
    });

    it("should let the obligations look into the clone, the commit and the closing message", () => {
      runBenchmark(runOf());
      disk.onDisk.set(join(clone, "PLAN.md"), "plan");
      const look = obligationsMetSpy.mock.calls[NOTHING]?.[ONCE] as (file: string) => string | null;

      expect(look("PLAN.md")).toBe("plan");
      expect(look("@commit")).toContain("Gates: check:phase green");
      expect(look("@closing")).toBe(AGENT.closing);
      expect(look("missing.md")).toBeNull();
    });

    it("should read the history, the tree and the last message with the exact git commands", () => {
      runBenchmark(runOf());

      expect(commandsMatching("git rev-list")[NOTHING]?.command).toBe("git rev-list --count HEAD");
      expect(commandsMatching("git status")[NOTHING]?.command).toBe("git status --porcelain");
      expect(commandsMatching("git log")[NOTHING]?.command).toBe("git log -1 --format=%B");
      expect(commandsMatching("git rev-parse")[NOTHING]).toEqual({
        command: "git rev-parse --short HEAD",
        cwd: ROOT,
        input: undefined,
      });
    });

    it("should call the tree dirty when git status prints anything", () => {
      shell.mockImplementation((command: string, cwd: string, input?: string) =>
        command.startsWith("git status")
          ? { code: PASSED, stdout: " M file\n", stderr: "" }
          : answering(command, cwd, input)
      );

      expect(runBenchmark(runOf()).treeClean).toBe(false);
    });

    it("should count the agent's own commits, excluding the snapshot", () => {
      expect(runBenchmark(runOf()).commits).toBe(COMMITS_WITH_SNAPSHOT - ONCE);
    });

    it("should stop when the clone's history cannot be read", () => {
      shell.mockImplementation((command: string) =>
        command.startsWith("git log")
          ? { code: FAILED, stdout: "", stderr: "no commits" }
          : { code: PASSED, stdout: "1\n", stderr: "" }
      );

      expect(() => runBenchmark(runOf())).toThrow("reading the last commit failed (1): no commits");
    });

    it("should ask whether the debt was named in the closing message or the commit", () => {
      runBenchmark(runOf());

      expect(debtNamedInSpy).toHaveBeenCalledWith(TASK, [AGENT.closing, "Title\n\nGates: check:phase green\n"]);
    });

    it("should write the record under benchmark/runs and append a row to the log, header first", () => {
      const record = runBenchmark(runOf());

      expect(recordJsonOfSpy).toHaveBeenCalledWith(record);
      expect(disk.onDisk.get(join(ROOT, "benchmark/runs", "stamp-task-model.json"))).toBe("{record}\n");
      expect(disk.onDisk.get(join(ROOT, "benchmark/RUNS.md"))).toBe("| header |\n| row |\n");
    });

    it("should append to an existing log without a second header", () => {
      disk.onDisk.set(join(ROOT, "benchmark/RUNS.md"), "| header |\n| old |\n");
      runBenchmark(runOf());

      expect(disk.onDisk.get(join(ROOT, "benchmark/RUNS.md"))).toBe("| header |\n| old |\n| row |\n");
    });

    it("should carry the snapshot, the model and the start into the record", () => {
      const record: RunRecord = runBenchmark(runOf());

      expect(record).toEqual(
        expect.objectContaining({
          task: TASK.name,
          taskVersion: TASK.version,
          snapshot: "9510df8",
          model: A_MODEL,
          effort: null,
          startedAt: "2026-09-10T13:00:00.000Z",
          treeClean: true,
          debtNamed: true,
        })
      );
    });

    it("should end by saying the headline", () => {
      runBenchmark(runOf());

      expect(said.at(-ONCE)).toBe("the headline");
    });
  });
});

describe("realShell()", () => {
  it("should run through the platform shell in the given folder with the input on stdin", () => {
    spawnSyncSpy.mockReturnValue({ status: PASSED, stdout: "out", stderr: "" });

    expect(realShell("claude -p", clone, "brief")).toEqual({ code: PASSED, stdout: "out", stderr: "" });
    expect(spawnSyncSpy).toHaveBeenCalledWith(
      "claude -p",
      expect.objectContaining({ cwd: clone, shell: true, input: "brief", encoding: "utf8" })
    );
  });

  it("should report a process that died without a status as failed", () => {
    spawnSyncSpy.mockReturnValue({ status: null, stdout: "", stderr: "killed" });

    expect(realShell("x", clone).code).toBe(FAILED);
  });
});
