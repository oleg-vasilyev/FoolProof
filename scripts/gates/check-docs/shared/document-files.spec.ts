import { beforeEach, describe, expect, it, vi } from "vitest";


const existsSyncSpy = vi.fn();

vi.mock("node:fs", () => ({
  existsSync: (path: string) => existsSyncSpy(path),
  readdirSync: () => [],
  readFileSync: () => "",
}));

const load = async () => {
  vi.resetModules();

  return import("./document-files.ts");
};

beforeEach(() => {
  vi.clearAllMocks();
  existsSyncSpy.mockReturnValue(true);
});

describe("DOCUMENTS", () => {
  it("should hold the benchmark README only while the benchmark folder is there", async () => {
    expect((await load()).DOCUMENTS).toContain("benchmark/README.md");

    existsSyncSpy.mockReturnValue(false);

    expect((await load()).DOCUMENTS).not.toContain("benchmark/README.md");
  });

  it("should never drop a root document, present or not", async () => {
    existsSyncSpy.mockReturnValue(false);

    expect((await load()).DOCUMENTS).toEqual([
      "README.md",
      "PLAN.md",
      "CLAUDE.md",
      "TECH-DEBT.md",
      "e2e/README.md",
      "deploy/README.md",
    ]);
  });
});

describe("insideAStrippedFolder()", () => {
  it("should say yes for a path under a stripped folder only while that folder is absent", async () => {
    const { insideAStrippedFolder } = await load();

    expect(insideAStrippedFolder("scripts/benchmark/run-benchmark.ts")).toBe(false);

    existsSyncSpy.mockImplementation((path: string) => path !== "scripts/benchmark");

    expect(insideAStrippedFolder("scripts/benchmark/run-benchmark.ts")).toBe(true);
    expect(insideAStrippedFolder("scripts/benchmark")).toBe(true);
    expect(insideAStrippedFolder("benchmark/README.md")).toBe(false);
  });

  it("should not mistake a sibling with the same prefix for the folder", async () => {
    existsSyncSpy.mockReturnValue(false);
    const { insideAStrippedFolder } = await load();

    expect(insideAStrippedFolder("benchmarks/x.md")).toBe(false);
    expect(insideAStrippedFolder("scripts/benchmarking.ts")).toBe(false);
  });
});
