import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GateVerdict } from "./gate-verdict.ts";


const spawnSpy = vi.fn();

const readFileSyncSpy = vi.fn();

const rmSyncSpy = vi.fn();

const mkdirSyncSpy = vi.fn();

const writeFileSyncSpy = vi.fn();

const logWriteSpy = vi.fn();

const logEndSpy = vi.fn();

const numbersForSpy = vi.fn();

const outputsOfSpy = vi.fn();

const scopeOfSpy = vi.fn();

const verdictOfSpy = vi.fn();

const gatesParagraphSpy = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: (...args: readonly unknown[]) => spawnSpy(...args),
}));

vi.mock("node:fs", () => ({
  readFileSync: (...args: readonly unknown[]) => readFileSyncSpy(...args),
  rmSync: (...args: readonly unknown[]) => rmSyncSpy(...args),
  mkdirSync: (...args: readonly unknown[]) => mkdirSyncSpy(...args),
  writeFileSync: (...args: readonly unknown[]) => writeFileSyncSpy(...args),
  createWriteStream: () => ({ write: logWriteSpy, end: logEndSpy }),
}));

vi.mock("./gate-numbers.ts", () => ({
  numbersFor: (gate: unknown, scope: unknown, read: unknown) => numbersForSpy(gate, scope, read),
  outputsOf: (gate: unknown) => outputsOfSpy(gate),
  scopeOf: (gate: unknown, against: unknown, args: unknown) => scopeOfSpy(gate, against, args),
}));

vi.mock("./gate-verdict.ts", () => ({
  FAILED: 1,
  PASSED: 0,
  verdictOf: (...args: readonly unknown[]) => verdictOfSpy(...args),
  lineFor: () => "a line",
}));

const reasonLinesSpy = vi.fn();

vi.mock("./gate-summary.ts", () => ({
  gatesParagraph: (verdicts: unknown, battery: unknown) => gatesParagraphSpy(verdicts, battery),
  reasonLines: (verdict: unknown, root: unknown) => reasonLinesSpy(verdict, root),
}));

const {
  batteryOnDisk,
  childEnvironment,
  forgetVerdicts,
  main,
  readOrNull,
  rewriteParagraph,
  runGate,
  verdictsOnDisk,
  writeVerdict,
} = await import("./gate-runner.ts");


const PASSED = 0;

const RED = 2;

const FAILED = 1;

const ONCE = 1;

const FIRST = 0;

const SECOND = 1;

const THIRD = 2;

const THE_NUMBERS = { kind: "none" } as const;

const THE_VERDICT = { kind: "ran", gate: "lint", named: false, ok: true, exitCode: PASSED } as unknown as GateVerdict;

const A_SCOPE = "since v1.20.0";

const AN_ENV = { PATH: "/bin", HOME: "/home" };

const LINT_STEP = { bin: "node_modules/eslint/bin/eslint.js", args: ["--quiet", "src"] };

const TEST_STEP = { bin: "node_modules/vitest/vitest.mjs", args: ["run"] };

const TWO_STEPS = [
  { bin: "node_modules/typescript/bin/tsc", args: ["-p", "e2e"] },
  { bin: "node_modules/typescript/bin/tsc", args: ["-p", "e2e/pages"] },
];

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

const filesOnDisk = (files: Record<string, string>): void => {
  readFileSyncSpy.mockImplementation((path: string) => {
    const text = files[path];

    if (text === undefined) {
      throw new Error("ENOENT");
    }

    return text;
  });
};

beforeEach(() => {
  vi.clearAllMocks();

  child = new ChildStub();
  spawnSpy.mockReturnValue(child);
  outputsOfSpy.mockReturnValue(["reports/tests/results.json"]);
  scopeOfSpy.mockReturnValue(A_SCOPE);
  numbersForSpy.mockReturnValue(THE_NUMBERS);
  verdictOfSpy.mockReturnValue(THE_VERDICT);
  gatesParagraphSpy.mockReturnValue("Gates: a paragraph.");
  reasonLinesSpy.mockReturnValue([]);
  filesOnDisk({});
});

const runAndClose = async (code: number | null, against?: string) => {
  const pending = runGate("lint", against, [LINT_STEP]);

  child.say("first line\nsecond");
  child.complain(" line\n");
  child.close(code);

  return pending;
};

describe("readOrNull()", () => {
  it("should hand back a file's text", () => {
    filesOnDisk({ "some.json": "{}" });

    expect(readOrNull("some.json")).toBe("{}");
    expect(readFileSyncSpy).toHaveBeenCalledWith("some.json", "utf8");
  });

  it("should say null for a file that is not there, rather than throw", () => {
    expect(readOrNull("missing.json")).toBeNull();
  });
});

describe("childEnvironment()", () => {
  it("should hand the child this environment with colour switched off, and nothing more without a baseline", () => {
    expect(childEnvironment(AN_ENV, undefined)).toEqual({ ...AN_ENV, NO_COLOR: "1" });
  });

  it("should add the baseline as MUTATE_AGAINST when there is one", () => {
    expect(childEnvironment(AN_ENV, "v1.20.0")).toEqual({ ...AN_ENV, NO_COLOR: "1", MUTATE_AGAINST: "v1.20.0" });
  });
});

describe("writeVerdict() and forgetVerdicts()", () => {
  it("should write a verdict under its gate's own file, as JSON a reader can open", () => {
    writeVerdict(THE_VERDICT);

    expect(writeFileSyncSpy).toHaveBeenCalledWith("reports/gates/lint.json", JSON.stringify(THE_VERDICT, null, 2));
  });

  it("should remove the verdict file of each gate named, and mind a missing one not at all", () => {
    forgetVerdicts(["lint", "e2e:changed"]);

    expect(rmSyncSpy.mock.calls).toEqual([
      ["reports/gates/lint.json", { force: true }],
      ["reports/gates/e2e-changed.json", { force: true }],
    ]);
  });
});

describe("verdictsOnDisk()", () => {
  it("should read the battery's gates in the battery's order, leaving out one with no verdict yet", () => {
    filesOnDisk({
      "reports/gates/typecheck.json": JSON.stringify({ gate: "typecheck" }),
      "reports/gates/lint.json": JSON.stringify({ gate: "lint" }),
      "reports/gates/e2e.json": JSON.stringify({ gate: "e2e" }),
    });

    expect(verdictsOnDisk("check:quick")).toEqual([{ gate: "lint" }, { gate: "typecheck" }]);
  });

  it("should leave out a verdict file that is not JSON, rather than throw inside a battery", () => {
    filesOnDisk({ "reports/gates/lint.json": "{ cut off" });

    expect(verdictsOnDisk("check:quick")).toEqual([]);
  });
});

describe("batteryOnDisk()", () => {
  it("should take the battery the walker wrote down", () => {
    filesOnDisk({ "reports/gates/battery.txt": "check:release\n" });

    expect(batteryOnDisk()).toBe("check:release");
  });

  it("should say null when no walker wrote one, or the name is no battery", () => {
    expect(batteryOnDisk()).toBeNull();

    filesOnDisk({ "reports/gates/battery.txt": "nonsense\n" });

    expect(batteryOnDisk()).toBeNull();
  });
});

describe("rewriteParagraph()", () => {
  it("should rebuild the paragraph from the battery's verdicts on disk, under the battery on disk", () => {
    filesOnDisk({
      "reports/gates/battery.txt": "check:push\n",
      "reports/gates/lint.json": JSON.stringify(THE_VERDICT),
    });

    rewriteParagraph();

    expect(gatesParagraphSpy).toHaveBeenCalledWith([THE_VERDICT], "check:push");
    expect(writeFileSyncSpy).toHaveBeenCalledWith("reports/gates/gates-paragraph.txt", "Gates: a paragraph.\n");
  });

  it("should write no paragraph at all when no battery is on disk, rather than invent one", () => {
    filesOnDisk({ "reports/gates/lint.json": JSON.stringify(THE_VERDICT) });

    rewriteParagraph();

    expect(gatesParagraphSpy).not.toHaveBeenCalled();
    expect(writeFileSyncSpy).not.toHaveBeenCalled();
  });
});

describe("runGate()", () => {
  it("should forget the gate's previous outputs before it runs, so a stale report is never read", async () => {
    await runAndClose(PASSED);

    expect(rmSyncSpy).toHaveBeenCalledWith("reports/tests/results.json", { force: true });
    expect(rmSyncSpy.mock.invocationCallOrder[FIRST] ?? 0).toBeLessThan(
      spawnSpy.mock.invocationCallOrder[FIRST] ?? 0
    );
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

  it("should open the gates folder before the gate runs", async () => {
    await runAndClose(PASSED);

    expect(mkdirSyncSpy).toHaveBeenCalledWith("reports/gates", { recursive: true });
  });

  it("should read the numbers for the gate's scope once it has closed", async () => {
    await runAndClose(PASSED, "v1.20.0");

    expect(scopeOfSpy).toHaveBeenCalledWith("lint", "v1.20.0", []);
    expect(numbersForSpy).toHaveBeenCalledWith("lint", A_SCOPE, readOrNull);
  });

  it("should build the verdict from the exit code, the clock and the output split into lines", async () => {
    const verdict = await runAndClose(RED);

    expect(verdict).toBe(THE_VERDICT);
    expect(verdictOfSpy).toHaveBeenCalledWith(
      "lint",
      false,
      RED,
      expect.any(Date),
      expect.any(Date),
      THE_NUMBERS,
      ["$ node node_modules/eslint/bin/eslint.js --quiet src", "first line", "second line", ""]
    );
  });

  it("should read a gate killed by a signal, which has no code, as failed", async () => {
    await runAndClose(null);

    expect(verdictOfSpy.mock.calls[FIRST]?.[THIRD]).toBe(FAILED);
  });

  it("should settle red when the gate could not even be started, with the reason in the log", async () => {
    const pending = runGate("lint", undefined, [LINT_STEP]);

    child.fail(new Error("spawn ENOENT"));

    await pending;

    expect(verdictOfSpy.mock.calls[FIRST]?.[THIRD]).toBe(FAILED);
    expect(logWriteSpy.mock.calls[SECOND]?.[FIRST]).toContain(
      "could not run node node_modules/eslint/bin/eslint.js --quiet src: Error: spawn ENOENT"
    );
  });

  it("should settle once when a failed start is followed by a close, as node does", async () => {
    const pending = runGate("lint", undefined, [LINT_STEP]);

    child.fail(new Error("spawn ENOENT"));
    child.close(null);

    await pending;

    expect(verdictOfSpy).toHaveBeenCalledTimes(ONCE);
    expect(logEndSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should leave the verdict beside the log, then rebuild the paragraph for the battery on disk", async () => {
    filesOnDisk({
      "reports/gates/battery.txt": "check:quick\n",
      "reports/gates/lint.json": JSON.stringify(THE_VERDICT),
    });

    await runAndClose(PASSED);

    expect(writeFileSyncSpy).toHaveBeenCalledWith("reports/gates/lint.json", JSON.stringify(THE_VERDICT, null, 2));
    expect(writeFileSyncSpy).toHaveBeenLastCalledWith("reports/gates/gates-paragraph.txt", "Gates: a paragraph.\n");
    expect(gatesParagraphSpy).toHaveBeenCalledWith([THE_VERDICT], "check:quick");
  });
});

describe("runGate(), a gate of two steps", () => {
  it("should run the second step only after the first passed, each under its own line in one log", async () => {
    const pending = runGate("e2e:typecheck", undefined, TWO_STEPS);

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
    const pending = runGate("e2e:typecheck", undefined, TWO_STEPS);

    child.close(RED);
    await pending;

    expect(spawnSpy).toHaveBeenCalledTimes(ONCE);
    expect(verdictOfSpy.mock.calls[FIRST]?.[THIRD]).toBe(RED);
  });
});

describe("main()", () => {
  const say = vi.fn();

  it("should refuse a name that is no gate, without running anything", async () => {
    const status = await main(["node", "gate-runner.ts", "nonsense"], {}, say, "D:/Temp/FoolProof");

    expect(status).toBe(FAILED);
    expect(say.mock.calls[FIRST]?.[FIRST]).toContain('"nonsense" is not a gate');
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it("should run the named gate with the baseline from the environment, say its line and pass its exit code on", async () => {
    verdictOfSpy.mockReturnValue({ ...THE_VERDICT, exitCode: RED });
    const pending = main(["node", "gate-runner.ts", "lint"], { MUTATE_AGAINST: "v1.20.0" }, say, "D:/Temp/FoolProof");

    child.close(RED);

    expect(await pending).toBe(RED);
    expect(spawnSpy.mock.calls[FIRST]?.[THIRD]).toMatchObject({ env: { MUTATE_AGAINST: "v1.20.0" } });
    expect(spawnSpy.mock.calls[FIRST]?.[SECOND]).toEqual([
      "node_modules/eslint/bin/eslint.js",
      "--config",
      "scripts/gates/config/eslint.config.js",
      "--quiet",
      "src",
      "scripts",
      "e2e",
    ]);
    expect(say).toHaveBeenCalledWith("a line");
  });

  it("should refuse files for a gate that takes none before anything runs or is written", async () => {
    const status = await main(["node", "gate-runner.ts", "lint", "src/a.ts"], {}, say, "D:/Temp/FoolProof");

    expect(status).toBe(FAILED);
    expect(say.mock.calls.at(-1)?.[FIRST]).toContain("lint takes no files");
    expect(spawnSpy).not.toHaveBeenCalled();
    expect(writeFileSyncSpy).not.toHaveBeenCalled();
  });
});

const ROOT = "D:/Temp/FoolProof";

describe("runGate(), with arguments", () => {
  const runNamed = async () => {
    verdictOfSpy.mockReturnValue({ ...THE_VERDICT, gate: "test" });
    const pending = runGate(
      "test",
      undefined,
      [{ bin: TEST_STEP.bin, args: [...TEST_STEP.args, "src/a.spec.ts", "src/b.spec.ts"] }],
      ["src/a.spec.ts", "src/b.spec.ts"]
    );

    child.close(PASSED);

    return pending;
  };

  it("should run the steps it was handed, files included", async () => {
    await runNamed();

    expect(spawnSpy.mock.calls[FIRST]?.[SECOND]).toEqual([TEST_STEP.bin, "run", "src/a.spec.ts", "src/b.spec.ts"]);
  });

  it("should write a named log and verdict, leaving the bare gate's files alone", async () => {
    await runNamed();

    expect(writeFileSyncSpy).toHaveBeenCalledWith("reports/gates/test.named.json", expect.any(String));
    expect(writeFileSyncSpy).not.toHaveBeenCalledWith("reports/gates/test.json", expect.any(String));
  });

  it("should never rebuild the paragraph after a named run, whatever battery is on disk", async () => {
    filesOnDisk({ "reports/gates/battery.txt": "check:phase\n" });

    await runNamed();

    expect(gatesParagraphSpy).not.toHaveBeenCalled();
    expect(writeFileSyncSpy).not.toHaveBeenCalledWith("reports/gates/gates-paragraph.txt", expect.any(String));
  });

  it("should read the scope with the arguments, so a named mutation says so", async () => {
    const pending = runGate("test:mutation:changed", "v1.20.0", [TEST_STEP], ["scripts/a.ts"]);

    child.close(PASSED);
    await pending;

    expect(scopeOfSpy).toHaveBeenCalledWith("test:mutation:changed", "v1.20.0", ["scripts/a.ts"]);
  });
});

describe("main(), the reasons under a red line", () => {
  const say = vi.fn();

  it("should take the gate from the first argument and pass the rest on", async () => {
    const pending = main(["node", "gate-runner.ts", "test", "src/a.spec.ts"], {}, say, ROOT);

    child.close(PASSED);
    await pending;

    expect(spawnSpy.mock.calls[FIRST]?.[SECOND]).toEqual([
      "node_modules/vitest/vitest.mjs",
      "run",
      "--config",
      "scripts/gates/config/vitest.config.ts",
      "src/a.spec.ts",
    ]);
  });

  it("should print the reasons the summary gives for a red verdict, after its line", async () => {
    verdictOfSpy.mockReturnValue({ ...THE_VERDICT, ok: false, exitCode: RED });
    reasonLinesSpy.mockReturnValue(["  ✗ a failure"]);
    const pending = main(["node", "gate-runner.ts", "lint"], {}, say, ROOT);

    child.close(RED);
    await pending;

    expect(reasonLinesSpy).toHaveBeenCalledWith({ ...THE_VERDICT, ok: false, exitCode: RED }, ROOT);
    expect(say.mock.calls.map((call) => call[FIRST])).toEqual(["a line", "  ✗ a failure"]);
  });
});

describe("runGate(), what the verdict is told about naming", () => {
  it("should mark a run with arguments as named and a bare one as not", async () => {
    await runAndClose(PASSED);

    expect(verdictOfSpy.mock.calls[FIRST]?.[SECOND]).toBe(false);

    const pending = runGate("test", undefined, [TEST_STEP], ["src/a.spec.ts"]);

    child.close(PASSED);
    await pending;

    expect(verdictOfSpy.mock.calls[SECOND]?.[SECOND]).toBe(true);
  });
});
