import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";


const readdirSyncSpy = vi.fn();

const readSpy = vi.fn();

const featureFoldersSpy = vi.fn();

const sourceFilesInSpy = vi.fn();

const packageScriptsSpy = vi.fn();

const backtickedWordsOfSpy = vi.fn();

vi.mock("node:fs", () => ({
  readdirSync: (folder: string, options: unknown) => readdirSyncSpy(folder, options),
}));

vi.mock("./a-markdown-document.ts", () => ({
  backtickedWordsOf: (text: string) => backtickedWordsOfSpy(text),
}));

vi.mock("./the-documents.ts", () => ({
  SESSION_DOCUMENT: "CLAUDE.md",
  TREE_DOCUMENT: "README.md",
  read: (file: string) => readSpy(file),
}));

vi.mock("./the-repository.ts", () => ({
  FEATURE_FOLDERS: "src/features",
  featureFolders: () => featureFoldersSpy(),
  sourceFilesIn: (folder: string) => sourceFilesInSpy(folder),
  packageScripts: () => packageScriptsSpy(),
}));

const {
  commandsDeclaredIn,
  crowdedLayers,
  crowdedLayersComplaints,
  foldersMissingFromTheTree,
  foldersMissingFromTheTreeComplaints,
  isAFeatureEntryPoint,
  scriptsOutOfStep,
  scriptsOutOfStepComplaints,
} = await import("./the-source-tree.ts");


const FIRST = 0;

const ONE_COMPLAINT = 1;

const TWO_COMPLAINTS = 2;

const NOTHING_DECLARED = 0;

const TWO_COMMANDS = 2;

const AT_THE_LIMIT = 9;

const OVER_THE_LIMIT = 10;

const PLENTY_OF_FILES = 50;

const README = "README.md";

const CLAUDE = "CLAUDE.md";

const BOTH_DOCUMENTS = [README, CLAUDE];

const FEATURES_ROOT = "src/features";

const layerPath = (feature: string, layer: string): string => join(FEATURES_ROOT, feature, layer);

describe("foldersMissingFromTheTreeComplaints", () => {
  it("should say nothing when every document mentions every feature and shared folder", () => {
    const contents = {
      [README]: "features/merge-names/ and shared/config/",
      [CLAUDE]: "merge-names/ and config/ both live here",
    };

    expect(
      foldersMissingFromTheTreeComplaints(BOTH_DOCUMENTS, contents, ["merge-names"], ["config"])
    ).toEqual([]);
  });

  it("should name the feature folder in every document that never mentions it", () => {
    const contents = { [README]: "nothing about the tree here", [CLAUDE]: "still nothing" };

    const complaints = foldersMissingFromTheTreeComplaints(
      BOTH_DOCUMENTS,
      contents,
      ["merge-names"],
      []
    );

    expect(complaints).toHaveLength(TWO_COMPLAINTS);
    expect(complaints[FIRST]).toBe(`${README}: does not mention ${FEATURES_ROOT}/merge-names/`);
  });

  it("should name a shared folder a document never mentions, and say why it matters", () => {
    const contents = { [README]: "merge-names/ only", [CLAUDE]: "merge-names/ only" };

    const complaints = foldersMissingFromTheTreeComplaints(
      [README],
      contents,
      ["merge-names"],
      ["config"]
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("src/shared/config/");
    expect(complaints[FIRST]).toContain("the only place a reader learns what is down there");
    expect(complaints[FIRST]).toContain("invents a second time");
  });

  it("should not mistake a feature name appearing without its trailing slash for a mention", () => {
    const contents = { [README]: "merge-names is a feature, but the folder is spelled differently" };

    const complaints = foldersMissingFromTheTreeComplaints([README], contents, ["merge-names"], []);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
  });

  it("should treat a document with no recorded contents as blank rather than throw", () => {
    const complaints = foldersMissingFromTheTreeComplaints(["MISSING.md"], {}, ["merge-names"], []);

    expect(complaints).toEqual(["MISSING.md: does not mention src/features/merge-names/"]);
  });
});

describe("scriptsOutOfStepComplaints", () => {
  it("should say nothing when every script is documented", () => {
    expect(
      scriptsOutOfStepComplaints(new Set(["build", "test"]), new Set(["build", "test"]))
    ).toEqual([]);
  });

  it("should name a script that is not documented, and say where it belongs", () => {
    const complaints = scriptsOutOfStepComplaints(
      new Set(["build"]),
      new Set(["build", "docs:check"])
    );

    expect(complaints).toEqual([`${README}: does not list the "docs:check" script`]);
  });

  it("should say nothing about a documented word that names no actual script", () => {
    expect(
      scriptsOutOfStepComplaints(new Set(["build", "docs:check", "ghost"]), new Set(["build"]))
    ).toEqual([]);
  });
});

describe("crowdedLayersComplaints", () => {
  it("should leave a single-command feature alone no matter how many files a layer holds", () => {
    const complaints = crowdedLayersComplaints(
      ["diagnostics"],
      { diagnostics: 1 },
      { diagnostics: ["render"] },
      { [layerPath("diagnostics", "render")]: PLENTY_OF_FILES }
    );

    expect(complaints).toEqual([]);
  });

  it("should say nothing right at the roomy boundary of nine files", () => {
    const complaints = crowdedLayersComplaints(
      ["live-game"],
      { "live-game": TWO_COMMANDS },
      { "live-game": ["render"] },
      { [layerPath("live-game", "render")]: AT_THE_LIMIT }
    );

    expect(complaints).toEqual([]);
  });

  it("should complain the moment a layer crosses nine files, and say why", () => {
    const complaints = crowdedLayersComplaints(
      ["live-game"],
      { "live-game": TWO_COMMANDS },
      { "live-game": ["render"] },
      { [layerPath("live-game", "render")]: OVER_THE_LIMIT }
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(layerPath("live-game", "render"));
    expect(complaints[FIRST]).toContain(`${String(OVER_THE_LIMIT)} files at one level`);
    expect(complaints[FIRST]).toContain("name the sub-features as folders rather than raising the number");
  });

  it("should treat a feature missing from the command count as declaring none, and stay quiet", () => {
    const complaints = crowdedLayersComplaints(
      ["live-game"],
      {},
      { "live-game": ["render"] },
      { [layerPath("live-game", "render")]: PLENTY_OF_FILES }
    );

    expect(complaints).toEqual([]);
  });

  it("should treat a feature missing from the layer table as having none, rather than throw", () => {
    expect(
      crowdedLayersComplaints(["live-game"], { "live-game": TWO_COMMANDS }, {}, {})
    ).toEqual([]);
  });

  it("should count a second layer on its own, so one roomy layer does not hide a crowded one", () => {
    const complaints = crowdedLayersComplaints(
      ["live-game"],
      { "live-game": TWO_COMMANDS },
      { "live-game": ["render", "bot"] },
      {
        [layerPath("live-game", "render")]: AT_THE_LIMIT,
        [layerPath("live-game", "bot")]: OVER_THE_LIMIT,
      }
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(layerPath("live-game", "bot"));
  });
});

describe("isAFeatureEntryPoint", () => {
  it("should know the file a feature declares its commands in", () => {
    expect(isAFeatureEntryPoint("scoresheet-feature.ts")).toBe(true);
  });

  it("should not take the spec beside it for the entry point", () => {
    expect(isAFeatureEntryPoint("scoresheet-feature.spec.ts")).toBe(false);
  });

  it("should not take a file that merely mentions the word", () => {
    expect(isAFeatureEntryPoint("feature-installer.ts")).toBe(false);
  });

  it("should need the hyphen, so a file called feature.ts is not one", () => {
    expect(isAFeatureEntryPoint("feature.ts")).toBe(false);
  });
});

describe("commandsDeclaredIn", () => {
  it("should count every command an entry point declares", () => {
    const source = 'commands: [{ command: "stats" }, { command: "personal" }]';

    expect(commandsDeclaredIn([source])).toBe(TWO_COMMANDS);
  });

  it("should add up what two entry points declare between them", () => {
    expect(commandsDeclaredIn(['command: "one"', 'command: "two"'])).toBe(TWO_COMMANDS);
  });

  it("should not count a mention of the word without its colon and quote", () => {
    expect(commandsDeclaredIn(["the command is a string"])).toBe(NOTHING_DECLARED);
  });

  it("should count nothing in a feature that declares nothing", () => {
    expect(commandsDeclaredIn([])).toBe(NOTHING_DECLARED);
  });
});

describe("the readers, against a repository that is not there", () => {
  const aFolder = (name: string) => ({ name, isDirectory: () => true });

  const aFile = (name: string) => ({ name, isDirectory: () => false });

  beforeEach(() => {
    vi.clearAllMocks();
    readdirSyncSpy.mockReturnValue([]);
    readSpy.mockReturnValue("");
    featureFoldersSpy.mockReturnValue([]);
    sourceFilesInSpy.mockReturnValue([]);
    packageScriptsSpy.mockReturnValue(new Set());
    backtickedWordsOfSpy.mockReturnValue(new Set());
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

  it("should compare the scripts against what the tree document quotes in backticks", () => {
    backtickedWordsOfSpy.mockReturnValue(new Set(["check"]));
    packageScriptsSpy.mockReturnValue(new Set(["check", "lint"]));
    readSpy.mockReturnValue("the README text");

    const said = scriptsOutOfStep();

    expect(backtickedWordsOfSpy).toHaveBeenCalledWith("the README text");
    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('does not list the "lint" script');
  });

  const walking = (dirents: readonly unknown[], names: readonly string[]) => {
    readdirSyncSpy.mockImplementation((_folder: string, options: unknown) =>
      options === undefined ? names : dirents
    );
  };

  it("should count a layer's files through the repository, at the folder it names", () => {
    featureFoldersSpy.mockReturnValue(["live-game"]);
    walking([aFolder("bot")], ["live-game-feature.ts"]);
    readSpy.mockReturnValue('command: "one" command: "two"');
    sourceFilesInSpy.mockReturnValue(new Array<string>(OVER_THE_LIMIT).fill("a.ts"));

    const said = crowdedLayers();

    expect(sourceFilesInSpy).toHaveBeenCalledWith(join("src/features", "live-game", "bot"));
    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("10 files at one level");
  });

  it("should say nothing about a feature that gives the player only one thing", () => {
    featureFoldersSpy.mockReturnValue(["merge-names"]);
    walking([aFolder("bot")], ["merge-names-feature.ts"]);
    readSpy.mockReturnValue('command: "one"');
    sourceFilesInSpy.mockReturnValue(new Array<string>(OVER_THE_LIMIT).fill("a.ts"));

    expect(crowdedLayers()).toEqual([]);
  });

  it("should read a feature's commands only out of its entry point", () => {
    featureFoldersSpy.mockReturnValue(["live-game"]);
    walking([], ["live-game-feature.ts", "card-service.ts"]);
    readSpy.mockReturnValue('command: "one" command: "two"');
    sourceFilesInSpy.mockReturnValue([]);

    crowdedLayers();

    expect(readSpy).toHaveBeenCalledWith(join("src/features", "live-game", "live-game-feature.ts"));
    expect(readSpy).not.toHaveBeenCalledWith(join("src/features", "live-game", "card-service.ts"));
  });
});
