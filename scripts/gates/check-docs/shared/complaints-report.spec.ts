import { describe, expect, it, vi } from "vitest";
import { MOST_FINDINGS } from "../../shared/finding.ts";


const mkdirSyncSpy = vi.fn();

const writeFileSyncSpy = vi.fn();

vi.mock("node:fs", () => ({
  mkdirSync: (...args: readonly unknown[]) => mkdirSyncSpy(...args),
  writeFileSync: (...args: readonly unknown[]) => writeFileSyncSpy(...args),
}));

const { complaintsIn, writeComplaints } = await import("./complaints-report.ts");


const A_COMPLAINT = 'README.md: does not list the "check:quick" script';

const ANOTHER = "CLAUDE.md: 401 lines, over its 380 budget";

const ONE_MORE = 1;

describe("writeComplaints()", () => {
  it("should make the folder before writing, since the first run of a clone has none", () => {
    writeComplaints("reports/check-docs/complaints.json", [A_COMPLAINT]);

    expect(mkdirSyncSpy).toHaveBeenCalledWith("reports/check-docs", { recursive: true });
  });

  it("should write the complaints as JSON, so the runner reads a list rather than parsing a log", () => {
    writeComplaints("reports/check-docs/complaints.json", [A_COMPLAINT, ANOTHER]);

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      "reports/check-docs/complaints.json",
      JSON.stringify([A_COMPLAINT, ANOTHER], null, 2)
    );
  });

  it("should write an empty list for a green run, so a missing file means the gate never ran", () => {
    writeComplaints("reports/check-docs/complaints.json", []);

    expect(writeFileSyncSpy).toHaveBeenCalledWith("reports/check-docs/complaints.json", "[]");
  });
});

describe("complaintsIn()", () => {
  it("should read the complaints back in the order they were written", () => {
    expect(complaintsIn(JSON.stringify([A_COMPLAINT, ANOTHER]))).toEqual([A_COMPLAINT, ANOTHER]);
  });

  it("should read a green run as no complaints at all", () => {
    expect(complaintsIn("[]")).toEqual([]);
  });

  it("should keep at most as many as the other gates name, the rest staying in the file", () => {
    const many = Array.from({ length: MOST_FINDINGS + ONE_MORE }, (unused, index) => `a.md: complaint ${String(index)}`);

    expect(complaintsIn(JSON.stringify(many))).toHaveLength(MOST_FINDINGS);
  });

  it("should read a file the run left half-written as no complaints rather than throwing", () => {
    expect(complaintsIn('["a.md: one",')).toEqual([]);
  });

  it("should refuse anything that is not a list of strings, since the red line prints them raw", () => {
    expect(complaintsIn('{"complaints": []}')).toEqual([]);
    expect(complaintsIn(JSON.stringify([A_COMPLAINT, 7, null]))).toEqual([A_COMPLAINT]);
  });
});
