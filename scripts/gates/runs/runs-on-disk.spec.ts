import { beforeEach, describe, expect, it, vi } from "vitest";
import { BATTERY, GATE } from "../shared/gate-names.ts";
import type { GateVerdict } from "../verdict/gate-verdict.ts";


const readFileSyncSpy = vi.fn();

const readdirSyncSpy = vi.fn();

const rmSyncSpy = vi.fn();

const writeFileSyncSpy = vi.fn();

const gatesParagraphSpy = vi.fn();

const paragraphFileOfSpy = vi.fn();

const stampLineOfSpy = vi.fn();

const leftoverRunsSpy = vi.fn();

const isAliveSpy = vi.fn();

vi.mock("node:fs", () => ({
  readFileSync: (...args: readonly unknown[]) => readFileSyncSpy(...args),
  readdirSync: (...args: readonly unknown[]) => readdirSyncSpy(...args),
  rmSync: (...args: readonly unknown[]) => rmSyncSpy(...args),
  writeFileSync: (...args: readonly unknown[]) => writeFileSyncSpy(...args),
}));

vi.mock("../verdict/gate-summary.ts", () => ({
  gatesParagraph: (verdicts: unknown, battery: unknown) => gatesParagraphSpy(verdicts, battery),
  paragraphFileOf: (...args: readonly unknown[]) => paragraphFileOfSpy(...args),
  stampLineOf: (text: unknown) => stampLineOfSpy(text),
}));

vi.mock("./run-folders.ts", () => ({
  leftoverRuns: (...args: readonly unknown[]) => leftoverRunsSpy(...args),
}));

vi.mock("./run-lock.ts", () => ({
  isAlive: isAliveSpy,
}));

const {
  batteryOnDisk,
  newestBareVerdict,
  readOrNull,
  rewriteParagraph,
  tidyRunsOf,
  verdictsOnDisk,
  writeVerdict,
} = await import("./runs-on-disk.ts");


const PASSED = 0;

const FIRST = 0;

const JSON_INDENT = 2;

const A_RUN = "2026-09-25T10-00-00.000Z-p4821";

const LINT_FOLDER = `reports/runs/lint/${A_RUN}`;

const THE_VERDICT = {
  kind: "ran",
  gate: GATE.lint,
  named: false,
  folder: LINT_FOLDER,
  ok: true,
  exitCode: PASSED,
} as unknown as GateVerdict;

const BATTERY_START = "2026-09-25T09:00:00.000Z";

const BEFORE_THE_BATTERY = "2026-09-25T08:59:59.999Z";

const AFTER_THE_BATTERY = "2026-09-25T09:30:00.000Z";

const filesOnDisk = (files: Record<string, string>): void => {
  readFileSyncSpy.mockImplementation((path: string) => {
    const text = files[path];

    if (text === undefined) {
      throw new Error("ENOENT");
    }

    return text;
  });
};

const foldersOnDisk = (folders: Record<string, readonly string[]>): void => {
  readdirSyncSpy.mockImplementation((path: string) => {
    const entries = folders[path];

    if (entries === undefined) {
      throw new Error("ENOENT");
    }

    return entries;
  });
};

const bareVerdict = (startedAt: string) => JSON.stringify({ kind: "ran", named: false, startedAt });

beforeEach(() => {
  vi.clearAllMocks();

  gatesParagraphSpy.mockReturnValue("Gates: a paragraph.");
  leftoverRunsSpy.mockReturnValue([]);
  filesOnDisk({});
  foldersOnDisk({});
});

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

describe("writeVerdict()", () => {
  it("should write a verdict into its own run's folder, as JSON a reader can open", () => {
    writeVerdict(THE_VERDICT as Parameters<typeof writeVerdict>[0]);

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      `${LINT_FOLDER}/verdict.json`,
      JSON.stringify(THE_VERDICT, null, JSON_INDENT)
    );
  });
});

describe("newestBareVerdict()", () => {
  it("should take the newest run by name that is bare and started no earlier than asked, passing over a named one", () => {
    foldersOnDisk({ "reports/runs/lint": ["2026-b", "2026-c", "2026-a"] });
    filesOnDisk({
      "reports/runs/lint/2026-c/verdict.json": JSON.stringify({ kind: "ran", named: true, startedAt: AFTER_THE_BATTERY }),
      "reports/runs/lint/2026-b/verdict.json": bareVerdict(BATTERY_START),
      "reports/runs/lint/2026-a/verdict.json": bareVerdict(AFTER_THE_BATTERY),
    });

    expect(newestBareVerdict(GATE.lint, BATTERY_START)).toEqual({ kind: "ran", named: false, startedAt: BATTERY_START });
  });

  it("should count a skipped verdict as bare, since only a battery skips", () => {
    foldersOnDisk({ "reports/runs/test-mutation-changed": ["2026-a"] });
    filesOnDisk({
      "reports/runs/test-mutation-changed/2026-a/verdict.json": JSON.stringify({ kind: "skipped", startedAt: AFTER_THE_BATTERY }),
    });

    expect(newestBareVerdict(GATE.mutationChanged, BATTERY_START)).toEqual({ kind: "skipped", startedAt: AFTER_THE_BATTERY });
  });

  it("should say null when every bare run started before the battery, so an old green never reaches the paragraph", () => {
    foldersOnDisk({ "reports/runs/lint": ["2026-a"] });
    filesOnDisk({ "reports/runs/lint/2026-a/verdict.json": bareVerdict(BEFORE_THE_BATTERY) });

    expect(newestBareVerdict(GATE.lint, BATTERY_START)).toBeNull();
  });

  it("should pass over a run still going, which has no verdict yet, and a gate never run at all", () => {
    foldersOnDisk({ "reports/runs/lint": ["2026-b", "2026-a"] });
    filesOnDisk({ "reports/runs/lint/2026-a/verdict.json": bareVerdict(AFTER_THE_BATTERY) });

    expect(newestBareVerdict(GATE.lint, BATTERY_START)).toEqual(expect.objectContaining({ startedAt: AFTER_THE_BATTERY }));
    expect(newestBareVerdict(GATE.typecheck, BATTERY_START)).toBeNull();
  });
});

describe("batteryOnDisk() and verdictsOnDisk()", () => {
  it("should take the battery and its start the walker wrote down", () => {
    filesOnDisk({ "reports/gates/battery.json": JSON.stringify({ battery: BATTERY.release, startedAt: BATTERY_START }) });

    expect(batteryOnDisk()).toEqual({ battery: BATTERY.release, startedAt: BATTERY_START });
  });

  it("should say null when no walker wrote one, the name is no battery, or the start is missing", () => {
    expect(batteryOnDisk()).toBeNull();

    filesOnDisk({ "reports/gates/battery.json": JSON.stringify({ battery: "nonsense", startedAt: BATTERY_START }) });

    expect(batteryOnDisk()).toBeNull();

    filesOnDisk({ "reports/gates/battery.json": JSON.stringify({ battery: BATTERY.quick }) });

    expect(batteryOnDisk()).toBeNull();

    filesOnDisk({ "reports/gates/battery.json": "{ cut off" });

    expect(batteryOnDisk()).toBeNull();
  });

  it("should read the battery's gates in the battery's order, leaving out one with no run since it started", () => {
    foldersOnDisk({ "reports/runs/typecheck": ["t"], "reports/runs/lint": ["l"], "reports/runs/e2e": ["e"] });
    filesOnDisk({
      "reports/runs/typecheck/t/verdict.json": bareVerdict(AFTER_THE_BATTERY),
      "reports/runs/lint/l/verdict.json": bareVerdict(AFTER_THE_BATTERY),
      "reports/runs/e2e/e/verdict.json": bareVerdict(AFTER_THE_BATTERY),
    });

    const verdicts = verdictsOnDisk({ battery: BATTERY.quick, startedAt: BATTERY_START });

    expect(verdicts).toEqual([
      expect.objectContaining({ startedAt: AFTER_THE_BATTERY }),
      expect.objectContaining({ startedAt: AFTER_THE_BATTERY }),
    ]);
    expect(readFileSyncSpy.mock.calls.map((call) => call[FIRST])).toEqual([
      "reports/runs/lint/l/verdict.json",
      "reports/runs/typecheck/t/verdict.json",
    ]);
  });

  it("should leave out a verdict file that is not JSON, rather than throw inside a battery", () => {
    foldersOnDisk({ "reports/runs/lint": ["l"] });
    filesOnDisk({ "reports/runs/lint/l/verdict.json": "{ cut off" });

    expect(verdictsOnDisk({ battery: BATTERY.quick, startedAt: BATTERY_START })).toEqual([]);
  });
});

describe("rewriteParagraph()", () => {
  const THE_VERDICT_SINCE = { ...THE_VERDICT, startedAt: AFTER_THE_BATTERY };

  const aBatteryWithLint = (paragraphFile?: string): void => {
    foldersOnDisk({ "reports/runs/lint": ["l"] });
    filesOnDisk({
      "reports/gates/battery.json": JSON.stringify({ battery: BATTERY.push, startedAt: BATTERY_START }),
      "reports/runs/lint/l/verdict.json": JSON.stringify(THE_VERDICT_SINCE),
      ...(paragraphFile === undefined ? {} : { "reports/gates/gates-paragraph.txt": paragraphFile }),
    });
  };

  it("should rebuild the paragraph from the battery's verdicts on disk, under the stamp the battery left", () => {
    aBatteryWithLint("the old file");
    stampLineOfSpy.mockReturnValue("check:push · abc1234 · 2026-09-11T12:00:00.000Z");

    rewriteParagraph();

    expect(gatesParagraphSpy).toHaveBeenCalledWith([THE_VERDICT_SINCE], BATTERY.push);
    expect(stampLineOfSpy).toHaveBeenCalledWith("the old file");
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      "reports/gates/gates-paragraph.txt",
      "check:push · abc1234 · 2026-09-11T12:00:00.000Z\nGates: a paragraph.\n"
    );
  });

  it("should stamp the paragraph with an unknown HEAD when the file on disk carried no stamp", () => {
    aBatteryWithLint();
    stampLineOfSpy.mockReturnValue(null);
    paragraphFileOfSpy.mockReturnValue("a stamped file");

    rewriteParagraph();

    expect(stampLineOfSpy).toHaveBeenCalledWith(null);
    expect(paragraphFileOfSpy).toHaveBeenCalledWith(BATTERY.push, null, expect.any(Date), "Gates: a paragraph.");
    expect(writeFileSyncSpy).toHaveBeenCalledWith("reports/gates/gates-paragraph.txt", "a stamped file");
  });

  it("should write no paragraph at all when no battery is on disk, rather than invent one", () => {
    foldersOnDisk({ "reports/runs/lint": ["l"] });
    filesOnDisk({ "reports/runs/lint/l/verdict.json": JSON.stringify(THE_VERDICT_SINCE) });

    rewriteParagraph();

    expect(gatesParagraphSpy).not.toHaveBeenCalled();
    expect(writeFileSyncSpy).not.toHaveBeenCalled();
  });
});

describe("tidyRunsOf()", () => {
  const NOW = new Date(AFTER_THE_BATTERY);

  it("should hand the pruning rule every run of the gate, finished or not, named or not, with the clock and the liveness check", () => {
    foldersOnDisk({ "reports/runs/test": ["done", "named", "going"] });
    filesOnDisk({
      "reports/runs/test/done/verdict.json": JSON.stringify({ kind: "ran", named: false }),
      "reports/runs/test/named/verdict.json": JSON.stringify({ kind: "ran", named: true }),
    });

    tidyRunsOf(GATE.test, NOW);

    expect(leftoverRunsSpy).toHaveBeenCalledWith(
      [
        { id: "done", finished: { named: false } },
        { id: "named", finished: { named: true } },
        { id: "going", finished: null },
      ],
      NOW,
      isAliveSpy
    );
  });

  it("should remove exactly the leftovers the rule names, folder and all", () => {
    foldersOnDisk({ "reports/runs/test": ["old", "new"] });
    leftoverRunsSpy.mockReturnValue(["old"]);

    tidyRunsOf(GATE.test, NOW);

    expect(rmSyncSpy.mock.calls).toEqual([["reports/runs/test/old", { recursive: true, force: true }]]);
  });

  it("should find nothing to prune for a gate never run, rather than throw", () => {
    tidyRunsOf(GATE.lint, NOW);

    expect(leftoverRunsSpy).toHaveBeenCalledWith([], NOW, isAliveSpy);
    expect(rmSyncSpy).not.toHaveBeenCalled();
  });
});
