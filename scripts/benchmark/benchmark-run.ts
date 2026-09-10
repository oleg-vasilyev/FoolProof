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

export const CLONE_FOLDER = "clone";

export const AGENT_OUTPUT = "agent.json";

export const CLOSING_FILE = "closing.md";

const A_PLAIN_TOKEN = /^[\w.[\]-]+$/;

const A_PLAIN_PATH = /^[\w./-]+$/;

const SNAPSHOT_COMMIT = "Snapshot for the benchmark, history and benchmark/ removed";

const NAMED_RUN = true;

const ONE_COMMIT = 1;

const NOTHING = 0;

const PASSED = 0;

const FAILED = 1;

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
  readonly workDir: string;
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

const snapshotOf = (space: Workspace): string =>
  checked(space.run.shell("git rev-parse --short HEAD", space.run.root), "reading HEAD").stdout.trim();

const prepareClone = (space: Workspace): void => {
  const { run, workDir, clone } = space;

  run.files.remove(workDir);
  run.files.mkdir(workDir);
  checked(
    run.shell(`git clone -q --depth 1 "${pathToFileURL(run.root).href}" ${CLONE_FOLDER}`, workDir),
    "cloning"
  );
  run.files.remove(join(clone, ".git"));
  run.files.remove(join(clone, BENCHMARK_DIR));
  checked(run.shell("git init -q", clone), "git init");
  checked(run.shell("git add -A", clone), "git add");
  checked(
    run.shell(
      `git -c user.name=benchmark -c user.email=benchmark@local commit -q -m "${SNAPSHOT_COMMIT}"`,
      clone
    ),
    "the snapshot commit"
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

const runAgent = (space: Workspace): AgentOutcome => {
  const { run, task, workDir, clone } = space;
  const began = run.now().getTime();
  const result = run.shell(agentCommandOf(space), clone, task.brief);
  const outcome = agentOutcomeOf(result.stdout, run.now().getTime() - began);

  run.files.write(join(workDir, AGENT_OUTPUT), result.stdout);
  run.files.write(join(workDir, CLOSING_FILE), outcome.closing);
  run.say(
    `agent: ${outcome.finished ? "finished" : "did not finish"} in ${String(outcome.turns)} turns, ` +
      `$${outcome.costUsd.toFixed(2)}`
  );

  return outcome;
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
  const workDir = join(run.root, BENCHMARK_REPORTS, `${stampOf(startedAt.toISOString())}-${task.name}`);
  const space: Workspace = { run, task, config, startedAt, workDir, clone: join(workDir, CLONE_FOLDER) };
  const snapshot = snapshotOf(space);

  prepareClone(space);
  installDependencies(space);

  const agent = runAgent(space);
  const acceptance = runAcceptance(space);
  const gates = runQuickGates(space);
  const commit = lastCommitIn(space);
  const record: RunRecord = {
    task: task.name,
    taskVersion: task.version,
    snapshot,
    model: run.model,
    effort: run.effort,
    startedAt: startedAt.toISOString(),
    agent,
    acceptance,
    gates,
    obligations: obligationsMet(task, lookInto(space, agent.closing, commit)),
    commits: commitsMadeIn(space),
    treeClean: treeCleanIn(space),
    debtNamed: debtNamedIn(task, [agent.closing, commit]),
  };

  recordRun(space, record);

  return record;
};
