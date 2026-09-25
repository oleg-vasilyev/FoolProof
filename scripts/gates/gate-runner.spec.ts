import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GATE, LOCK } from "./shared/gate-names.ts";
import type { GateVerdict } from "./verdict/gate-verdict.ts";


const spawnSpy = vi.fn();

const mkdirSyncSpy = vi.fn();

const createWriteStreamSpy = vi.fn();

const logWriteSpy = vi.fn();

const logEndSpy = vi.fn();

const numbersForSpy = vi.fn();

const scopeOfSpy = vi.fn();

const verdictOfSpy = vi.fn();

const refusedVerdictSpy = vi.fn();

const reasonLinesSpy = vi.fn();

const readOrNullSpy = vi.fn();

const rewriteParagraphSpy = vi.fn();

const tidyRunsOfSpy = vi.fn();

const writeVerdictSpy = vi.fn();

const takeLockSpy = vi.fn();

const releaseSpy = vi.fn();

const isAliveSpy = vi.fn();

const refusalOfSpy = vi.fn();

const A_RUN = "2026-09-25T10-00-00.000Z-p4821";

vi.mock("node:child_process", () => ({
  spawn: (...args: readonly unknown[]) => spawnSpy(...args),
}));

vi.mock("node:fs", () => ({
  mkdirSync: (...args: readonly unknown[]) => mkdirSyncSpy(...args),
  createWriteStream: (...args: readonly unknown[]) => createWriteStreamSpy(...args),
}));

vi.mock("./verdict/gate-numbers.ts", () => ({
  numbersFor: (...args: readonly unknown[]) => numbersForSpy(...args),
  scopeOf: (gate: unknown, against: unknown, args: unknown) => scopeOfSpy(gate, against, args),
}));

vi.mock("./verdict/gate-verdict.ts", () => ({
  FAILED: 1,
  PASSED: 0,
  verdictOf: (...args: readonly unknown[]) => verdictOfSpy(...args),
  refusedVerdict: (...args: readonly unknown[]) => refusedVerdictSpy(...args),
  lineFor: () => "a line",
}));

vi.mock("./verdict/gate-summary.ts", () => ({
  reasonLines: (verdict: unknown, root: unknown) => reasonLinesSpy(verdict, root),
}));

vi.mock("./runs/run-folders.ts", () => ({
  runIdOf: () => A_RUN,
}));

vi.mock("./runs/runs-on-disk.ts", () => ({
  readOrNull: readOrNullSpy,
  rewriteParagraph: () => rewriteParagraphSpy(),
  tidyRunsOf: (gate: unknown, now: unknown) => tidyRunsOfSpy(gate, now),
  writeVerdict: (verdict: unknown) => writeVerdictSpy(verdict),
}));

vi.mock("./runs/run-lock.ts", () => ({
  isAlive: isAliveSpy,
  takeLock: (...args: readonly unknown[]) => takeLockSpy(...args),
}));

vi.mock("./runs/lock-refusal.ts", () => ({
  refusalOf: (...args: readonly unknown[]) => refusalOfSpy(...args),
}));

const {
  childEnvironment,
  exitCodeOf,
  holdFor,
  main,
  runGate,
  WITHOUT_EXPERIMENT_WARNINGS,
} = await import("./gate-runner.ts");


const PASSED = 0;

const RED = 2;

const FAILED = 1;

const ONCE = 1;

const NEVER = 0;

const FIRST = 0;

const SECOND = 1;

const THIRD = 2;

const LINT_FOLDER = `reports/runs/lint/${A_RUN}`;

const E2E_FOLDER = `reports/runs/e2e/${A_RUN}`;

const THE_NUMBERS = { kind: "findings", findings: [] } as const;

const THE_VERDICT = {
  kind: "ran",
  gate: GATE.lint,
  named: false,
  folder: LINT_FOLDER,
  ok: true,
  exitCode: PASSED,
} as unknown as GateVerdict;

const A_REFUSAL = { kind: "refused", gate: GATE.e2e, ok: false } as unknown as GateVerdict;

const A_SCOPE = "since v1.20.0";

const AN_ENV = { PATH: "/bin", HOME: "/home" };

const LINT_STEP = { bin: "node_modules/eslint/bin/eslint.js", args: ["--quiet", "src"] };

const TEST_STEP = { bin: "node_modules/vitest/vitest.mjs", args: ["run"] };

const TWO_STEPS = [
  { bin: "node_modules/typescript/bin/tsc", args: ["-p", "e2e"] },
  { bin: "node_modules/typescript/bin/tsc", args: ["-p", "e2e/pages"] },
];

const BATTERY_START = "2026-09-25T09:00:00.000Z";

const A_HOLDER = { pid: 5150, command: "node scripts/gates/gate-runner.ts e2e:changed", startedAt: BATTERY_START, folder: null };

class ChildStub extends EventEmitter {
  public stdout = Object.assign(new EventEmitter(), { setEncoding: vi.fn() });
  public stderr = Object.assign(new EventEmitter(), { setEncoding: vi.fn() });

  public say(text: string): void {
    this.stdout.emit("data", text);
  }

  public complain(text: string): void {
    this.stderr.emit("data", text);
  }

  public close(code: number | null): void {
    this.emit("close", code);
  }

  public fail(error: Error): void {
    this.emit("error", error);
  }
}

let child: ChildStub;

const onlyThese = (steps: readonly { bin: string; args: string[] }[]) => () => steps;

beforeEach(() => {
  vi.clearAllMocks();

  child = new ChildStub();
  spawnSpy.mockReturnValue(child);
  createWriteStreamSpy.mockReturnValue({ write: logWriteSpy, end: logEndSpy });
  scopeOfSpy.mockReturnValue(A_SCOPE);
  numbersForSpy.mockReturnValue(THE_NUMBERS);
  verdictOfSpy.mockReturnValue(THE_VERDICT);
  refusedVerdictSpy.mockReturnValue(A_REFUSAL);
  reasonLinesSpy.mockReturnValue([]);
  takeLockSpy.mockReturnValue({ ok: true, release: releaseSpy });
  refusalOfSpy.mockReturnValue("the e2e worlds are in use");
});

const runAndClose = async (code: number | null, against?: string) => {
  const pending = runGate(GATE.lint, against, onlyThese([LINT_STEP]));

  child.say("first line\nsecond");
  child.complain(" line\n");
  child.close(code);

  return pending;
};

describe("childEnvironment()", () => {
  it("should hand the child this environment with colour and experiment warnings switched off, and nothing more without a baseline", () => {
    expect(childEnvironment(AN_ENV, undefined)).toEqual({
      ...AN_ENV,
      NO_COLOR: "1",
      NODE_OPTIONS: WITHOUT_EXPERIMENT_WARNINGS,
    });
  });

  it("should switch the warnings off through NODE_OPTIONS, since a flag on the tool would not reach the workers it forks", () => {
    expect(WITHOUT_EXPERIMENT_WARNINGS).toBe("--disable-warning=ExperimentalWarning");
    expect(childEnvironment({ ...AN_ENV, NODE_OPTIONS: "--max-old-space-size=4096" }, undefined)).toEqual(
      expect.objectContaining({ NODE_OPTIONS: `--max-old-space-size=4096 ${WITHOUT_EXPERIMENT_WARNINGS}` })
    );
  });

  it("should add the baseline as MUTATE_AGAINST when there is one", () => {
    expect(childEnvironment(AN_ENV, "v1.20.0")).toEqual({
      ...AN_ENV,
      NO_COLOR: "1",
      NODE_OPTIONS: WITHOUT_EXPERIMENT_WARNINGS,
      MUTATE_AGAINST: "v1.20.0",
    });
  });
});

describe("holdFor()", () => {
  const STARTED = new Date(BATTERY_START);

  it("should hold nothing, and take no lock, for a gate whose tool writes only into its own folder", () => {
    const held = holdFor(GATE.test, "reports/runs/test/a", [], STARTED);

    expect(held.ok).toBe(true);
    expect(takeLockSpy).not.toHaveBeenCalled();
  });

  it("should take the e2e worlds' lock as this process, naming the command and the folder it writes into", () => {
    holdFor(GATE.e2eChanged, "reports/runs/e2e-changed/a", [], STARTED);

    expect(takeLockSpy).toHaveBeenCalledWith(
      "reports/gates/e2e-worlds.lock",
      {
        pid: process.pid,
        command: "node scripts/gates/gate-runner.ts e2e:changed",
        startedAt: BATTERY_START,
        folder: "reports/runs/e2e-changed/a",
      },
      isAliveSpy
    );
  });

  it("should turn a lost lock into a notice naming the holder and the command, files included, that re-runs this one", () => {
    takeLockSpy.mockReturnValue({ ok: false, holder: A_HOLDER });

    const held = holdFor(GATE.e2e, "reports/runs/e2e/a", ["e2e/a.e2e.spec.ts"], STARTED);

    expect(refusalOfSpy).toHaveBeenCalledWith(
      LOCK.e2eWorlds,
      A_HOLDER,
      "node scripts/gates/gate-runner.ts e2e e2e/a.e2e.spec.ts"
    );
    expect(held).toEqual({ ok: false, notice: "the e2e worlds are in use" });
  });
});

describe("runGate()", () => {
  it("should prune the gate's old runs before its own folder exists, so it can never prune itself", async () => {
    await runAndClose(PASSED);

    expect(tidyRunsOfSpy).toHaveBeenCalledTimes(ONCE);
    expect(tidyRunsOfSpy).toHaveBeenCalledWith(GATE.lint, expect.any(Date));
    expect(tidyRunsOfSpy.mock.invocationCallOrder[FIRST] ?? 0).toBeLessThan(
      mkdirSyncSpy.mock.invocationCallOrder[FIRST] ?? 0
    );
  });

  it("should prune by the clock the run started at, the same one its verdict carries", async () => {
    await runAndClose(PASSED);

    expect(tidyRunsOfSpy.mock.calls[FIRST]?.[SECOND]).toBeInstanceOf(Date);
    expect(tidyRunsOfSpy.mock.calls[FIRST]?.[SECOND]).toBe(verdictOfSpy.mock.calls[FIRST]?.[THIRD]);
  });

  it("should open a folder of its own, named after the gate and this run, before anything runs", async () => {
    await runAndClose(PASSED);

    expect(mkdirSyncSpy).toHaveBeenCalledWith(LINT_FOLDER, { recursive: true });
    expect(mkdirSyncSpy.mock.invocationCallOrder[FIRST] ?? 0).toBeLessThan(spawnSpy.mock.invocationCallOrder[FIRST] ?? 0);
  });

  it("should hand the steps its folder, so the tool writes there and nowhere shared", async () => {
    const steps = vi.fn(() => [LINT_STEP]);
    const pending = runGate(GATE.lint, undefined, steps);

    child.close(PASSED);
    await pending;

    expect(steps).toHaveBeenCalledWith(LINT_FOLDER);
  });

  it("should keep the log in the run's folder", async () => {
    await runAndClose(PASSED);

    expect(createWriteStreamSpy).toHaveBeenCalledWith(`${LINT_FOLDER}/gate.log`);
  });

  it("should run the step's entry file under this node with no shell, both streams piped, in the child environment", async () => {
    await runAndClose(PASSED, "v1.20.0");

    expect(spawnSpy).toHaveBeenCalledWith(process.execPath, [LINT_STEP.bin, ...LINT_STEP.args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: childEnvironment(process.env, "v1.20.0"),
    });
  });

  it("should open the log with the command the step ran, so the log says what it is", async () => {
    await runAndClose(PASSED);

    expect(logWriteSpy.mock.calls[FIRST]?.[FIRST]).toBe("$ node node_modules/eslint/bin/eslint.js --quiet src\n");
  });

  it("should read both streams as text, so a multibyte character split across chunks survives", async () => {
    await runAndClose(PASSED);

    expect(child.stdout.setEncoding).toHaveBeenCalledWith("utf8");
    expect(child.stderr.setEncoding).toHaveBeenCalledWith("utf8");
  });

  it("should stream every chunk of either stream into the log as it arrives", async () => {
    await runAndClose(PASSED);

    expect(logWriteSpy.mock.calls.slice(SECOND).map((call) => call[FIRST])).toEqual(["first line\nsecond", " line\n"]);
    expect(logEndSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should read the numbers for the gate's scope out of its own folder once it has closed", async () => {
    await runAndClose(PASSED, "v1.20.0");

    expect(scopeOfSpy).toHaveBeenCalledWith(GATE.lint, "v1.20.0", []);
    expect(numbersForSpy).toHaveBeenCalledWith(GATE.lint, A_SCOPE, readOrNullSpy, LINT_FOLDER);
  });

  it("should build the verdict from the run, the exit code, the clock and the output split into lines", async () => {
    const verdict = await runAndClose(RED);

    expect(verdict).toBe(THE_VERDICT);
    expect(verdictOfSpy).toHaveBeenCalledWith(
      { gate: GATE.lint, named: false, folder: LINT_FOLDER },
      RED,
      expect.any(Date),
      expect.any(Date),
      THE_NUMBERS,
      ["$ node node_modules/eslint/bin/eslint.js --quiet src", "first line", "second line", ""]
    );
  });

  it("should read a gate killed by a signal, which has no code, as failed", async () => {
    await runAndClose(null);

    expect(verdictOfSpy.mock.calls[FIRST]?.[SECOND]).toBe(FAILED);
  });

  it("should settle red when the gate could not even be started, with the reason in the log", async () => {
    const pending = runGate(GATE.lint, undefined, onlyThese([LINT_STEP]));

    child.fail(new Error("spawn ENOENT"));

    await pending;

    expect(verdictOfSpy.mock.calls[FIRST]?.[SECOND]).toBe(FAILED);
    expect(logWriteSpy.mock.calls[SECOND]?.[FIRST]).toContain(
      "could not run node node_modules/eslint/bin/eslint.js --quiet src: Error: spawn ENOENT"
    );
  });

  it("should settle once when a failed start is followed by a close, as node does", async () => {
    const pending = runGate(GATE.lint, undefined, onlyThese([LINT_STEP]));

    child.fail(new Error("spawn ENOENT"));
    child.close(null);

    await pending;

    expect(verdictOfSpy).toHaveBeenCalledTimes(ONCE);
    expect(logEndSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should leave the verdict in its folder, then rebuild the paragraph for the battery on disk", async () => {
    await runAndClose(PASSED);

    expect(writeVerdictSpy).toHaveBeenCalledTimes(ONCE);
    expect(writeVerdictSpy).toHaveBeenCalledWith(THE_VERDICT);
    expect(rewriteParagraphSpy).toHaveBeenCalledTimes(ONCE);
    expect(writeVerdictSpy.mock.invocationCallOrder[FIRST] ?? 0).toBeLessThan(
      rewriteParagraphSpy.mock.invocationCallOrder[FIRST] ?? 0
    );
  });
});

describe("runGate(), a gate that holds the e2e worlds", () => {
  const runE2e = async () => {
    const pending = runGate(GATE.e2e, undefined, onlyThese([TEST_STEP]));

    child.close(PASSED);

    return pending;
  };

  it("should release the lock once the verdict is written", async () => {
    await runE2e();

    expect(releaseSpy).toHaveBeenCalledTimes(ONCE);
    expect(writeVerdictSpy.mock.invocationCallOrder[FIRST] ?? 0).toBeLessThan(
      releaseSpy.mock.invocationCallOrder[FIRST] ?? 0
    );
  });

  it("should release the lock even when the run throws, so a crash never blocks the next one", async () => {
    verdictOfSpy.mockImplementation(() => {
      throw new Error("a broken report");
    });

    await expect(runE2e()).rejects.toThrow("a broken report");
    expect(releaseSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should refuse when another run holds them, running, pruning and writing nothing", async () => {
    takeLockSpy.mockReturnValue({ ok: false, holder: A_HOLDER });

    const verdict = await runGate(GATE.e2e, undefined, onlyThese([TEST_STEP]));

    expect(verdict).toBe(A_REFUSAL);
    expect(refusedVerdictSpy).toHaveBeenCalledWith(GATE.e2e, "the e2e worlds are in use", expect.any(Date));
    expect(spawnSpy).toHaveBeenCalledTimes(NEVER);
    expect(tidyRunsOfSpy).toHaveBeenCalledTimes(NEVER);
    expect(mkdirSyncSpy).toHaveBeenCalledTimes(NEVER);
    expect(writeVerdictSpy).toHaveBeenCalledTimes(NEVER);
    expect(rewriteParagraphSpy).toHaveBeenCalledTimes(NEVER);
    expect(releaseSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should take the lock for the folder it is about to open", async () => {
    await runE2e();

    expect(takeLockSpy.mock.calls[FIRST]?.[SECOND]).toEqual(expect.objectContaining({ folder: E2E_FOLDER }));
  });
});

describe("runGate(), a gate of two steps", () => {
  it("should run the second step only after the first passed, each under its own line in one log", async () => {
    const pending = runGate(GATE.e2eTypecheck, undefined, onlyThese(TWO_STEPS));

    child.close(PASSED);
    await new Promise((done) => setImmediate(done));
    child.close(PASSED);
    await pending;

    expect(spawnSpy.mock.calls.map((call) => call[SECOND])).toEqual([
      ["node_modules/typescript/bin/tsc", "-p", "e2e"],
      ["node_modules/typescript/bin/tsc", "-p", "e2e/pages"],
    ]);
    expect(logWriteSpy.mock.calls.map((call) => call[FIRST])).toEqual([
      "$ node node_modules/typescript/bin/tsc -p e2e\n",
      "$ node node_modules/typescript/bin/tsc -p e2e/pages\n",
    ]);
    expect(logEndSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should stop at the first red step and carry its code, never starting the next", async () => {
    const pending = runGate(GATE.e2eTypecheck, undefined, onlyThese(TWO_STEPS));

    child.close(RED);
    await pending;

    expect(spawnSpy).toHaveBeenCalledTimes(ONCE);
    expect(verdictOfSpy.mock.calls[FIRST]?.[SECOND]).toBe(RED);
  });
});

describe("runGate(), with arguments", () => {
  const runNamed = async () => {
    verdictOfSpy.mockReturnValue({ ...THE_VERDICT, gate: GATE.test });
    const pending = runGate(GATE.test, undefined, onlyThese([TEST_STEP]), ["src/a.spec.ts", "src/b.spec.ts"]);

    child.close(PASSED);

    return pending;
  };

  it("should mark a run with arguments as named, in a folder like any other", async () => {
    await runNamed();

    expect(verdictOfSpy.mock.calls[FIRST]?.[FIRST]).toEqual({
      gate: GATE.test,
      named: true,
      folder: `reports/runs/test/${A_RUN}`,
    });
  });

  it("should never rebuild the paragraph after a named run, though its verdict is written like any other", async () => {
    await runNamed();

    expect(writeVerdictSpy).toHaveBeenCalledTimes(ONCE);
    expect(rewriteParagraphSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should read the scope with the arguments, so a named mutation says so", async () => {
    const pending = runGate(GATE.mutationChanged, "v1.20.0", onlyThese([TEST_STEP]), ["scripts/a.ts"]);

    child.close(PASSED);
    await pending;

    expect(scopeOfSpy).toHaveBeenCalledWith(GATE.mutationChanged, "v1.20.0", ["scripts/a.ts"]);
  });
});

describe("exitCodeOf()", () => {
  it("should pass a ran gate's own code on, and read anything else as failed", () => {
    expect(exitCodeOf({ ...THE_VERDICT, exitCode: RED } as GateVerdict)).toBe(RED);
    expect(exitCodeOf(A_REFUSAL)).toBe(FAILED);
    expect(exitCodeOf({ kind: "skipped" } as unknown as GateVerdict)).toBe(FAILED);
  });
});

const ROOT = "D:/Temp/FoolProof";

describe("main()", () => {
  const say = vi.fn();

  it("should refuse a name that is no gate, without running anything", async () => {
    const status = await main(["node", "gate-runner.ts", "nonsense"], {}, say, ROOT);

    expect(status).toBe(FAILED);
    expect(say.mock.calls[FIRST]?.[FIRST]).toContain('"nonsense" is not a gate');
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it("should run the named gate with the baseline from the environment, say its line and pass its exit code on", async () => {
    verdictOfSpy.mockReturnValue({ ...THE_VERDICT, exitCode: RED });
    const pending = main(["node", "gate-runner.ts", GATE.lint], { MUTATE_AGAINST: "v1.20.0" }, say, ROOT);

    child.close(RED);

    expect(await pending).toBe(RED);
    expect(spawnSpy.mock.calls[FIRST]?.[THIRD]).toMatchObject({ env: { MUTATE_AGAINST: "v1.20.0" } });
    expect(spawnSpy.mock.calls[FIRST]?.[SECOND]).toEqual([
      "node_modules/eslint/bin/eslint.js",
      "--config",
      "scripts/gates/lint/eslint.config.js",
      "--quiet",
      "--format",
      "json",
      "--output-file",
      `${LINT_FOLDER}/lint-findings.json`,
      "src",
      "scripts",
      GATE.e2e,
    ]);
    expect(say).toHaveBeenCalledWith("a line");
  });

  it("should refuse files for a gate that takes none before anything runs or is written", async () => {
    const status = await main(["node", "gate-runner.ts", GATE.lint, "src/a.ts"], {}, say, ROOT);

    expect(status).toBe(FAILED);
    expect(say.mock.calls.at(-1)?.[FIRST]).toContain("lint takes no files");
    expect(spawnSpy).not.toHaveBeenCalled();
    expect(writeVerdictSpy).not.toHaveBeenCalled();
  });

  it("should say a refusal's line and exit red when another run holds what the gate needs", async () => {
    takeLockSpy.mockReturnValue({ ok: false, holder: A_HOLDER });

    const status = await main(["node", "gate-runner.ts", GATE.e2e], {}, say, ROOT);

    expect(status).toBe(FAILED);
    expect(say.mock.calls.map((call) => call[FIRST])).toEqual(["a line"]);
    expect(reasonLinesSpy).toHaveBeenCalledWith(A_REFUSAL, ROOT);
  });
});

describe("main(), the reasons under a red line", () => {
  const say = vi.fn();

  it("should take the gate from the first argument and pass the rest on, after the folder", async () => {
    const pending = main(["node", "gate-runner.ts", GATE.test, "src/a.spec.ts"], {}, say, ROOT);

    child.close(PASSED);
    await pending;

    expect(spawnSpy.mock.calls[FIRST]?.[SECOND]).toEqual([
      "node_modules/vitest/vitest.mjs",
      "run",
      "--config",
      "scripts/gates/test/vitest.config.ts",
      `--outputFile.json=reports/runs/test/${A_RUN}/results.json`,
      "src/a.spec.ts",
    ]);
  });

  it("should print the reasons the summary gives for a red verdict, after its line", async () => {
    verdictOfSpy.mockReturnValue({ ...THE_VERDICT, ok: false, exitCode: RED });
    reasonLinesSpy.mockReturnValue(["  ✗ a failure"]);
    const pending = main(["node", "gate-runner.ts", GATE.lint], {}, say, ROOT);

    child.close(RED);
    await pending;

    expect(reasonLinesSpy).toHaveBeenCalledWith({ ...THE_VERDICT, ok: false, exitCode: RED }, ROOT);
    expect(say.mock.calls.map((call) => call[FIRST])).toEqual(["a line", "  ✗ a failure"]);
  });
});
