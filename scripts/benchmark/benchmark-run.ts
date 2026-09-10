import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { verdictPathOf } from "../gates/gate-paths.ts";
import { GATE } from "../gates/gate-names.ts";
import type { GateVerdict } from "../gates/gate-verdict.ts";
import {
  BENCHMARK_DIR,
  RUNS_DIR,
  RUNS_LOG,
  benchmarkConfigOf,
  type BenchmarkConfig,
  type Files,
} from "./benchmark-config.ts";
import { CLOSING_MESSAGE, COMMIT_MESSAGE, debtNamedIn, obligationsMet, taskOf, type Task } from "./benchmark-task.ts";
import {
  RUNS_LOG_HEADER,
  agentOutcomeOf,
  headlineOf,
  recordJsonOf,
  recordNameOf,
  rowOf,
  stampOf,
  type AgentOutcome,
  type GateOutcome,
  type RunRecord,
} from "./benchmark-record.ts";


export const BENCHMARK_REPORTS = "reports/benchmark";

export const CLONES_FOLDER = "foolproof-benchmark";

export const CLONE_FOLDER = "clone";

export const AGENT_OUTPUT = "agent.json";

export const CLOSING_FILE = "closing.md";

export const TRANSCRIPT_FILE = "transcript.jsonl";

export const FENCE_LOG = "reports/benchmark-fence.log";

export const FENCE_HOOK = ".claude/hooks/refuse-a-step-outside-the-fence.mjs";

export const FENCE_REPORT = "fence.log";

export const CLONE_SETTINGS = ".claude/settings.local.json";

export const RUNNER_SOURCE = "scripts/benchmark";

export const SCRATCHPADS_FOLDER = "claude";

export const HOOK_TIMEOUT_S = 10;

const FENCED_TOOLS = "Read|Edit|Write|MultiEdit|NotebookEdit|Glob|Grep|Bash";

const A_PLAIN_TOKEN = /^[\w.[\]-]+$/;

const A_PLAIN_PATH = /^[\w./-]+$/;

const NOT_A_SLUG_CHARACTER = /[^A-Za-z0-9]/g;

const SNAPSHOT_COMMIT = "Snapshot for the benchmark: history, benchmark/ and scripts/benchmark/ removed";

const NAMED_RUN = true;

const ONE_COMMIT = 1;

const NOTHING = 0;

const PASSED = 0;

const FAILED = 1;

const JSON_INDENT = 2;

const OUTPUT_LIMIT = 64 * 1024 * 1024;

const QUICK_GATES = [GATE.lint, GATE.typecheck, GATE.docsCheck, GATE.coverage] as const;

export interface ShellResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export type Shell = (command: string, cwd: string, input?: string) => ShellResult;

export interface BenchmarkRun {
  readonly root: string;
  readonly home: string;
  readonly tmp: string;
  readonly taskName: string;
  readonly model: string;
  readonly effort: string | null;
  readonly shell: Shell;
  readonly files: Files;
  readonly say: (line: string) => void;
  readonly now: () => Date;
}

interface Workspace {
  readonly run: BenchmarkRun;
  readonly task: Task;
  readonly config: BenchmarkConfig;
  readonly startedAt: Date;
  readonly reportDir: string;
  readonly clone: string;
}

export const realShell: Shell = (command, cwd, input) => {
  const done = spawnSync(command, {
    cwd,
    shell: true,
    input,
    encoding: "utf8",
    maxBuffer: OUTPUT_LIMIT,
  });

  return { code: done.status ?? FAILED, stdout: done.stdout, stderr: done.stderr };
};

const checked = (result: ShellResult, doing: string): ShellResult => {
  if (result.code !== PASSED) {
    throw new Error(`${doing} failed (${String(result.code)}): ${result.stderr || result.stdout}`);
  }

  return result;
};

const plain = (value: string, what: string, shape: RegExp): string => {
  if (!shape.test(value)) {
    throw new Error(`${what} "${value}" is not plain enough to be put on a command line`);
  }

  return value;
};

export const projectSlugOf = (path: string): string => path.replaceAll(NOT_A_SLUG_CHARACTER, "-");

const forwardSlashed = (path: string): string => path.replaceAll("\\", "/");

const quotedRoot = (root: string): string => `"${forwardSlashed(root)}"`;

const memoryOf = (home: string, clone: string): string => join(home, ".claude", "projects", projectSlugOf(clone));

export const fenceSettingsFor = (clone: string, scratchpads: string, memory: string): string =>
  `${JSON.stringify(
    {
      hooks: {
        PreToolUse: [
          {
            matcher: FENCED_TOOLS,
            hooks: [
              {
                type: "command",
                command: `node ${FENCE_HOOK} ${[clone, scratchpads, memory].map(quotedRoot).join(" ")}`,
                timeout: HOOK_TIMEOUT_S,
                statusMessage: "Checking the call stays inside the clone…",
              },
            ],
          },
        ],
      },
    },
    null,
    JSON_INDENT
  )}\n`;

const snapshotOf = (space: Workspace): string =>
  checked(space.run.shell("git rev-parse --short HEAD", space.run.root), "reading HEAD").stdout.trim();

const prepareClone = (space: Workspace): void => {
  const { run, clone } = space;
  const around = join(clone, "..");

  run.files.remove(around);
  run.files.mkdir(around);
  checked(
    run.shell(`git clone -q --depth 1 "${pathToFileURL(run.root).href}" ${CLONE_FOLDER}`, around),
    "cloning"
  );
  run.files.remove(join(clone, ".git"));
  run.files.remove(join(clone, BENCHMARK_DIR));
  run.files.remove(join(clone, RUNNER_SOURCE));
  checked(run.shell("git init -q", clone), "git init");
  checked(run.shell("git add -A", clone), "git add");
  checked(
    run.shell(
      `git -c user.name=benchmark -c user.email=benchmark@local commit -q -m "${SNAPSHOT_COMMIT}"`,
      clone
    ),
    "the snapshot commit"
  );
  if (run.files.read(join(clone, FENCE_HOOK)) === null) {
    throw new Error(`${FENCE_HOOK} is not in the clone, so the fence would be missing silently`);
  }

  run.files.write(
    join(clone, CLONE_SETTINGS),
    fenceSettingsFor(clone, join(run.tmp, SCRATCHPADS_FOLDER), memoryOf(run.home, clone))
  );
  run.say(`clone: ${clone}`);
};

const installDependencies = (space: Workspace): void => {
  checked(space.run.shell("npm ci --silent", space.clone), "npm ci");
  space.run.say("dependencies installed");
};

const agentCommandOf = (space: Workspace): string => {
  const { run, config } = space;
  const model = plain(run.model, "model", A_PLAIN_TOKEN);
  const effort = run.effort === null ? "" : ` --effort ${plain(run.effort, "effort", A_PLAIN_TOKEN)}`;

  return (
    `claude -p --model ${model}${effort} --output-format json ` +
    `--dangerously-skip-permissions --disallowedTools WebSearch WebFetch ` +
    `--max-turns ${String(config.maxTurns)} --max-budget-usd ${String(config.maxBudgetUsd)}`
  );
};

const agentEndOf = (outcome: AgentOutcome): string => {
  if (outcome.aborted !== null) {
    return `VOID, ${outcome.aborted}, cut off`;
  }

  return outcome.finished ? "finished" : "did not finish";
};

const runAgent = (space: Workspace): AgentOutcome => {
  const { run, task, reportDir, clone } = space;
  const began = run.now().getTime();
  const result = run.shell(agentCommandOf(space), clone, task.brief);
  const outcome = agentOutcomeOf(result.stdout, run.now().getTime() - began);

  run.files.write(join(reportDir, AGENT_OUTPUT), result.stdout);
  run.files.write(join(reportDir, CLOSING_FILE), outcome.closing);
  run.say(
    `agent: ${agentEndOf(outcome)} in ${String(outcome.turns)} turns, $${outcome.costUsd.toFixed(2)}`
  );

  return outcome;
};

const keepTranscript = (space: Workspace, agent: AgentOutcome): string | null => {
  const { run, reportDir, clone } = space;

  if (agent.sessionId === null) {
    return null;
  }

  const kept = run.files.read(join(memoryOf(run.home, clone), `${agent.sessionId}.jsonl`));

  if (kept === null) {
    return null;
  }

  const copy = join(reportDir, TRANSCRIPT_FILE);

  run.files.write(copy, kept);

  return copy;
};

const gateVerdictIn = (space: Workspace, gate: GateVerdict["gate"], named = false): GateVerdict | null => {
  const text = space.run.files.read(join(space.clone, verdictPathOf(gate, named)));

  return text === null ? null : (JSON.parse(text) as GateVerdict);
};

const casesFailedIn = (verdict: GateVerdict | null, total: number): number => {
  if (verdict?.kind !== "ran" || verdict.numbers.kind !== "tests") {
    return total;
  }

  return verdict.numbers.cases === NOTHING ? total : verdict.numbers.failed;
};

const runAcceptance = (space: Workspace): RunRecord["acceptance"] => {
  const { run, task, clone } = space;
  const into = plain(task.acceptance.into, "the acceptance path", A_PLAIN_PATH);

  run.files.write(join(clone, into), task.acceptance.spec);
  run.shell(`node scripts/gates/gate-runner.ts test "${into}"`, clone);
  run.files.remove(join(clone, into));

  const failed = casesFailedIn(gateVerdictIn(space, GATE.test, NAMED_RUN), task.acceptance.cases);
  const acceptance = { passed: task.acceptance.cases - failed, total: task.acceptance.cases };

  run.say(`acceptance: ${String(acceptance.passed)}/${String(acceptance.total)}`);

  return acceptance;
};

const runQuickGates = (space: Workspace): readonly GateOutcome[] => {
  space.run.shell("npm run check:quick", space.clone);

  const gates = QUICK_GATES.map((gate) => ({ gate, ok: gateVerdictIn(space, gate)?.ok === true }));

  space.run.say(`gates: ${gates.map((gate) => `${gate.gate} ${gate.ok ? "green" : "red"}`).join(", ")}`);

  return gates;
};

const fenceHitsIn = (space: Workspace): number => {
  const log = space.run.files.read(join(space.clone, FENCE_LOG));
  const hits = log === null ? NOTHING : log.split("\n").filter((line) => line !== "").length;

  if (log !== null) {
    space.run.files.write(join(space.reportDir, FENCE_REPORT), log);
  }

  space.run.say(`fence: ${String(hits)} refusals`);

  return hits;
};

const commitsMadeIn = (space: Workspace): number =>
  Number(checked(space.run.shell("git rev-list --count HEAD", space.clone), "counting commits").stdout) -
  ONE_COMMIT;

const treeCleanIn = (space: Workspace): boolean =>
  checked(space.run.shell("git status --porcelain", space.clone), "git status").stdout.trim() === "";

const lastCommitIn = (space: Workspace): string =>
  checked(space.run.shell("git log -1 --format=%B", space.clone), "reading the last commit").stdout;

const lookInto =
  (space: Workspace, closing: string, commit: string) =>
  (file: string): string | null => {
    switch (file) {
      case COMMIT_MESSAGE:
        return commit;

      case CLOSING_MESSAGE:
        return closing;

      default:
        return space.run.files.read(join(space.clone, file));
    }
  };

const recordRun = (space: Workspace, record: RunRecord): void => {
  const { run } = space;
  const runsDir = join(run.root, RUNS_DIR);
  const log = join(run.root, RUNS_LOG);

  run.files.mkdir(runsDir);
  run.files.write(join(runsDir, `${recordNameOf(record)}.json`), recordJsonOf(record));
  run.files.write(log, `${run.files.read(log) ?? RUNS_LOG_HEADER}${rowOf(record)}`);
  run.say(headlineOf(record));
};

export const runBenchmark = (run: BenchmarkRun): RunRecord => {
  const startedAt = run.now();
  const config = benchmarkConfigOf(run.root, run.files);
  const task = taskOf(run.root, run.taskName, run.files);
  const runName = `${stampOf(startedAt.toISOString())}-${task.name}`;
  const reportDir = join(run.root, BENCHMARK_REPORTS, runName);
  const clone = join(run.tmp, CLONES_FOLDER, runName, CLONE_FOLDER);
  const space: Workspace = { run, task, config, startedAt, reportDir, clone };
  const snapshot = snapshotOf(space);

  run.files.mkdir(reportDir);
  prepareClone(space);
  installDependencies(space);

  const agent = runAgent(space);
  const transcript = keepTranscript(space, agent);
  const acceptance = runAcceptance(space);
  const gates = runQuickGates(space);
  const fenceHits = fenceHitsIn(space);
  const commit = lastCommitIn(space);
  const record: RunRecord = {
    task: task.name,
    taskVersion: task.version,
    snapshot,
    model: run.model,
    effort: run.effort,
    startedAt: startedAt.toISOString(),
    clone,
    transcript,
    agent,
    acceptance,
    gates,
    obligations: obligationsMet(task, lookInto(space, agent.closing, commit)),
    fenceHits,
    commits: commitsMadeIn(space),
    treeClean: treeCleanIn(space),
    debtNamed: debtNamedIn(task, [agent.closing, commit]),
  };

  recordRun(space, record);

  return record;
};
