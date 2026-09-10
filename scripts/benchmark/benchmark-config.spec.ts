import { beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";


const existsSyncSpy = vi.fn();

const readFileSyncSpy = vi.fn();

const writeFileSyncSpy = vi.fn();

const rmSyncSpy = vi.fn();

const mkdirSyncSpy = vi.fn();

vi.mock("node:fs", () => ({
  existsSync: (path: unknown) => existsSyncSpy(path),
  readFileSync: (path: unknown, encoding: unknown) => readFileSyncSpy(path, encoding),
  writeFileSync: (path: unknown, text: unknown, encoding: unknown) => writeFileSyncSpy(path, text, encoding),
  rmSync: (path: unknown, options: unknown) => rmSyncSpy(path, options),
  mkdirSync: (path: unknown, options: unknown) => mkdirSyncSpy(path, options),
}));

const { BENCHMARK_CONFIG, BENCHMARK_DIR, RUNS_DIR, RUNS_LOG, TASKS_DIR, benchmarkConfigOf, mustRead, realFiles } =
  await import("./benchmark-config.ts");

const ROOT = "D:/somewhere";

const A_FILE = "D:/somewhere/thing.txt";

const TURNS = 7;

const files = {
  read: vi.fn((file: string): string | null =>
    file === join(ROOT, BENCHMARK_CONFIG) ? JSON.stringify({ checkupModel: "opus", maxTurns: TURNS }) : null
  ),
  write: vi.fn(),
  remove: vi.fn(),
  mkdir: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  existsSyncSpy.mockReturnValue(true);
  readFileSyncSpy.mockReturnValue("text");
});

describe("the folder", () => {
  it("should keep everything under benchmark/ at the repository root", () => {
    expect(BENCHMARK_DIR).toBe("benchmark");
    expect(BENCHMARK_CONFIG).toBe("benchmark/benchmark.json");
    expect(TASKS_DIR).toBe("benchmark/tasks");
    expect(RUNS_DIR).toBe("benchmark/runs");
    expect(RUNS_LOG).toBe("benchmark/RUNS.md");
  });
});

describe("benchmarkConfigOf()", () => {
  it("should read the pinned model and the caps from benchmark/benchmark.json", () => {
    expect(benchmarkConfigOf(ROOT, files)).toEqual({ checkupModel: "opus", maxTurns: TURNS });
  });

  it("should refuse a repository without a config", () => {
    expect(() => benchmarkConfigOf("D:/elsewhere", files)).toThrow("benchmark.json is missing");
  });
});

describe("mustRead()", () => {
  it("should hand back the text when the file is there", () => {
    expect(mustRead({ ...files, read: () => "here" }, A_FILE)).toBe("here");
  });

  it("should name the missing file when it is not", () => {
    expect(() => mustRead(files, A_FILE)).toThrow(`${A_FILE} is missing`);
  });
});

describe("realFiles", () => {
  it("should read a file that exists as UTF-8", () => {
    expect(realFiles.read(A_FILE)).toBe("text");
    expect(readFileSyncSpy).toHaveBeenCalledWith(A_FILE, "utf8");
  });

  it("should answer null for a file that does not exist, without reading it", () => {
    existsSyncSpy.mockReturnValue(false);

    expect(realFiles.read(A_FILE)).toBeNull();
    expect(readFileSyncSpy).not.toHaveBeenCalled();
  });

  it("should write UTF-8", () => {
    realFiles.write(A_FILE, "out");

    expect(writeFileSyncSpy).toHaveBeenCalledWith(A_FILE, "out", "utf8");
  });

  it("should remove a path recursively and quietly when it is already gone", () => {
    realFiles.remove(A_FILE);

    expect(rmSyncSpy).toHaveBeenCalledWith(A_FILE, { recursive: true, force: true });
  });

  it("should make folders along the way", () => {
    realFiles.mkdir(A_FILE);

    expect(mkdirSyncSpy).toHaveBeenCalledWith(A_FILE, { recursive: true });
  });
});
