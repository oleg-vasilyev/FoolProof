import { beforeEach, describe, expect, it, vi } from "vitest";


const readSpy = vi.fn();

const packageScriptsSpy = vi.fn();

const backtickedWordsOfSpy = vi.fn();

vi.mock("../shared/markdown-text.ts", () => ({
  backtickedWordsOf: (text: string) => backtickedWordsOfSpy(text),
}));

vi.mock("../shared/document-files.ts", () => ({
  TREE_DOCUMENT: "README.md",
  read: (file: string) => readSpy(file),
}));

vi.mock("../shared/source-files.ts", () => ({
  packageScripts: () => packageScriptsSpy(),
}));

const { scriptTableComplaints, scriptsMissingFromTheTable } = await import("./script-table.ts");


const FIRST = 0;

const ONE_COMPLAINT = 1;

const README = "README.md";

describe("scriptTableComplaints", () => {
  it("should say nothing when every script is documented", () => {
    expect(scriptTableComplaints(new Set(["build", "test"]), new Set(["build", "test"]))).toEqual([]);
  });

  it("should name a script that is not documented, and say where it belongs", () => {
    const complaints = scriptTableComplaints(new Set(["build"]), new Set(["build", "check:quick"]));

    expect(complaints).toEqual([`${README}: does not list the "check:quick" script`]);
  });

  it("should say nothing about a documented word that names no actual script", () => {
    expect(
      scriptTableComplaints(new Set(["build", "check:quick", "ghost"]), new Set(["build"]))
    ).toEqual([]);
  });
});

describe("scriptsMissingFromTheTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readSpy.mockReturnValue("");
    packageScriptsSpy.mockReturnValue(new Set());
    backtickedWordsOfSpy.mockReturnValue(new Set());
  });

  it("should compare the scripts against what the tree document quotes in backticks", () => {
    backtickedWordsOfSpy.mockReturnValue(new Set(["check"]));
    packageScriptsSpy.mockReturnValue(new Set(["check", "lint"]));
    readSpy.mockReturnValue("the README text");

    const said = scriptsMissingFromTheTable();

    expect(backtickedWordsOfSpy).toHaveBeenCalledWith("the README text");
    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('does not list the "lint" script');
  });
});
