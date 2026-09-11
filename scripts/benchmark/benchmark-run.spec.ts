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

const transcriptTallyOfSpy = vi.fn();

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
  transcriptTallyOf: (jsonl: unknown) => transcriptTallyOfSpy(jsonl),
}));

const { HOOK_TIMEOUT_S, fenceSettingsFor, projectSlugOf, realShell, runBenchmark } = await import(
  "./benchmark-run.ts"
);

const ROOT = "D:/repo";

const HOME = "C:/Users/someone";

const TMP = "C:/tmp";

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

const BUDGET_USD = 2;

const CONFIG = { checkupModel: A_MODEL, checkupEffort: null, checkupTask: "flying-start", maxTurns: 5, maxBudgetUsd: BUDGET_USD };

const A_TALLY = { assistantMessages: 7, toolCalls: 4 };

const AGENT = { finished: true, turns: 3, costUsd: 1, inputTokens: 1, outputTokens: 1, durationMs: 1, closing: "Decided: nothing.", sessionId: "sess-1", aborted: null };

const testVerdict = (cases: number, failed: number): string =>
  JSON.stringify({ kind: "ran", gate: "test", ok: failed === NOTHING, numbers: { kind: "tests", cases, failed, files: ONCE, failures: [] } });

const gateVerdict = (gate: string, ok: boolean): string => JSON.stringify({ kind: "ran", gate, ok });

class FilesStub {
  public readonly onDisk = new Map<string, string>();

  public readonly removed: string[] = [];

  public readonly made: string[] = [];

  public readonly files: Files = {
    read: (file) =>
      this.onDisk.get(file) ??
      (hookOnDisk && file === join(clone, ".claude/hooks/refuse-a-step-outside-the-fence.mjs") ? "hook" : null),
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

let hookOnDisk = true;

const reportDir = join(ROOT, "reports/benchmark", "STAMP-flying-start");

const around = join(TMP, "foolproof-benchmark", "STAMP-flying-start");

const clone = join(around, "clone");

const transcriptOnDisk = join(HOME, ".claude", "projects", projectSlugOf(clone), "sess-1.jsonl");

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
  home: HOME,
  tmp: TMP,
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
  hookOnDisk = true;
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

    it("should cut the clone under the system temp folder, away from the repository", () => {
      runBenchmark(runOf());

      expect(commandsMatching("git clone")[NOTHING]).toEqual({
        command: 'git clone -q --depth 1 "file:///D:/repo" clone',
        cwd: around,
        input: undefined,
      });
      expect(disk.removed[NOTHING]).toBe(around);
      expect(disk.made).toContain(around);
      expect(disk.made).toContain(reportDir);
    });

    it("should strip the history, the benchmark folder and the runner's own source before the snapshot commit", () => {
      runBenchmark(runOf());

      expect(disk.removed).toContain(join(clone, ".git"));
      expect(disk.removed).toContain(join(clone, "benchmark"));
      expect(disk.removed).toContain(join(clone, "scripts/benchmark"));
      expect(commandsRun.slice(ONCE + ONCE, ONCE + ONCE + ONCE + ONCE + ONCE).map((ran) => ran.command)).toEqual([
        "git init -q",
        "git add -A",
        "git -c user.name=benchmark -c user.email=benchmark@local commit -q -m " +
          '"Snapshot for the benchmark: history, benchmark/ and scripts/benchmark/ removed"',
      ]);
      expect(commandsMatching("git init")[NOTHING]?.cwd).toBe(clone);
    });

    it("should fence the clone with the hook, through the clone's own local settings", () => {
      runBenchmark(runOf());

      expect(disk.onDisk.get(join(clone, ".claude/settings.local.json"))).toBe(
        fenceSettingsFor(clone, join(TMP, "claude"), join(HOME, ".claude", "projects", projectSlugOf(clone)))
      );
    });

    it("should stop when the fence hook is not in the clone, rather than run unfenced", () => {
      disk.files.remove(join(clone, ".claude/hooks/refuse-a-step-outside-the-fence.mjs"));
      disk.onDisk.delete(join(clone, ".claude/hooks/refuse-a-step-outside-the-fence.mjs"));
      hookOnDisk = false;

      expect(() => runBenchmark(runOf())).toThrow("is not in the clone, so the fence would be missing silently");
    });

    it("should say each step as it goes", () => {
      runBenchmark(runOf());

      expect(said).toEqual([
        `clone: ${clone}`,
        "dependencies installed",
        "agent: finished in 3 turns, $1.00",
        "acceptance: 9/11",
        "gates: lint green, typecheck green, docs-check red, test:coverage green",
        "fence: 0 refusals",
        "the headline",
      ]);
    });

    it("should install the clone's dependencies before the agent starts", () => {
      runBenchmark(runOf());

      const order = commandsRun.map((ran) => ran.command.split(" ")[NOTHING]);

      expect(order.indexOf("npm")).toBeLessThan(order.indexOf("claude"));
      expect(commandsMatching("npm ci")[NOTHING]).toEqual({ command: "npm ci --silent", cwd: clone, input: undefined });
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
      expect(ran?.command).toBe(
        `claude -p --model ${A_MODEL} --output-format json --dangerously-skip-permissions ` +
          "--disallowedTools WebSearch WebFetch --max-turns 5 --max-budget-usd 2"
      );
    });

    it("should pass the effort through when one was asked for", () => {
      runBenchmark({ ...runOf(), effort: "low" });

      expect(commandsMatching("claude")[NOTHING]?.command).toContain(`--model ${A_MODEL} --effort low --output`);
    });

    it("should refuse a model or an effort that is not a plain token", () => {
      expect(() => runBenchmark({ ...runOf(), model: "sonnet; rm -rf /" })).toThrow("not plain enough");
      expect(() => runBenchmark({ ...runOf(), effort: "$(x)" })).toThrow("not plain enough");
    });

    it("should keep the raw output and the closing message under reports/, beside the record", () => {
      runBenchmark(runOf());

      expect(disk.onDisk.get(join(reportDir, "agent.json"))).toBe("{json}");
      expect(disk.onDisk.get(join(reportDir, "closing.md"))).toBe(AGENT.closing);
      expect(agentOutcomeOfSpy).toHaveBeenCalledWith("{json}", NOTHING);
    });

    it("should copy the session's transcript out of the home folder and name the copy", () => {
      disk.onDisk.set(transcriptOnDisk, "{line}\n");
      const record = runBenchmark(runOf());

      expect(record.transcript).toBe(join(reportDir, "transcript.jsonl"));
      expect(disk.onDisk.get(join(reportDir, "transcript.jsonl"))).toBe("{line}\n");
    });

    it("should tally the kept transcript and carry the tally and the budget into the record", () => {
      disk.onDisk.set(transcriptOnDisk, "{line}\n");
      transcriptTallyOfSpy.mockReturnValue(A_TALLY);

      const record = runBenchmark(runOf());

      expect(transcriptTallyOfSpy).toHaveBeenCalledWith("{line}\n");
      expect(record.transcriptTally).toBe(A_TALLY);
      expect(record.budgetUsd).toBe(BUDGET_USD);
    });

    it("should record no transcript and no tally when the session left none, or had no id", () => {
      expect(runBenchmark(runOf())).toEqual(expect.objectContaining({ transcript: null, transcriptTally: null }));
      expect(transcriptTallyOfSpy).not.toHaveBeenCalled();

      agentOutcomeOfSpy.mockReturnValue({ ...AGENT, sessionId: null });

      expect(runBenchmark(runOf()).transcript).toBeNull();
    });

    it("should carry on to the scoring when the agent did not finish, and say so", () => {
      agentOutcomeOfSpy.mockReturnValue({ ...AGENT, finished: false });
      const record = runBenchmark(runOf());

      expect(record.agent.finished).toBe(false);
      expect(said).toContain("agent: did not finish in 3 turns, $1.00");
      expect(commandsMatching("npm run check:quick")).toHaveLength(ONCE);
    });

    it("should say VOID with the reason when the API cut the agent short, so the row is never mistaken for a failure", () => {
      agentOutcomeOfSpy.mockReturnValue({ ...AGENT, finished: false, aborted: "api error 429" });
      runBenchmark(runOf());

      expect(said).toContain("agent: VOID, api error 429, cut off in 3 turns, $1.00");
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

  describe("the gates, the fence and the record", () => {
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

    it("should count the fence's refusals off the log the hook wrote in the clone, and keep the log", () => {
      disk.onDisk.set(join(clone, "reports/benchmark-fence.log"), "t1 Refused: a\nt2 Refused: b\n");
      const record = runBenchmark(runOf());

      expect(record.fenceHits).toBe(ONCE + ONCE);
      expect(disk.onDisk.get(join(reportDir, "fence.log"))).toBe("t1 Refused: a\nt2 Refused: b\n");
      expect(said).toContain("fence: 2 refusals");
    });

    it("should count no refusals when the hook never wrote", () => {
      expect(runBenchmark(runOf()).fenceHits).toBe(NOTHING);
      expect(disk.onDisk.has(join(reportDir, "fence.log"))).toBe(false);
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

    it("should carry the snapshot, the model, the clone and the start into the record", () => {
      const record: RunRecord = runBenchmark(runOf());

      expect(record).toEqual(
        expect.objectContaining({
          task: TASK.name,
          taskVersion: TASK.version,
          snapshot: "9510df8",
          model: A_MODEL,
          effort: null,
          startedAt: "2026-09-10T13:00:00.000Z",
          clone,
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

describe("fenceSettingsFor()", () => {
  it("should wire the fence hook on every tool that names a path or runs a shell, with the clone, the scratchpads and the clone's memory as its roots", () => {
    const memory = "C:\\Users\\x\\.claude\\projects\\C--tmp-x-clone";
    const settings = JSON.parse(fenceSettingsFor("C:\\tmp\\x\\clone", "C:\\tmp\\claude", memory)) as {
      hooks: { PreToolUse: { matcher: string; hooks: { command: string; timeout: number }[] }[] };
    };
    const [entry] = settings.hooks.PreToolUse;

    expect(entry?.matcher).toBe("Read|Edit|Write|MultiEdit|NotebookEdit|Glob|Grep|Bash");
    expect(entry?.hooks[NOTHING]?.command).toBe(
      'node .claude/hooks/refuse-a-step-outside-the-fence.mjs "C:/tmp/x/clone" "C:/tmp/claude" "C:/Users/x/.claude/projects/C--tmp-x-clone"'
    );
    expect(entry?.hooks[NOTHING]?.timeout).toBe(HOOK_TIMEOUT_S);
  });
});

describe("projectSlugOf()", () => {
  it("should spell a path the way Claude Code names its project folders", () => {
    expect(projectSlugOf("D:\\Temp\\FoolProof")).toBe("D--Temp-FoolProof");
    expect(projectSlugOf("C:/tmp/foolproof-benchmark/x/clone")).toBe("C--tmp-foolproof-benchmark-x-clone");
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
