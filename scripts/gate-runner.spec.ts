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
  spawn: (command: unknown, options: unknown) => spawnSpy(command, options),
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
  scopeOf: (gate: unknown, against: unknown) => scopeOfSpy(gate, against),
}));

vi.mock("./gate-verdict.ts", () => ({
  FAILED: 1,
  verdictOf: (...args: readonly unknown[]) => verdictOfSpy(...args),
  lineFor: () => "a line",
}));

vi.mock("./gate-summary.ts", () => ({
  gatesParagraph: (verdicts: unknown, battery: unknown) => gatesParagraphSpy(verdicts, battery),
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

const THE_NUMBERS = { kind: "none" } as const;

const THE_VERDICT = { kind: "ran", gate: "lint", ok: true, exitCode: PASSED } as unknown as GateVerdict;

const A_SCOPE = "since v1.20.0";

const AN_ENV = { PATH: "/bin", HOME: "/home" };

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
  filesOnDisk({});
});

const runAndClose = async (code: number | null, against?: string) => {
  const pending = runGate("lint", against);

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

    expect(verdictsOnDisk("check")).toEqual([{ gate: "lint" }, { gate: "typecheck" }]);
  });

  it("should leave out a verdict file that is not JSON, rather than throw inside a battery", () => {
    filesOnDisk({ "reports/gates/lint.json": "{ cut off" });

    expect(verdictsOnDisk("check")).toEqual([]);
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

  it("should run the gate's npm script through a shell with both streams piped, in the child environment", async () => {
    await runAndClose(PASSED, "v1.20.0");

    expect(spawnSpy).toHaveBeenCalledWith("npm run lint", {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: childEnvironment(process.env, "v1.20.0"),
    });
  });

  it("should read both streams as text, so a multibyte character split across chunks survives", async () => {
    await runAndClose(PASSED);

    expect(child.stdout.setEncoding).toHaveBeenCalledWith("utf8");
    expect(child.stderr.setEncoding).toHaveBeenCalledWith("utf8");
  });

  it("should stream every chunk of either stream into the log as it arrives", async () => {
    await runAndClose(PASSED);

    expect(logWriteSpy.mock.calls.map((call) => call[FIRST])).toEqual(["first line\nsecond", " line\n"]);
    expect(logEndSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should open the gates folder before the gate runs", async () => {
    await runAndClose(PASSED);

    expect(mkdirSyncSpy).toHaveBeenCalledWith("reports/gates", { recursive: true });
  });

  it("should read the numbers for the gate's scope once it has closed", async () => {
    await runAndClose(PASSED, "v1.20.0");

    expect(scopeOfSpy).toHaveBeenCalledWith("lint", "v1.20.0");
    expect(numbersForSpy).toHaveBeenCalledWith("lint", A_SCOPE, readOrNull);
  });

  it("should build the verdict from the exit code, the clock and the output split into lines", async () => {
    const verdict = await runAndClose(RED);

    expect(verdict).toBe(THE_VERDICT);
    expect(verdictOfSpy).toHaveBeenCalledWith(
      "lint",
      RED,
      expect.any(Date),
      expect.any(Date),
      THE_NUMBERS,
      ["first line", "second line", ""]
    );
  });

  it("should read a gate killed by a signal, which has no code, as failed", async () => {
    await runAndClose(null);

    expect(verdictOfSpy.mock.calls[FIRST]?.[SECOND]).toBe(FAILED);
  });

  it("should settle red when the gate could not even be started, with the reason in the log", async () => {
    const pending = runGate("lint", undefined);

    child.fail(new Error("spawn ENOENT"));

    await pending;

    expect(verdictOfSpy.mock.calls[FIRST]?.[SECOND]).toBe(FAILED);
    expect(logWriteSpy.mock.calls[FIRST]?.[FIRST]).toContain("could not run npm run lint: Error: spawn ENOENT");
  });

  it("should settle once when a failed start is followed by a close, as node does", async () => {
    const pending = runGate("lint", undefined);

    child.fail(new Error("spawn ENOENT"));
    child.close(null);

    await pending;

    expect(verdictOfSpy).toHaveBeenCalledTimes(ONCE);
    expect(logEndSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should leave the verdict beside the log, then rebuild the paragraph for the battery on disk", async () => {
    filesOnDisk({
      "reports/gates/battery.txt": "check\n",
      "reports/gates/lint.json": JSON.stringify(THE_VERDICT),
    });

    await runAndClose(PASSED);

    expect(writeFileSyncSpy).toHaveBeenCalledWith("reports/gates/lint.json", JSON.stringify(THE_VERDICT, null, 2));
    expect(writeFileSyncSpy).toHaveBeenLastCalledWith("reports/gates/gates-paragraph.txt", "Gates: a paragraph.\n");
    expect(gatesParagraphSpy).toHaveBeenCalledWith([THE_VERDICT], "check");
  });
});

describe("main()", () => {
  const say = vi.fn();

  it("should refuse a name that is no gate, without running anything", async () => {
    const status = await main(["node", "gate-runner.ts", "nonsense"], {}, say);

    expect(status).toBe(FAILED);
    expect(say.mock.calls[FIRST]?.[FIRST]).toContain('"nonsense" is not a gate');
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it("should run the named gate with the baseline from the environment, say its line and pass its exit code on", async () => {
    verdictOfSpy.mockReturnValue({ ...THE_VERDICT, exitCode: RED });
    const pending = main(["node", "gate-runner.ts", "lint"], { MUTATE_AGAINST: "v1.20.0" }, say);

    child.close(RED);

    expect(await pending).toBe(RED);
    expect(spawnSpy.mock.calls[FIRST]?.[SECOND]).toMatchObject({ env: { MUTATE_AGAINST: "v1.20.0" } });
    expect(say).toHaveBeenCalledWith("a line");
  });
});
