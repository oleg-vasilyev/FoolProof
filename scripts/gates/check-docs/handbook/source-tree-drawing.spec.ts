import { beforeEach, describe, expect, it, vi } from "vitest";


const readdirSyncSpy = vi.fn();

const readSpy = vi.fn();

const featureFoldersSpy = vi.fn();

vi.mock("node:fs", () => ({
  readdirSync: (folder: string, options: unknown) => readdirSyncSpy(folder, options),
}));

vi.mock("../shared/document-files.ts", () => ({
  SESSION_DOCUMENT: "CLAUDE.md",
  TREE_DOCUMENT: "README.md",
  read: (file: string) => readSpy(file),
}));

vi.mock("../shared/source-files.ts", () => ({
  FEATURE_FOLDERS: "src/features",
  featureFolders: () => featureFoldersSpy(),
}));

const { foldersMissingFromTheTree, treeDrawingComplaints } = await import("./source-tree-drawing.ts");


const FIRST = 0;

const ONE_COMPLAINT = 1;

const TWO_COMPLAINTS = 2;

const README = "README.md";

const CLAUDE = "CLAUDE.md";

const BOTH_DOCUMENTS = [README, CLAUDE];

const FEATURES_ROOT = "src/features";

describe("treeDrawingComplaints", () => {
  it("should say nothing when every document mentions every feature and shared folder", () => {
    const contents = {
      [README]: "features/merge-names/ and shared/config/",
      [CLAUDE]: "merge-names/ and config/ both live here",
    };

    expect(treeDrawingComplaints(BOTH_DOCUMENTS, contents, ["merge-names"], ["config"])).toEqual([]);
  });

  it("should name the feature folder in every document that never mentions it", () => {
    const contents = { [README]: "nothing about the tree here", [CLAUDE]: "still nothing" };

    const complaints = treeDrawingComplaints(BOTH_DOCUMENTS, contents, ["merge-names"], []);

    expect(complaints).toHaveLength(TWO_COMPLAINTS);
    expect(complaints[FIRST]).toBe(`${README}: does not mention ${FEATURES_ROOT}/merge-names/`);
  });

  it("should name a shared folder a document never mentions, and say why it matters", () => {
    const contents = { [README]: "merge-names/ only", [CLAUDE]: "merge-names/ only" };

    const complaints = treeDrawingComplaints([README], contents, ["merge-names"], ["config"]);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("src/shared/config/");
    expect(complaints[FIRST]).toContain("the only place a reader learns what is down there");
    expect(complaints[FIRST]).toContain("invents a second time");
  });

  it("should not mistake a feature name appearing without its trailing slash for a mention", () => {
    const contents = { [README]: "merge-names is a feature, but the folder is spelled differently" };

    const complaints = treeDrawingComplaints([README], contents, ["merge-names"], []);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
  });

  it("should treat a document with no recorded contents as blank rather than throw", () => {
    const complaints = treeDrawingComplaints(["MISSING.md"], {}, ["merge-names"], []);

    expect(complaints).toEqual(["MISSING.md: does not mention src/features/merge-names/"]);
  });
});

describe("foldersMissingFromTheTree", () => {
  const aFolder = (name: string) => ({ name, isDirectory: () => true });

  const aFile = (name: string) => ({ name, isDirectory: () => false });

  beforeEach(() => {
    vi.clearAllMocks();
    readdirSyncSpy.mockReturnValue([]);
    readSpy.mockReturnValue("");
    featureFoldersSpy.mockReturnValue([]);
  });

  it("should hold both documents that draw the tree, not only the README", () => {
    featureFoldersSpy.mockReturnValue(["scoresheet"]);
    readSpy.mockReturnValue("nothing drawn here");

    const said = foldersMissingFromTheTree();

    expect(readSpy).toHaveBeenCalledWith("README.md");
    expect(readSpy).toHaveBeenCalledWith("CLAUDE.md");
    expect(said.filter((one) => one.includes("scoresheet"))).toHaveLength(TWO_COMPLAINTS);
  });

  it("should read the shared folders off the disk rather than a list somebody typed", () => {
    readdirSyncSpy.mockReturnValue([aFolder("locale"), aFile("readme.md")]);
    readSpy.mockReturnValue("");

    const said = foldersMissingFromTheTree().join("\n");

    expect(readdirSyncSpy).toHaveBeenCalledWith("src/shared", { withFileTypes: true });
    expect(said).toContain("src/shared/locale/");
    expect(said).not.toContain("readme.md");
  });
});
